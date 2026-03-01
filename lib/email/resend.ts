import { Resend } from 'resend';

const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

const FROM_EMAIL = 'Flux Board <updates@mail.fluxboard.site>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    console.log('⚠️ Resend API Key missing. Skipping email.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: 'updates@fluxboard.site',
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
