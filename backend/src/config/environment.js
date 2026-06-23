import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4100),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || "das-local-development-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5174",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "SmileCare <no-reply@smilecare.local>",
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  MAIL_DEV_RETURN_OTP: process.env.MAIL_DEV_RETURN_OTP === "true",
  PASSWORD_RESET_OTP_TTL_MINUTES: Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10)
};
