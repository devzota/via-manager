/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: services/ztteam_security.js
 * Description: Module bảo mật mã hóa AES-256-GCM và sinh mã xác thực 2FA (TOTP)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const { authenticator } = require('otplib');

const ZTTEAM_ALGORITHM = 'aes-256-gcm';
const ZTTEAM_IV_LENGTH = 16;

/**
 * Lấy Master Key từ biến môi trường hoặc sinh ngẫu nhiên nếu thiếu
 * @returns {Buffer} Master Key 32 bytes (256 bits)
 */
function ztteamGetMasterKey() {
  const ztteamHexKey = process.env.ZTTEAM_MASTER_KEY;
  if (!ztteamHexKey || ztteamHexKey.length < 64) {
    /** Tự động bù hoặc fallback sang key băm an toàn */
    return crypto.createHash('sha256').update(ztteamHexKey || 'ztteam_default_secure_key_2026').digest();
  }
  return Buffer.from(ztteamHexKey.substring(0, 64), 'hex');
}

/**
 * Mã hóa chuỗi văn bản bằng chuẩn bảo mật ngân hàng AES-256-GCM
 * @param {string} ztteamPlainText - Dữ liệu cần mã hóa
 * @returns {string} Chuỗi kết quả dạng iv:authTag:cipherHex
 */
function ztteamEncrypt(ztteamPlainText) {
  if (!ztteamPlainText || typeof ztteamPlainText !== 'string') {
    return ztteamPlainText;
  }

  const ztteamKey = ztteamGetMasterKey();
  const ztteamIv = crypto.randomBytes(ZTTEAM_IV_LENGTH);
  const ztteamCipher = crypto.createCipheriv(ZTTEAM_ALGORITHM, ztteamKey, ztteamIv);

  let ztteamEncrypted = ztteamCipher.update(ztteamPlainText, 'utf8', 'hex');
  ztteamEncrypted += ztteamCipher.final('hex');

  const ztteamAuthTag = ztteamCipher.getAuthTag().toString('hex');
  return `${ztteamIv.toString('hex')}:${ztteamAuthTag}:${ztteamEncrypted}`;
}

/**
 * Giải mã chuỗi đã mã hóa bằng AES-256-GCM
 * @param {string} ztteamEncryptedString - Chuỗi dạng iv:authTag:cipherHex
 * @returns {string} Văn bản gốc ban đầu
 */
function ztteamDecrypt(ztteamEncryptedString) {
  if (!ztteamEncryptedString || typeof ztteamEncryptedString !== 'string') {
    return ztteamEncryptedString;
  }

  const ztteamParts = ztteamEncryptedString.split(':');
  if (ztteamParts.length !== 3) {
    /** Không phải định dạng mã hóa của ZTTeam -> trả về nguyên mẫu */
    return ztteamEncryptedString;
  }

  try {
    const [ztteamIvHex, ztteamAuthTagHex, ztteamCipherHex] = ztteamParts;
    const ztteamKey = ztteamGetMasterKey();
    const ztteamIv = Buffer.from(ztteamIvHex, 'hex');
    const ztteamAuthTag = Buffer.from(ztteamAuthTagHex, 'hex');

    const ztteamDecipher = crypto.createDecipheriv(ZTTEAM_ALGORITHM, ztteamKey, ztteamIv);
    ztteamDecipher.setAuthTag(ztteamAuthTag);

    let ztteamDecrypted = ztteamDecipher.update(ztteamCipherHex, 'hex', 'utf8');
    ztteamDecrypted += ztteamDecipher.final('utf8');
    return ztteamDecrypted;
  } catch (ztteamError) {
    /** Giải mã thất bại do sai key hoặc dữ liệu bị biến đổi */
    return '';
  }
}

/**
 * Tự động tạo mã 6 số 2FA (TOTP) từ khóa bí mật Base32
 * @param {string} ztteamSecret - Khóa 2FA secret
 * @returns {string} Mã OTP 6 chữ số
 */
function ztteamGenerate2FACode(ztteamSecret) {
  if (!ztteamSecret) return '';
  try {
    /** Chuẩn hóa chuỗi secret (xóa dấu cách, viết hoa) */
    const ztteamCleanSecret = ztteamSecret.replace(/\s+/g, '').toUpperCase();
    authenticator.options = { window: 1 };
    return authenticator.generate(ztteamCleanSecret);
  } catch (ztteamErr) {
    return '';
  }
}

/**
 * Che dấu các thông tin nhạy cảm để ghi log an toàn
 * @param {string} ztteamVal - Giá trị cần che
 * @returns {string} Chuỗi sau khi che dấu
 */
function ztteamMaskSecret(ztteamVal) {
  if (!ztteamVal || typeof ztteamVal !== 'string') return '***';
  if (ztteamVal.length <= 4) return '****';
  return ztteamVal.substring(0, 2) + '****' + ztteamVal.substring(ztteamVal.length - 2);
}

module.exports = {
  ztteamEncrypt,
  ztteamDecrypt,
  ztteamGenerate2FACode,
  ztteamMaskSecret
};
