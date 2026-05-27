import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { authConfig } from '@/lib/auth.config';
import bcrypt from 'bcryptjs';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';
import { sendWelcomeEmail } from '@/lib/email/auth-emails';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    pages: {
        signIn: '/login',
        error: '/login',
        newUser: '/onboarding',
    },
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

                const email = (credentials.email as string).toLowerCase().trim();
                const now = new Date();

                // Check admin credentials first (env-based) — admin also respects lockout
                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
                if (adminEmail && adminPasswordHash && email === adminEmail.toLowerCase()) {
                    const isValid = await bcrypt.compare(credentials.password as string, adminPasswordHash);
                    if (!isValid) return null;
                    return { id: 'admin-session', email: adminEmail, name: 'Admin', isAdmin: true };
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email }).select(
                        '+password +failedLoginAttempts +lockoutUntil +emailVerified'
                    );

                    if (user?.lockoutUntil && user.lockoutUntil > now) {
                        console.warn(`[Auth] Login attempt on locked account: ${email}`);
                        return null;
                    }

                    if (!user || !user.password) {
                        if (user) {
                            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                                user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                            }
                            await user.save();
                        }
                        return null;
                    }

                    const isValidPassword = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isValidPassword) {
                        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                            user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                        }
                        await user.save();
                        return null;
                    }

                    if (!user.emailVerified) {
                        console.warn(`[Auth] Login blocked — email not verified: ${email}`);
                        return null;
                    }

                    user.failedLoginAttempts = 0;
                    user.lockoutUntil = undefined;
                    await user.save();

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
                    const existingUser = await User.findOne({
                        email: user.email.toLowerCase(),
                    }).select('+password');

                    let userId: string | undefined;

                    if (!existingUser) {
                        try {
                            const newUser = await User.create({
                                email: user.email.toLowerCase(),
                                name: user.name || 'Unknown',
                                image: user.image || undefined,
                                emailVerified: new Date(),
                            });
                            userId = newUser._id.toString();
                            // Send welcome email for new Google OAuth accounts (non-blocking)
                            sendWelcomeEmail(newUser.email, newUser.name).catch((err) =>
                                console.error('[Auth] Welcome email failed (non-fatal):', err)
                            );
                        } catch (creationError) {
                            console.error('[Auth] Error creating user from Google:', creationError);
                            return '/login?error=OAuthCreateAccount';
                        }
                    } else if (existingUser.password) {
                        return '/login?error=account-exists-with-credentials';
                    } else {
                        if (user.image && existingUser.image !== user.image) {
                            existingUser.image = user.image;
                            await existingUser.save();
                        }
                        userId = existingUser._id.toString();
                    }

                    // Process workspace invites (non-blocking — don't fail sign-in)
                    if (userId && user.email) {
                        try {
                            await addUserToWorkspaceFromInvite(userId, user.email);
                        } catch (inviteError) {
                            console.error('[Auth] Invite processing failed (non-fatal):', inviteError);
                        }
                    }
                } else if (account?.provider === 'credentials' && user.email && user.id) {
                    try {
                        await connectDB();
                        await addUserToWorkspaceFromInvite(user.id, user.email);
                    } catch (inviteError) {
                        console.error('[Auth] Invite processing failed (non-fatal):', inviteError);
                    }
                }
                return true;
            } catch (error) {
                console.error('[Auth] SignIn callback error:', error);
                return '/login?error=OAuthCallback';
            }
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                // Initial sign-in: resolve the MongoDB ObjectId
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.email = dbUser.email;
                        if (dbUser.image) token.picture = dbUser.image;
                    } else {
                        console.error('[Auth] JWT: user not found in DB after sign-in for:', user.email);
                        token.id = undefined;
                        if (user.email) token.email = user.email;
                    }
                } catch (error) {
                    console.error('[Auth] JWT callback error during sign in:', error);
                    token.id = undefined;
                    if (user.email) token.email = user.email;
                }
                return token;
            }

            // Subsequent requests: if token.id is missing, try to resolve it from DB
            if (!token.id && token.email) {
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: token.email });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        if (dbUser.image) token.picture = dbUser.image;
                    }
                } catch (error) {
                    console.error('[Auth] JWT callback error resolving user ID:', error);
                }
                return token;
            }

            // Refresh user picture on update trigger
            if (token.id && trigger === 'update') {
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: token.email });
                    if (dbUser?.image) {
                        token.picture = dbUser.image;
                    }
                } catch (error) {
                    console.error('[Auth] JWT callback error refreshing user:', error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                if (token.id) session.user.id = token.id;
                if (token.picture) session.user.image = token.picture;
                if (token.email) session.user.email = token.email;
                session.accessToken = token.accessToken as string | undefined;
            }
            return session;
        },
    },
});
