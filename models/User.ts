import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    password?: string;
    emailVerified?: Date;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    emailOtp?: string;
    emailOtpExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    failedLoginAttempts: number;
    lockoutUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    tutorialProgress?: {
        hasSeenWelcome: boolean;
        hasSeenDashboard: boolean;
        hasSeenBoard: boolean;
        hasSeenSettings: boolean;
    };
    onboardingProgress?: {
        createdFirstBoard: boolean;
        addedFirstTeamMember: boolean;
        createdFirstTask: boolean;
        completedFirstDragDrop: boolean;
        completedTutorial: boolean;
        dismissedAt?: Date;
        referralPromptShown?: boolean;
        planWithAIIntroShown?: boolean;
    };
    hasCompletedOnboarding: boolean;
    notificationPreferences?: {
        taskAssigned: boolean;
        comments: boolean;
    };
    // Billing fields
    plan: PlanType;
    paystackCustomerCode?: string;
    subscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlanId?: string;
    billingEmail?: string;
    trialEndsAt?: Date;
    hasUsedTrial: boolean;
    trialIpAddress?: string;
    trialWarningSent: boolean;
    trialPromptDismissedAt?: Date;
    lastUpgradeAt?: Date;
    // Dunning: when the subscription first went past_due, and whether the
    // past-due reminder email has been sent for the current dunning cycle.
    pastDueSince?: Date;
    pastDueReminderSent?: boolean;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
        image: { type: String },
        password: { type: String, select: false },
        emailVerified: { type: Date },
        emailVerificationToken: { type: String },
        emailVerificationExpires: { type: Date },
        emailOtp: { type: String },
        emailOtpExpires: { type: Date },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        failedLoginAttempts: { type: Number, default: 0 },
        lockoutUntil: { type: Date },
        tutorialProgress: {
            hasSeenWelcome: { type: Boolean, default: false },
            hasSeenDashboard: { type: Boolean, default: false },
            hasSeenBoard: { type: Boolean, default: false },
            hasSeenSettings: { type: Boolean, default: false },
        },
        onboardingProgress: {
            createdFirstBoard: { type: Boolean, default: false },
            addedFirstTeamMember: { type: Boolean, default: false },
            createdFirstTask: { type: Boolean, default: false },
            completedFirstDragDrop: { type: Boolean, default: false },
            completedTutorial: { type: Boolean, default: false },
            dismissedAt: { type: Date },
            referralPromptShown: { type: Boolean, default: false },
            planWithAIIntroShown: { type: Boolean, default: false },
        },
        hasCompletedOnboarding: { type: Boolean, default: false },
        notificationPreferences: {
            taskAssigned: { type: Boolean, default: true },
            comments: { type: Boolean, default: true },
        },
        // Billing fields
        plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
        paystackCustomerCode: { type: String },
        subscriptionId: { type: String },
        subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due'], default: 'inactive' },
        subscriptionPlanId: { type: String },
        billingEmail: { type: String },
        trialEndsAt: { type: Date },
        hasUsedTrial: { type: Boolean, default: false },
        trialIpAddress: { type: String },
        trialWarningSent: { type: Boolean, default: false },
        trialPromptDismissedAt: { type: Date },
        lastUpgradeAt: { type: Date },
        pastDueSince: { type: Date },
        pastDueReminderSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

UserSchema.index({ paystackCustomerCode: 1 }, { sparse: true });
UserSchema.index({ subscriptionId: 1 }, { sparse: true });
UserSchema.index({ trialIpAddress: 1 }, { sparse: true });
UserSchema.index({ trialEndsAt: 1 }, { sparse: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
