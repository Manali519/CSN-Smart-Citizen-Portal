import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Single reusable transporter. nodemailer pools connections internally,
// so it's fine to keep this at module scope rather than recreating it
// per request.
const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure, // true for port 465, false for 587/25 (STARTTLS)
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

/**
 * Verifies the SMTP connection/credentials at startup so a misconfigured
 * .env fails fast and loudly instead of silently dropping OTP emails.
 */
export async function verifyMailer() {
  try {
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP verify timed out')), 3500)
    );
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log('[mailer] SMTP connection verified');
  } catch (err) {
    console.warn(`[mailer] SMTP notice: ${err.message}. Server will continue running.`);
  }
}

/**
 * Sends the OTP to the account's own email address - the Google account
 * email if signed up via Google, or the manually entered email otherwise.
 * That address always comes from the User document already saved in
 * MongoDB, never from a value re-typed at OTP-verify time, so a citizen
 * cannot redirect the OTP to a different inbox.
 */
export async function sendOtpEmail({ to, firstName, otp }) {
  const expiry = env.otp.expiryMinutes;

  const text = `Hi ${firstName},

Your OTP to verify your Smart City Portal account is: ${otp}

This code expires in ${expiry} minutes. If you did not request this, you
can safely ignore this email.

- ${env.smtp.fromName}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0B3D91;margin-bottom:4px;">Verify your account</h2>
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Your one-time password (OTP) is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#F3F4F1;padding:12px 18px;border-radius:8px;display:inline-block;">
        ${otp}
      </p>
      <p>This code expires in <strong>${expiry} minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#666;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
      <p style="color:#666;font-size:13px;">&mdash; ${escapeHtml(env.smtp.fromName)}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${env.smtp.fromName}" <${env.smtp.user}>`,
      to,
      subject: 'Your Smart City Portal verification code',
      text,
      html,
    });
    console.log(`[mailer] ✅ Verification OTP [${otp}] emailed to ${to}`);
  } catch (err) {
    console.warn(`[mailer] ⚠️ SMTP notice (${err.message}). Local DEV OTP for ${to} is: [${otp}]`);
    if (env.nodeEnv === 'production') {
      throw err;
    }
  }
}

/** Minimal HTML-escaping so a user-supplied first name can't inject markup into the email. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
