'use server';

import { connectDB } from '@/lib/db';
import { Contact, ContactSubject } from '@/models/Contact';

interface SubmitContactParams {
    name: string;
    email: string;
    company?: string;
    subject: ContactSubject;
    message: string;
}

export async function submitContact(formData: SubmitContactParams) {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        return { error: 'All required fields must be filled' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return { error: 'Invalid email address' };
    }

    try {
        await connectDB();

        const contact = await Contact.create({
            name: formData.name,
            email: formData.email,
            company: formData.company || '',
            subject: formData.subject,
            message: formData.message,
        });

        return { success: true, id: contact._id };
    } catch (error) {
        console.error('Failed to submit contact form:', error);
        return { error: 'Failed to submit contact form. Please try again.' };
    }
}
