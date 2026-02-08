import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    password?: string;
    emailVerified?: Date;
    createdAt: Date;
    updatedAt: Date;
    tutorialProgress?: {
        hasSeenWelcome: boolean;
        hasSeenDashboard: boolean;
        hasSeenBoard: boolean;
        hasSeenSettings: boolean;
    };
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        image: { type: String },
        password: { type: String, select: false },
        emailVerified: { type: Date },
        tutorialProgress: {
            hasSeenWelcome: { type: Boolean, default: false },
            hasSeenDashboard: { type: Boolean, default: false },
            hasSeenBoard: { type: Boolean, default: false },
            hasSeenSettings: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
