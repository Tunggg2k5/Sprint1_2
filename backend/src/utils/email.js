import nodemailer from "nodemailer";
import { env } from "../config/environment.js";

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
}

function createTransporter() {
  if (hasSmtpConfig()) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
}

export async function sendPasswordResetOtp({ to, fullName, otp, expiresInMinutes }) {
  const transporter = createTransporter();
  const result = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Ma OTP dat lai mat khau SmileCare",
    text: [
      `Xin chao ${fullName || "ban"},`,
      "",
      `Ma OTP dat lai mat khau SmileCare cua ban la: ${otp}`,
      `Ma co hieu luc trong ${expiresInMinutes} phut.`,
      "",
      "Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay."
    ].join("\n"),
    html: `
      <p>Xin chao <strong>${escapeHtml(fullName || "ban")}</strong>,</p>
      <p>Ma OTP dat lai mat khau SmileCare cua ban la:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p>
      <p>Ma co hieu luc trong ${expiresInMinutes} phut.</p>
      <p>Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.</p>
    `
  });

  return {
    sent: hasSmtpConfig(),
    messageId: result.messageId
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
