import { sendEmail } from './resend';

const BRAND_COLOR = '#7c3aed';
const APP_URL = process.env.NEXTAUTH_URL || 'https://fluxboard.site';

export async function sendOtpEmail(to: string, name: string, otp: string) {
    return sendEmail({
        to,
        subject: 'Your Flux verification code',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,${BRAND_COLOR},#a855f7,#ec4899)"></td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:28px">
              <span style="font-size:22px;font-weight:900;color:#111">flux</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111">Verify your email</h1>
            <p style="margin:0 0 32px;color:#6b7280;font-size:15px">Hi ${name}, enter this code in the Flux app to verify your email address.</p>
            <div style="background:#f4f4f8;border-radius:12px;padding:24px;margin-bottom:32px;letter-spacing:12px;text-align:center">
              <span style="font-size:40px;font-weight:800;color:${BRAND_COLOR};font-family:'Courier New',monospace">${otp}</span>
            </div>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px">This code expires in <strong>10 minutes</strong>.</p>
            <p style="margin:0;color:#9ca3af;font-size:12px">If you didn't create a Flux account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">Flux Board &bull; <a href="${APP_URL}" style="color:${BRAND_COLOR};text-decoration:none">fluxboard.site</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
    return sendEmail({
        to,
        subject: 'Reset your Flux password',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,${BRAND_COLOR},#a855f7,#ec4899)"></td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;text-align:center">
            <div style="margin-bottom:28px">
              <span style="font-size:22px;font-weight:900;color:#111">flux</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111">Reset your password</h1>
            <p style="margin:0 0 32px;color:#6b7280;font-size:15px">Hi ${name}, click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:32px">Reset Password</a>
            <p style="margin:0 0 8px;color:#9ca3af;font-size:12px">Or copy this link into your browser:</p>
            <p style="margin:0;color:#6b7280;font-size:11px;word-break:break-all">${resetUrl}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">If you didn't request a password reset, ignore this email. &bull; <a href="${APP_URL}" style="color:${BRAND_COLOR};text-decoration:none">fluxboard.site</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
}
