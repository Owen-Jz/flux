import { loadEnvConfig } from '@next/env';
import { Resend } from 'resend';

// Load environment variables (.env.local where RESEND_API_KEY is stored)
const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function testEmail() {
    console.log('✉️ Starting email test...');

    // Testing the email the user requested (and standard gmail in case of a typo)
    const targetEmail = 'owendigitals@gmail.com';
    const targetEmailTypo = 'owendigitals@gmai.com';

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ Missing RESEND_API_KEY in environment');
        process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Flux Board <updates@owendigitals.work>',
            to: targetEmail,
            subject: 'Test Email from Flux Board 🚀',
            html: `
                <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                    <h1 style="color: #4f46e5;">It works!</h1>
                    <p>This is a test email sent directly from your <strong>Flux Workspace</strong> local development environment.</p>
                    <p>If you are reading this, your Resend API integration is functioning perfectly!</p>
                </div>
            `,
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
        } else {
            console.log(`✅ Sent test email attempt to ${targetEmail} (ID: ${data?.id})`);
        }

        // Try the exact string the user gave as well just in case
        const { data: data2, error: error2 } = await resend.emails.send({
            from: 'Flux Board <updates@owendigitals.work>',
            to: targetEmailTypo,
            subject: 'Test Email from Flux Board 🚀',
            html: '<p>Test email (typo version)</p>'
        });

        if (error2) {
            console.error(`❌ Resend API Error sending to typo email:`, error2);
        } else {
            console.log(`✅ Sent email attempt to ${targetEmailTypo} (ID: ${data2?.id})`);
        }

        console.log('🎉 Email test complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to construct or send email', e);
        process.exit(1);
    }
}

testEmail();
