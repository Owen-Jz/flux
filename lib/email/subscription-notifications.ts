import { sendEmail } from './resend';

export async function sendSubscriptionActivatedEmail(user: { email?: string; name?: string }, plan: string) {
  if (!user.email) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux subscription is now active</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your Flux subscription is now <strong>active</strong>! You are on the <strong>${plan}</strong> plan.
  </p>

  <p style="font-size: 16px; margin-bottom: 30px;">
    You now have access to all Flux features including advanced project management, team collaboration tools, and priority support.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Go to Dashboard
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    Thank you for choosing Flux!
  </p>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux subscription has been cancelled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your Flux subscription has been <strong>cancelled</strong>.
  </p>

  <p style="font-size: 16px; margin-bottom: 30px;">
    You will continue to have access to your current features until the end of your billing period. After that, your account will be moved to the free tier.
  </p>

  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
    If you have any questions or concerns, please contact our support team.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Go to Dashboard
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    Thank you for being a Flux customer!
  </p>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment issue with your Flux subscription</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    We were unable to process your payment for your Flux subscription.
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your subscription status is now <strong>past due</strong>. Please update your payment method to avoid any service interruption.
  </p>

  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
    To update your payment method, please visit your account settings or billing dashboard.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Update Payment
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    If you have any questions, please contact our support team.
  </p>
</body>
</html>
  `.trim();

  sendEmail({
    to: user.email,
    subject: 'Payment issue with your Flux subscription',
    html,
  }).catch((error) => {
    console.error('Failed to send subscription past due email:', error);
  });
}

export async function sendSubscriptionDisabledEmail(user: { email?: string; name?: string }) {
  if (!user.email) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux subscription has been disabled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your Flux subscription has been <strong>disabled</strong> due to payment failure or cancellation.
  </p>

  <p style="font-size: 16px; margin-bottom: 30px;">
    Your account has been moved to the <strong>free tier</strong>. You can still access basic Flux features, but premium features are now unavailable.
  </p>

  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
    To reactivate your subscription, please visit your billing settings.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Go to Dashboard
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    If you believe this is an error, please contact our support team.
  </p>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux trial is expiring soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your Flux trial is expiring in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    After your trial ends, your account will be moved to the free tier. Upgrade anytime before expiration to keep your premium features.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Upgrade Now
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    Thank you for trying Flux!
  </p>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux trial has expired</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your Flux trial has <strong>expired</strong>. Your account has been moved to the free tier.
  </p>

  <p style="font-size: 16px; margin-bottom: 30px;">
    You can still access basic Flux features. Upgrade anytime to unlock premium features and continue using advanced project management tools.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Go to Dashboard
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    Thank you for trying Flux!
  </p>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Flux Pro trial has started — 14 days free</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi${user.name ? ` ${user.name}` : ''},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your 14-day Pro trial is now <strong>active</strong>!
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your <strong>${plan}</strong> trial ends on <strong>${expirationDate}</strong>. Here is what's unlocked during your trial:
  </p>

  <ul style="font-size: 15px; color: #444; margin-bottom: 24px; padding-left: 20px;">
    <li style="margin-bottom: 8px;">Unlimited boards</li>
    <li style="margin-bottom: 8px;">25 team members</li>
    <li style="margin-bottom: 8px;">Priority support</li>
    <li style="margin-bottom: 8px;">Advanced analytics</li>
    <li style="margin-bottom: 8px;">Admin controls</li>
    <li style="margin-bottom: 8px;">API access</li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.fluxboard.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Start Using Pro
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    Thank you for choosing Flux!
  </p>
</body>
</html>
  `.trim();

  sendEmail({
    to: user.email,
    subject: 'Your Flux Pro trial has started — 14 days free',
    html,
  }).catch((error) => {
    console.error('Failed to send trial started email:', error);
  });
}
