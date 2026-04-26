'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { Admin } from '@/models/Admin';
import { sendEmail } from '@/lib/email/resend';
import { Types } from 'mongoose';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EnterpriseInquiry {
    name: string;
    email: string;
    company: string;
    phone?: string;
    teamSize: string;
    message?: string;
}

function validateInquiry(data: unknown): { valid: true; inquiry: EnterpriseInquiry } | { valid: false; error: string } {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid request body' };
    }

    const obj = data as Record<string, unknown>;

    if (!obj.name || typeof obj.name !== 'string' || obj.name.trim().length === 0) {
        return { valid: false, error: 'Name is required' };
    }

    if (!obj.email || typeof obj.email !== 'string' || !EMAIL_REGEX.test(obj.email)) {
        return { valid: false, error: 'Valid email is required' };
    }

    if (!obj.company || typeof obj.company !== 'string' || obj.company.trim().length === 0) {
        return { valid: false, error: 'Company is required' };
    }

    if (!obj.teamSize || typeof obj.teamSize !== 'string') {
        return { valid: false, error: 'Team size is required' };
    }

    const validTeamSizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
    if (!validTeamSizes.includes(obj.teamSize)) {
        return { valid: false, error: 'Invalid team size' };
    }

    return {
        valid: true,
        inquiry: {
            name: (obj.name as string).trim(),
            email: (obj.email as string).trim().toLowerCase(),
            company: (obj.company as string).trim(),
            phone: typeof obj.phone === 'string' ? obj.phone.trim() : undefined,
            teamSize: obj.teamSize as string,
            message: typeof obj.message === 'string' ? obj.message.trim() : undefined,
        },
    };
}

async function getSystemAdmin(): Promise<Types.ObjectId | null> {
    const admin = await Admin.findOne({}).sort({ createdAt: 1 }).lean();
    return admin?._id as Types.ObjectId || null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = validateInquiry(body);

        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const inquiry = validation.inquiry;
        await connectDB();

        const adminId = await getSystemAdmin();
        if (!adminId) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        await AuditLog.create({
            adminId,
            action: 'ENTERPRISE_INQUIRY',
            targetType: 'admin',
            targetId: adminId,
            details: {
                name: inquiry.name,
                email: inquiry.email,
                company: inquiry.company,
                phone: inquiry.phone || null,
                teamSize: inquiry.teamSize,
                message: inquiry.message || null,
            },
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 16px; color: #111827; }
        .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .team-size-badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Enterprise Inquiry</h1>
            <p>New enterprise plan inquiry received</p>
        </div>
        <div class="content">
            <div class="field">
                <div class="field-label">Name</div>
                <div class="field-value">${inquiry.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</div>
            </div>
            <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value"><a href="mailto:${inquiry.email}">${inquiry.email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</a></div>
            </div>
            <div class="field">
                <div class="field-label">Company</div>
                <div class="field-value">${inquiry.company.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</div>
            </div>
            ${inquiry.phone ? `
            <div class="field">
                <div class="field-label">Phone</div>
                <div class="field-value"><a href="tel:${inquiry.phone.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}">${inquiry.phone.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</a></div>
            </div>
            ` : ''}
            <div class="field">
                <div class="field-label">Team Size</div>
                <div class="field-value"><span class="team-size-badge">${inquiry.teamSize.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</span></div>
            </div>
            ${inquiry.message ? `
            <div class="field">
                <div class="field-label">Message</div>
                <div class="message-box">${inquiry.message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</div>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            This inquiry was submitted on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>
</body>
</html>
`;

        await sendEmail({
            to: 'updates@fluxboard.site',
            subject: `Enterprise Inquiry: ${inquiry.company} (${inquiry.teamSize} team)`,
            html: htmlContent,
        });

        return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (error) {
        console.error('Enterprise inquiry error:', error);
        return NextResponse.json(
            { error: 'Failed to process inquiry' },
            { status: 500 }
        );
    }
}