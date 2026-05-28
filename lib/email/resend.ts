import { Resend } from 'resend';

const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

const FROM_EMAIL = 'Flux Board <updates@mail.fluxboard.site>';

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
      replyTo: 'updates@fluxboard.site',
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
    console.error('[Resend] CRITICAL: RESEND_API_KEY missing — email dropped', { to, subject });
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
      // Resend SDK returns a structured error object instead of throwing on
      // 4xx responses. Surface every field so the cause is greppable in
      // Vercel logs (domain unverified, suppressed recipient, invalid key,
      // rate limit, etc.) — the previous shape printed `[Object]` here.
      console.error('[Resend] send failed', {
        to,
        subject,
        from: FROM_EMAIL,
        errorName: (error as { name?: string }).name,
        errorMessage: (error as { message?: string }).message,
        errorStatusCode: (error as { statusCode?: number }).statusCode,
      });
      emailRetryQueue.push({ to, subject, html, attempts: 0, lastError: (error as { message?: string }).message || 'unknown' });
      console.warn(`[Resend] retry queue size now ${emailRetryQueue.length}`);
      return;
    }

    if (data) {
      console.log('[Resend] sent', { id: data.id, to, subject });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Resend] CRITICAL: network/SDK threw', { to, subject, errorMessage });
    emailRetryQueue.push({ to, subject, html, attempts: 0, lastError: errorMessage });
    console.warn(`[Resend] retry queue size now ${emailRetryQueue.length}`);
  }

  // Trigger retry processing in background (non-blocking)
  if (emailRetryQueue.length > 0) {
    processEmailRetryQueue().catch((err) => {
      console.error('[Resend] background retry processing failed:', err);
    });
  }
}
