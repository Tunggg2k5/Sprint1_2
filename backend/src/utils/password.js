import bcrypt from "bcryptjs";

export function assertValidPassword(password) {
  if (!password || password.length < 8) {
    throw createUtilityError("Mat khau phai co it nhat 8 ky tu.");
  }
  if (password.length > 72) {
    throw createUtilityError("Mat khau toi da 72 ky tu.");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw createUtilityError("Mat khau can co ca chu cai va chu so.");
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password || "", passwordHash || "");
}

function createUtilityError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
