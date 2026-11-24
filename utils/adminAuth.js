// utils/adminAuth.js
const crypto = require("crypto");

function isValidAdminPassword(inputPassword) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof inputPassword !== "string" || !inputPassword) {
    return false;
  }

  const inputBuf = Buffer.from(inputPassword, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (inputBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

module.exports = { isValidAdminPassword };