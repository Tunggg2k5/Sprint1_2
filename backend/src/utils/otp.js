import crypto from "crypto";

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max + 1));
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export function otpExpiresAt(minutes = 10) {
  return new Date(Date.now() + Number(minutes || 10) * 60 * 1000);
}
