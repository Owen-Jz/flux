import { Resend } from 'resend';

const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

const FROM_EMAIL = 'Flux <noreply@cresiolabs.rg>';

// Simple in-memory retry queue for failed emails
const emailRetryQueue: Array<{ to: string; subject: string; html: string; attempts: number; lastError?: string }> = [];

async function processEmailRetryQueue() {
  if (emailRetryQueue.length === 0) return;

  const resend = getResendClient();
  if (!resend) return;

  const email = emailRetryQueue[0];

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: 'noreply@cresiolabs.rg',
      to: email.to,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      email.attempts++;
      email.lastError = error.message;
      console.error(`Email retry failed (attempt ${email.attempts}):`, error);
      return;
    }

    if (data) {
      console.log(`Email retry successful: ${data.id}, to: ${email.to}`);
      emailRetryQueue.shift();
    }
  } catch (error) {
    email.attempts++;
    email.lastError = error instanceof Error ? error.message : String(error);
    console.error(`Email retry error (attempt ${email.attempts}):`, error);
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    console.error('CRITICAL: Resend API Key missing. Email not sent to:', to, 'Subject:', subject);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: 'noreply@cresiolabs.rg',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend API Error for email to', to, ':', error);
      // Add to retry queue with higher severity logging
      emailRetryQueue.push({ to, subject, html, attempts: 0, lastError: error.message });
      console.warn(`Email added to retry queue. Queue size: ${emailRetryQueue.length}`);
      return;
    }

    if (data) {
      console.log('Email sent successfully:', data.id, 'to:', to);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('CRITICAL: Failed to send email to', to, '- Error:', errorMessage);
    // Add to retry queue
    emailRetryQueue.push({ to, subject, html, attempts: 0, lastError: errorMessage });
    console.warn(`Email added to retry queue. Queue size: ${emailRetryQueue.length}`);
  }

  // Trigger retry processing in background (non-blocking)
  if (emailRetryQueue.length > 0) {
    processEmailRetryQueue().catch((err) => {
      console.error('Background email retry processing failed:', err);
    });
  }
}
