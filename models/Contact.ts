'use server';

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ContactSubject = 'general' | 'sales' | 'support' | 'partnership' | 'press';

export interface IContact extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    company?: string;
    subject: ContactSubject;
    message: string;
    status: 'new' | 'read' | 'replied';
    createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        company: { type: String },
        subject: {
            type: String,
            enum: ['general', 'sales', 'support', 'partnership', 'press'],
            required: true,
        },
        message: { type: String, required: true },
        status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    },
    { timestamps: true }
);

// Index for efficient querying
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ status: 1 });

export const Contact: Model<IContact> =
    mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
