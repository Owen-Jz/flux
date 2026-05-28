import { render } from '@react-email/components';
import { sendEmail } from './resend';
import { AuthOtpEmail } from '@/components/emails/auth-otp';
import { AuthPasswordResetEmail } from '@/components/emails/auth-password-reset';
import { WelcomeEmail } from '@/components/emails/welcome-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.fluxboard.site';

export async function sendOtpEmail(to: string, name: string, otp: string) {
  const html = await render(AuthOtpEmail({ name, otp }));
  return sendEmail({ to, subject: 'Your Flux verification code', html });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
  const html = await render(AuthPasswordResetEmail({ name, resetUrl }));
  return sendEmail({ to, subject: 'Reset your Flux password', html });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = await render(WelcomeEmail({ name }));
  return sendEmail({ to, subject: 'Welcome to Flux!', html });
}
