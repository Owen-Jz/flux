import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Flux Board <updates@owendigitals.work>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ Resend API Key missing. Skipping email.');
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
        console.error('❌ Resend API Error:', error);
        return;
    }

    if (data) {
        console.log('✅ Email sent:', data.id);
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}
