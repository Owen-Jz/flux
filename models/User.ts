import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    password?: string;
    emailVerified?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
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
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        image: { type: String },
        password: { type: String, select: false },
        emailVerified: { type: Date },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
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
    },
    { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
