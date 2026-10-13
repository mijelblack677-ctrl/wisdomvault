// src/lib/mailer.ts
//
// Transactional email for Wisdom Vault, sent through the SMTP mailbox the
// business owns (noreply@vault-of-wisdom.com). Kept in one place so any route
// that needs to email a user (currently the forgot-password flow) reuses the
// same transport, from-address and error handling.
//
// Configuration is read from the environment so no secrets live in the repo:
//   SMTP_HOST   e.g. srv-us-2.nvme-servers.com
//   SMTP_PORT   e.g. 465
//   SMTP_SECURE "true" for implicit TLS (port 465), "false" for STARTTLS
//   SMTP_USER   e.g. noreply@vault-of-wisdom.com
//   SMTP_PASS   mailbox password
//   MAIL_FROM   optional friendly From header (defaults to the noreply address)

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let _transporter: Transporter | null = null;
let _initFailed = false;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;
  if (_initFailed) return null;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error('✉️  Mailer not configured: SMTP_HOST/SMTP_USER/SMTP_PASS missing');
    _initFailed = true;
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  // Port 465 is implicit TLS; 587/25 use STARTTLS. Default to secure.
  const secure = (process.env.SMTP_SECURE || 'true') !== 'false';

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Fail fast — a hung SMTP handshake must never tie up an API request.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  return _transporter;
}

/** Whether the SMTP mailbox is configured (env vars present). */
export function mailIsConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** Send one transactional email. Returns true on success; never throws. */
export async function sendMail(opts: SendMailOptions): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from =
    process.env.MAIL_FROM ||
    `"Wisdom Vault" <${process.env.SMTP_USER || 'noreply@vault-of-wisdom.com'}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      // Reply-To points at the human support mailbox instead of the no-reply
      // sender, so a customer can actually answer a notification email.
      replyTo: opts.replyTo || process.env.MAIL_REPLY_TO || 'support@vault-of-wisdom.com',
    });
    console.log(`✉️  Mail sent to ${opts.to} (${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`✉️  Mail send failed for ${opts.to}:`, (error as Error).message);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Build the branded password-reset email (subject + text + html parts). */
export function passwordResetEmail(
  resetUrl: string,
  userName: string,
  expiresMinutes: number
): { subject: string; text: string; html: string } {
  const firstName = (userName || 'there').split(' ')[0];
  const safeName = escapeHtml(firstName);
  const safeUrl = escapeHtml(resetUrl);
  const subject = 'Reset your Wisdom Vault password';

  const text =
`Hi ${firstName},

We received a request to reset the password for your Wisdom Vault account.

Open this link to choose a new password (valid for ${expiresMinutes} minutes):
${resetUrl}

If you did not request this, you can safely ignore this email — your password
will stay the same.

— Wisdom Vault
https://vault-of-wisdom.com`.trim();

  const html =
`<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f1ee;font-family:Arial,Helvetica,sans-serif;color:#2d2327;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ee;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7ded8;">
            <tr>
              <td style="background:#2d2327;padding:22px 28px;">
                <span style="color:#c09a8a;font-size:13px;letter-spacing:2px;font-weight:bold;">WISDOM VAULT</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#2d2327;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a3f43;">Hi ${safeName},</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a3f43;">
                  We received a request to reset the password for your Wisdom Vault account.
                  Click the button below to choose a new one. This link is valid for ${expiresMinutes} minutes.
                </p>
                <p style="margin:0 0 28px;" align="center">
                  <a href="${safeUrl}" style="display:inline-block;background:#c09a8a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:8px;">Choose a new password</a>
                </p>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#8a7a72;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#6f8fbf;word-break:break-all;">${safeUrl}</p>
                <hr style="border:none;border-top:1px solid #eee5df;margin:0 0 16px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8a7a72;">
                  If you did not request a password reset, you can safely ignore this email —
                  your password will not change.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#faf7f5;padding:16px 28px;font-size:11px;color:#a89c95;">
                Wisdom Vault &bull; vault-of-wisdom.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
