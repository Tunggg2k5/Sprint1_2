export function createValidationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function normalizePhone(phone = "") {
  return String(phone).replace(/\s/g, "");
}

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function normalizeOtp(otp = "") {
  return String(otp).replace(/\s/g, "");
}

export function assertRequired(value, label) {
  if (!String(value ?? "").trim()) {
    throw createValidationError(`${label} là bắt buộc.`);
  }
}

export function assertValidPhone(phone, { required = true } = {}) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone && !required) return "";
  if (!normalizedPhone) throw createValidationError("Số điện thoại là bắt buộc.");

  const isVietnamPhone = /^(0|\+84)\d{8,10}$/.test(normalizedPhone);
  if (!isVietnamPhone) throw createValidationError("Số điện thoại không hợp lệ.");

  return normalizedPhone;
}

export function assertValidEmail(email, { required = true } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail && !required) return "";
  if (!normalizedEmail) throw createValidationError("Email là bắt buộc.");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  if (!isValidEmail) throw createValidationError("Email không hợp lệ.");

  return normalizedEmail;
}

export function assertValidOtp(otp) {
  const normalizedOtp = normalizeOtp(otp);

  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw createValidationError("OTP gồm 6 chữ số.");
  }

  return normalizedOtp;
}
