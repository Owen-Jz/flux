import { render } from '@react-email/components';
import { sendEmail } from './resend';
import { SubscriptionActivatedEmail } from '@/components/emails/subscription-activated';
import { SubscriptionCancelledEmail } from '@/components/emails/subscription-cancelled';
import { SubscriptionPastDueEmail } from '@/components/emails/subscription-past-due';
import { SubscriptionDisabledEmail } from '@/components/emails/subscription-disabled';
import { SubscriptionTrialExpiringEmail } from '@/components/emails/subscription-trial-expiring';
import { SubscriptionTrialExpiredEmail } from '@/components/emails/subscription-trial-expired';
import { SubscriptionTrialStartedEmail } from '@/components/emails/subscription-trial-started';

export async function sendSubscriptionActivatedEmail(user: { email?: string; name?: string }, plan: string) {
  if (!user.email) return;

  const html = await render(SubscriptionActivatedEmail({ name: user.name ?? '', plan }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux subscription is now active',
    html,
  }).catch((error) => {
    console.error('Failed to send subscription activated email:', error);
  });
}

export async function sendSubscriptionCancelledEmail(user: { email?: string; name?: string }, reason?: string) {
  if (!user.email) return;

  void reason;

  const html = await render(SubscriptionCancelledEmail({ name: user.name ?? '' }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux subscription has been cancelled',
    html,
  }).catch((error) => {
    console.error('Failed to send subscription cancelled email:', error);
  });
}

export async function sendSubscriptionPastDueEmail(user: { email?: string; name?: string }) {
  if (!user.email) return;

  const html = await render(SubscriptionPastDueEmail({ name: user.name ?? '' }));

  sendEmail({
    to: user.email,
    subject: 'Action required: payment issue with your Flux subscription',
    html,
  }).catch((error) => {
    console.error('Failed to send subscription past due email:', error);
  });
}

export async function sendSubscriptionDisabledEmail(user: { email?: string; name?: string }) {
  if (!user.email) return;

  const html = await render(SubscriptionDisabledEmail({ name: user.name ?? '' }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux subscription has been disabled',
    html,
  }).catch((error) => {
    console.error('Failed to send subscription disabled email:', error);
  });
}

export async function sendTrialExpiringEmail(user: { email?: string; name?: string }, daysLeft: number) {
  if (!user.email) return;

  const html = await render(SubscriptionTrialExpiringEmail({ name: user.name ?? '', daysLeft }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux trial is expiring soon',
    html,
  }).catch((error) => {
    console.error('Failed to send trial expiring email:', error);
  });
}

export async function sendTrialExpiredEmail(user: { email?: string; name?: string }) {
  if (!user.email) return;

  const html = await render(SubscriptionTrialExpiredEmail({ name: user.name ?? '' }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux trial has expired',
    html,
  }).catch((error) => {
    console.error('Failed to send trial expired email:', error);
  });
}

export async function sendTrialStartedEmail(
  user: { email?: string; name?: string },
  plan: string,
  trialEndsAt: Date
) {
  if (!user.email) return;

  const expirationDate = trialEndsAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = await render(SubscriptionTrialStartedEmail({ name: user.name ?? '', plan, expirationDate }));

  sendEmail({
    to: user.email,
    subject: 'Your Flux Pro trial has started — 14 days free',
    html,
  }).catch((error) => {
    console.error('Failed to send trial started email:', error);
  });
}
