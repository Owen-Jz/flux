import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { authConfig } from '@/lib/auth.config';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';

// Track failed login attempts in memory
const failedLoginAttempts = new Map<string, { count: number; lockoutUntil?: number; lastAttempt: number }>();

// Cleanup old lockout entries every 15 minutes
const LOCKOUT_CLEANUP_INTERVAL = 15 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of failedLoginAttempts.entries()) {
        // Remove entries that have expired lockout (older than 15 minutes)
        if (data.lockoutUntil && data.lockoutUntil < now) {
            failedLoginAttempts.delete(email);
        }
        // Also clean up entries with too many failed attempts but no recent activity (older than 1 hour)
        if (data.lastAttempt && now - data.lastAttempt > 60 * 60 * 1000) {
            failedLoginAttempts.delete(email);
        }
    }
}, LOCKOUT_CLEANUP_INTERVAL);

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const now = Date.now();

                // Check for account lockout due to failed attempts
                const attempts = failedLoginAttempts.get(email);
                if (attempts && attempts.lockoutUntil && attempts.lockoutUntil > now) {
                    console.warn(`[Auth] Login attempt on locked account: ${email}`);
                    return null;
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email }).select('+password');

                    if (!user || !user.password) {
                        // Increment failed attempts even if user doesn't exist
                        // This prevents enumeration attacks
                        const currentAttempts = failedLoginAttempts.get(email) || { count: 0, lastAttempt: now };
                        currentAttempts.count += 1;
                        currentAttempts.lastAttempt = now;
                        if (currentAttempts.count >= 5) {
                            currentAttempts.lockoutUntil = now + 15 * 60 * 1000; // 15 min lockout
                        }
                        failedLoginAttempts.set(email, currentAttempts);
                        return null;
                    }

                    const isValidPassword = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isValidPassword) {
                        // Increment failed attempts
                        const currentAttempts = failedLoginAttempts.get(email) || { count: 0, lastAttempt: now };
                        currentAttempts.count += 1;
                        currentAttempts.lastAttempt = now;
                        if (currentAttempts.count >= 5) {
                            currentAttempts.lockoutUntil = now + 15 * 60 * 1000; // 15 min lockout
                        }
                        failedLoginAttempts.set(email, currentAttempts);
                        return null;
                    }

                    // Successful login - reset failed attempts
                    failedLoginAttempts.delete(email);

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                } catch (error) {
                    console.error('[Auth] Credentials authorize error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account?.provider === 'google' && user.email) {
                    await connectDB();
                    const existingUser = await User.findOne({ email: user.email });
                    let userId: string | undefined;

                    if (!existingUser) {
                        try {
                            const newUser = await User.create({
                                email: user.email,
                                name: user.name || 'Unknown',
                                image: user.image || undefined,
                                emailVerified: new Date(),
                            });
                            userId = newUser._id.toString();
                        } catch (creationError) {
                            console.error('[Auth] Error creating user from Google:', creationError);
                            return false;
                        }
                    } else {
                        userId = existingUser._id.toString();
                    }

                    // Process workspace invites for new or existing users
                    if (userId && user.email) {
                        const addedWorkspaces = await addUserToWorkspaceFromInvite(userId, user.email);
                        if (addedWorkspaces.length > 0) {
                            console.log(`[Auth] Added user to workspaces: ${addedWorkspaces.join(', ')}`);
                        }
                    }
                } else if (account?.provider === 'credentials' && user.email && user.id) {
                    // Process workspace invites for credentials login
                    await connectDB();
                    const addedWorkspaces = await addUserToWorkspaceFromInvite(user.id, user.email);
                    if (addedWorkspaces.length > 0) {
                        console.log(`[Auth] Added user to workspaces: ${addedWorkspaces.join(', ')}`);
                    }
                }
                return true;
            } catch (error) {
                console.error('[Auth] SignIn callback error:', error);
                return false;
            }
        },
        async jwt({ token, user, trigger }) {
            // Always preserve existing token values
            if (token.id) {
                // Token already has ID from previous callback, preserve it
                // Only fetch fresh user data on sign in or if picture is missing
                if (user || !token.picture) {
                    try {
                        await connectDB();
                        const dbUser = await User.findOne({ email: token.email });
                        if (dbUser) {
                            if (!token.id) {
                                token.id = dbUser._id.toString();
                            }
                            if (dbUser.image) {
                                token.picture = dbUser.image;
                            }
                        }
                    } catch (error) {
                        console.error('[Auth] JWT callback error:', error);
                        // Keep existing token values if DB lookup fails
                    }
                }
                // Preserve access token
                return token;
            }

            // Initial sign in - user object is provided
            if (user) {
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.email = dbUser.email;
                        // Ensure image is persisted from DB if available
                        if (dbUser.image) {
                            token.picture = dbUser.image;
                        }
                    } else {
                        // Fallback: use info from user object
                        token.id = user.id;
                        if (user.email) {
                            token.email = user.email;
                        }
                    }
                } catch (error) {
                    console.error('[Auth] JWT callback error during sign in:', error);
                    // Fallback to user object data
                    token.id = user.id;
                    if (user.email) {
                        token.email = user.email;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // Ensure user ID is always set from token
                if (token.id) {
                    session.user.id = token.id;
                }
                if (token.picture) {
                    session.user.image = token.picture;
                }
                // Also copy email to session for reference
                if (token.email) {
                    session.user.email = token.email;
                }
                // Pass the access token for socket.io authentication
                session.accessToken = token.accessToken as string | undefined;
            }
            return session;
        },
    },
});
