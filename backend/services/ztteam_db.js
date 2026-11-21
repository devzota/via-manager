/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: services/ztteam_db.js
 * Description: Module quản lý cơ sở dữ liệu SQLite cục bộ và tích hợp tự động mã hóa AES-256-GCM
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { ztteamEncrypt, ztteamDecrypt } = require('./ztteam_security');

const ZTTEAM_DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(ZTTEAM_DATA_DIR)) {
  fs.mkdirSync(ZTTEAM_DATA_DIR, { recursive: true });
}

const ZTTEAM_DB_PATH = path.join(ZTTEAM_DATA_DIR, 'ztteam_via.db');
let ztteamDbInstance = null;

/**
 * Mở hoặc trả về kết nối Database SQLite
 * @returns {sqlite3.Database} Đối tượng database
 */
function ztteamGetDb() {
  if (!ztteamDbInstance) {
    ztteamDbInstance = new sqlite3.Database(ZTTEAM_DB_PATH);
  }
  return ztteamDbInstance;
}

/**
 * Thực thi câu lệnh SQL dạng Promise (cho INSERT, UPDATE, DELETE)
 * @param {string} ztteamSql - Câu lệnh SQL
 * @param {Array} ztteamParams - Mảng tham số
 * @returns {Promise<{lastID: number, changes: number}>}
 */
function ztteamRunSql(ztteamSql, ztteamParams = []) {
  return new Promise((resolve, reject) => {
    const db = ztteamGetDb();
    db.run(ztteamSql, ztteamParams, function (ztteamErr) {
      if (ztteamErr) {
        reject(ztteamErr);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Truy vấn 1 dòng dữ liệu dạng Promise
 * @param {string} ztteamSql - Câu lệnh SQL
 * @param {Array} ztteamParams - Mảng tham số
 * @returns {Promise<Object|null>}
 */
function ztteamGetOneSql(ztteamSql, ztteamParams = []) {
  return new Promise((resolve, reject) => {
    const db = ztteamGetDb();
    db.get(ztteamSql, ztteamParams, (ztteamErr, ztteamRow) => {
      if (ztteamErr) {
        reject(ztteamErr);
      } else {
        resolve(ztteamRow || null);
      }
    });
  });
}

/**
 * Truy vấn nhiều dòng dữ liệu dạng Promise
 * @param {string} ztteamSql - Câu lệnh SQL
 * @param {Array} ztteamParams - Mảng tham số
 * @returns {Promise<Array>}
 */
function ztteamGetAllSql(ztteamSql, ztteamParams = []) {
  return new Promise((resolve, reject) => {
    const db = ztteamGetDb();
    db.all(ztteamSql, ztteamParams, (ztteamErr, ztteamRows) => {
      if (ztteamErr) {
        reject(ztteamErr);
      } else {
        resolve(ztteamRows || []);
      }
    });
  });
}

/**
 * Khởi tạo cấu trúc các bảng trong cơ sở dữ liệu
 * @returns {Promise<void>}
 */
async function ztteamInitDatabase() {
  /** Bảng tài khoản VIA */
  await ztteamRunSql(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      name TEXT,
      password_enc TEXT,
      two_factor_secret_enc TEXT,
      email TEXT,
      email_pass_enc TEXT,
      cookie_enc TEXT,
      access_token_enc TEXT,
      proxy_enc TEXT,
      category TEXT DEFAULT 'Mặc định',
      status TEXT DEFAULT 'Chưa check',
      friends_count INTEGER DEFAULT 0,
      avatar_url TEXT,
      last_checked_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  /** Tự động bổ sung cột user_agent nếu chưa tồn tại */
  try {
    await ztteamRunSql('ALTER TABLE accounts ADD COLUMN user_agent TEXT');
  } catch (ztteamAlterErr) {
    /** Bỏ qua lỗi nếu cột user_agent đã tồn tại */
  }

  /** Bảng danh mục */
  await ztteamRunSql(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  /** Bảng cấu hình hệ thống */
  await ztteamRunSql(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  /** Bảng nhật ký hoạt động */
  await ztteamRunSql(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_uid TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  /** Thêm danh mục mặc định nếu chưa có */
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('Mặc định')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('Marketing')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('Bán hàng')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('Hỗ trợ')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('VIA Cổ')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('VIA Ngoại')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES ('VIA Kháng')`);

  /** Cấu hình mặc định ban đầu */
  await ztteamRunSql(`INSERT OR IGNORE INTO settings (key, value) VALUES ('concurrency', '3')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO settings (key, value) VALUES ('navigationTimeout', '30000')`);
  await ztteamRunSql(`INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultProxy', '')`);

  /** Tự động giải phóng các tài khoản bị kẹt trạng thái 'Đang chạy' khi server khởi động lại */
  await ztteamRunSql(`UPDATE accounts SET status = 'Live' WHERE status = 'Đang chạy'`);
}

/**
 * Định dạng giải mã dữ liệu an toàn cho 1 tài khoản trước khi trả về
 * @param {Object} ztteamRow - Dòng dữ liệu thô từ database
 * @param {boolean} ztteamIncludeSensitive - Có kèm dữ liệu nhạy cảm đã giải mã hay không
 * @returns {Object} Dữ liệu tài khoản đã chuẩn hóa
 */
function ztteamFormatAccount(ztteamRow, ztteamIncludeSensitive = false) {
  if (!ztteamRow) return null;

  const ztteamResult = {
    id: ztteamRow.id,
    uid: ztteamRow.uid,
    name: ztteamRow.name || `VIA_${ztteamRow.uid}`,
    email: ztteamRow.email || '',
    category: ztteamRow.category || 'Mặc định',
    status: ztteamRow.status || 'Chưa check',
    friendsCount: ztteamRow.friends_count || 0,
    avatarUrl: ztteamRow.avatar_url || '',
    hasPassword: Boolean(ztteamRow.password_enc),
    has2FA: Boolean(ztteamRow.two_factor_secret_enc),
    hasCookie: Boolean(ztteamRow.cookie_enc),
    hasProxy: Boolean(ztteamRow.proxy_enc),
    proxy: ztteamRow.proxy_enc ? (ztteamDecrypt(ztteamRow.proxy_enc) || '') : '',
    lastCheckedAt: ztteamRow.last_checked_at || null,
    createdAt: ztteamRow.created_at,
    updatedAt: ztteamRow.updated_at
  };

  if (ztteamIncludeSensitive) {
    ztteamResult.password = ztteamDecrypt(ztteamRow.password_enc);
    ztteamResult.twoFactorSecret = ztteamDecrypt(ztteamRow.two_factor_secret_enc);
    ztteamResult.emailPass = ztteamDecrypt(ztteamRow.email_pass_enc);
    ztteamResult.cookie = ztteamDecrypt(ztteamRow.cookie_enc);
    ztteamResult.accessToken = ztteamDecrypt(ztteamRow.access_token_enc);
    ztteamResult.proxy = ztteamDecrypt(ztteamRow.proxy_enc);
    ztteamResult.userAgent = ztteamRow.user_agent || '';
  }

  return ztteamResult;
}

/**
 * Lấy danh sách tài khoản theo trang, tìm kiếm và bộ lọc
 * @param {Object} ztteamParams - Tham số lọc và phân trang
 * @returns {Promise<{accounts: Array, total: number, page: number, totalPages: number}>}
 */
async function ztteamGetAccounts({ page = 1, limit = 20, status = '', category = '', search = '' } = {}) {
  const ztteamPageNum = Math.max(1, parseInt(page) || 1);
  const ztteamLimitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const ztteamOffset = (ztteamPageNum - 1) * ztteamLimitNum;

  const ztteamConditions = [];
  const ztteamSqlParams = [];

  if (status && status !== 'Tất cả') {
    ztteamConditions.push('status = ?');
    ztteamSqlParams.push(status);
  }

  if (category && category !== 'Tất cả') {
    ztteamConditions.push('category = ?');
    ztteamSqlParams.push(category);
  }

  if (search) {
    ztteamConditions.push('(uid LIKE ? OR name LIKE ? OR email LIKE ?)');
    const ztteamSearchTerm = `%${search}%`;
    ztteamSqlParams.push(ztteamSearchTerm, ztteamSearchTerm, ztteamSearchTerm);
  }

  const ztteamWhereClause = ztteamConditions.length > 0 ? `WHERE ${ztteamConditions.join(' AND ')}` : '';

  /** Đếm tổng số bản ghi */
  const ztteamCountRow = await ztteamGetOneSql(
    `SELECT COUNT(*) AS totalCount FROM accounts ${ztteamWhereClause}`,
    ztteamSqlParams
  );
  const ztteamTotal = ztteamCountRow ? ztteamCountRow.totalCount : 0;

  /** Lấy danh sách cho trang hiện tại */
  const ztteamRows = await ztteamGetAllSql(
    `SELECT * FROM accounts ${ztteamWhereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
    [...ztteamSqlParams, ztteamLimitNum, ztteamOffset]
  );

  return {
    accounts: ztteamRows.map((row) => ztteamFormatAccount(row, false)),
    total: ztteamTotal,
    page: ztteamPageNum,
    totalPages: Math.ceil(ztteamTotal / ztteamLimitNum) || 1
  };
}

/**
 * Lấy toàn bộ thông tin 1 tài khoản (kèm dữ liệu giải mã) cho Engine chạy
 * @param {string|number} ztteamIdOrUid - ID hoặc UID tài khoản
 * @returns {Promise<Object|null>}
 */
async function ztteamGetAccountForExecution(ztteamIdOrUid) {
  const ztteamRow = await ztteamGetOneSql(
    `SELECT * FROM accounts WHERE id = ? OR uid = ?`,
    [ztteamIdOrUid, String(ztteamIdOrUid)]
  );
  return ztteamRow ? ztteamFormatAccount(ztteamRow, true) : null;
}

/**
 * Thêm một tài khoản mới (tự động mã hóa bảo mật)
 * @param {Object} ztteamData - Thông tin tài khoản
 * @returns {Promise<number>} ID của tài khoản vừa thêm
 */
async function ztteamAddAccount(ztteamData) {
  const {
    uid,
    name,
    password,
    twoFactorSecret,
    email,
    emailPass,
    cookie,
    accessToken,
    proxy,
    category = 'Mặc định'
  } = ztteamData;

  if (!uid) {
    throw new Error('UID là bắt buộc');
  }

  const ztteamPassEnc = password ? ztteamEncrypt(password) : null;
  const ztteam2FaEnc = twoFactorSecret ? ztteamEncrypt(twoFactorSecret) : null;
  const ztteamEmailPassEnc = emailPass ? ztteamEncrypt(emailPass) : null;
  const ztteamCookieEnc = cookie ? ztteamEncrypt(cookie) : null;
  const ztteamTokenEnc = accessToken ? ztteamEncrypt(accessToken) : null;
  const ztteamProxyEnc = proxy ? ztteamEncrypt(proxy) : null;

  const ztteamExisting = await ztteamGetOneSql('SELECT id FROM accounts WHERE uid = ?', [String(uid).trim()]);
  const ztteamIsNew = !ztteamExisting;

  const ztteamResult = await ztteamRunSql(
    `INSERT INTO accounts (
      uid, name, password_enc, two_factor_secret_enc,
      email, email_pass_enc, cookie_enc, access_token_enc, proxy_enc, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET
      name = COALESCE(excluded.name, accounts.name),
      password_enc = COALESCE(excluded.password_enc, accounts.password_enc),
      two_factor_secret_enc = COALESCE(excluded.two_factor_secret_enc, accounts.two_factor_secret_enc),
      email = COALESCE(excluded.email, accounts.email),
      cookie_enc = COALESCE(excluded.cookie_enc, accounts.cookie_enc),
      proxy_enc = COALESCE(excluded.proxy_enc, accounts.proxy_enc),
      category = COALESCE(excluded.category, accounts.category),
      updated_at = datetime('now', 'localtime')`,
    [
      String(uid).trim(),
      name || `VIA_${uid}`,
      ztteamPassEnc,
      ztteam2FaEnc,
      email || null,
      ztteamEmailPassEnc,
      ztteamCookieEnc,
      ztteamTokenEnc,
      ztteamProxyEnc,
      category
    ]
  );

  return {
    id: ztteamExisting ? ztteamExisting.id : ztteamResult.lastID,
    isNew: ztteamIsNew
  };
}

/**
 * Nhập tài khoản hàng loạt từ mảng object
 * @param {Array} ztteamAccountsList - Danh sách tài khoản
 * @returns {Promise<{successCount: number, errorCount: number, insertedCount: number, updatedCount: number}>}
 */
async function ztteamBulkAddAccounts(ztteamAccountsList) {
  let ztteamSuccess = 0;
  let ztteamErrors = 0;
  let ztteamInserted = 0;
  let ztteamUpdated = 0;

  for (const ztteamItem of ztteamAccountsList) {
    try {
      if (ztteamItem && ztteamItem.uid) {
        const ztteamRes = await ztteamAddAccount(ztteamItem);
        ztteamSuccess++;
        if (ztteamRes && ztteamRes.isNew) {
          ztteamInserted++;
        } else {
          ztteamUpdated++;
        }
      }
    } catch (ztteamErr) {
      ztteamErrors++;
    }
  }

  return {
    successCount: ztteamSuccess,
    errorCount: ztteamErrors,
    insertedCount: ztteamInserted,
    updatedCount: ztteamUpdated
  };
}

/**
 * Cập nhật trạng thái và kết quả sau khi kiểm tra/đăng nhập
 * @param {string} ztteamUid - UID tài khoản
 * @param {string} ztteamStatus - Trạng thái mới (Live, Die, Checkpoint, Đang chạy, Chưa check)
 * @param {Object} ztteamExtra - Thông tin cập nhật thêm (cookie, friendsCount, name...)
 * @returns {Promise<void>}
 */
async function ztteamUpdateAccountStatus(ztteamUid, ztteamStatus, ztteamExtra = {}) {
  const ztteamUpdates = ['status = ?', "last_checked_at = datetime('now', 'localtime')", "updated_at = datetime('now', 'localtime')"];
  const ztteamParams = [ztteamStatus];

  if (ztteamExtra.cookie) {
    ztteamUpdates.push('cookie_enc = ?');
    ztteamParams.push(ztteamEncrypt(ztteamExtra.cookie));
  }

  if (typeof ztteamExtra.friendsCount === 'number') {
    ztteamUpdates.push('friends_count = ?');
    ztteamParams.push(ztteamExtra.friendsCount);
  }

  if (ztteamExtra.name) {
    ztteamUpdates.push('name = ?');
    ztteamParams.push(ztteamExtra.name);
  }

  if (ztteamExtra.avatarUrl) {
    ztteamUpdates.push('avatar_url = ?');
    ztteamParams.push(ztteamExtra.avatarUrl);
  }

  ztteamParams.push(String(ztteamUid));

  await ztteamRunSql(
    `UPDATE accounts SET ${ztteamUpdates.join(', ')} WHERE uid = ?`,
    ztteamParams
  );
}

/**
 * Xóa 1 tài khoản theo ID
 * @param {number} ztteamId - ID tài khoản
 * @returns {Promise<boolean>}
 */
async function ztteamDeleteAccount(ztteamId) {
  const ztteamRes = await ztteamRunSql(`DELETE FROM accounts WHERE id = ?`, [ztteamId]);
  return ztteamRes.changes > 0;
}

/**
 * Xóa nhiều tài khoản theo danh sách ID
 * @param {Array<number>} ztteamIds - Mảng ID cần xóa
 * @returns {Promise<number>} Số lượng đã xóa
 */
async function ztteamDeleteAccounts(ztteamIds) {
  if (!Array.isArray(ztteamIds) || ztteamIds.length === 0) return 0;
  const ztteamPlaceholders = ztteamIds.map(() => '?').join(',');
  const ztteamRes = await ztteamRunSql(
    `DELETE FROM accounts WHERE id IN (${ztteamPlaceholders})`,
    ztteamIds
  );
  return ztteamRes.changes;
}

/**
 * Lấy các số liệu thống kê tổng quan
 * @returns {Promise<{total: number, live: number, die: number, checkpoint: number, running: number}>}
 */
async function ztteamGetStats() {
  const ztteamRows = await ztteamGetAllSql(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Live' THEN 1 ELSE 0 END) AS live,
      SUM(CASE WHEN status = 'Die' THEN 1 ELSE 0 END) AS die,
      SUM(CASE WHEN status = 'Checkpoint' THEN 1 ELSE 0 END) AS checkpoint,
      SUM(CASE WHEN status = 'Đang chạy' THEN 1 ELSE 0 END) AS running
    FROM accounts
  `);

  const ztteamStats = ztteamRows[0] || {};
  return {
    total: ztteamStats.total || 0,
    live: ztteamStats.live || 0,
    die: ztteamStats.die || 0,
    checkpoint: ztteamStats.checkpoint || 0,
    running: ztteamStats.running || 0
  };
}

/**
 * Lấy toàn bộ danh mục hiện có
 * @returns {Promise<Array<string>>}
 */
async function ztteamGetCategories() {
  const ztteamRows = await ztteamGetAllSql(`SELECT name FROM categories ORDER BY id ASC`);
  return ztteamRows.map((r) => r.name);
}

/**
 * Thêm danh mục mới
 * @param {string} ztteamCategoryName - Tên danh mục
 * @returns {Promise<void>}
 */
async function ztteamAddCategory(ztteamCategoryName) {
  if (!ztteamCategoryName) return;
  await ztteamRunSql(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [ztteamCategoryName.trim()]);
}

/**
 * Lấy tất cả cấu hình hệ thống
 * @returns {Promise<Object>}
 */
async function ztteamGetSettings() {
  const ztteamRows = await ztteamGetAllSql(`SELECT key, value FROM settings`);
  const ztteamSettings = {};
  for (const ztteamR of ztteamRows) {
    ztteamSettings[ztteamR.key] = ztteamR.value;
  }
  return ztteamSettings;
}

/**
 * Cập nhật cấu hình hệ thống
 * @param {Object} ztteamSettingsObj - Đối tượng key: value
 * @returns {Promise<void>}
 */
async function ztteamUpdateSettings(ztteamSettingsObj) {
  for (const [ztteamK, ztteamV] of Object.entries(ztteamSettingsObj)) {
    await ztteamRunSql(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [ztteamK, String(ztteamV)]
    );
  }
}

/**
 * Ghi nhật ký hoạt động
 * @param {string} ztteamAccountUid - UID tài khoản liên quan
 * @param {string} ztteamAction - Tên hành động
 * @param {string} ztteamDetails - Chi tiết hành động
 * @returns {Promise<void>}
 */
async function ztteamAddLog(ztteamAccountUid, ztteamAction, ztteamDetails) {
  await ztteamRunSql(
    `INSERT INTO activity_logs (account_uid, action, details) VALUES (?, ?, ?)`,
    [ztteamAccountUid || null, ztteamAction, ztteamDetails || '']
  );
}

/**
 * Lấy danh sách nhật ký hoạt động gần nhất
 * @param {number} ztteamLimit - Số lượng log cần lấy
 * @returns {Promise<Array>}
 */
async function ztteamGetRecentLogs(ztteamLimit = 50) {
  return ztteamGetAllSql(
    `SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?`,
    [ztteamLimit]
  );
}

/**
 * Khôi phục 8 tài khoản mẫu chuẩn 100% theo bản thiết kế index.html
 * @returns {Promise<void>}
 */
async function ztteamResetDemoData() {
  await ztteamRunSql('DELETE FROM accounts');

  const ztteamDemoAccounts = [
    {
      uid: '1000847362910',
      name: 'Trần Hữu Đức',
      status: 'Live',
      category: 'Marketing',
      proxy: '103.47.21.8:8080',
      created_at: '12/10/2023',
      last_checked_at: '5 phút trước'
    },
    {
      uid: '1000847362911',
      name: 'Nguyễn Lan Anh',
      status: 'Checkpoint',
      category: 'Bán hàng',
      proxy: '45.76.130.2:3128',
      created_at: '12/10/2023',
      last_checked_at: '1 giờ trước'
    },
    {
      uid: '1000847362912',
      name: 'Vũ Thị Mai',
      status: 'Die',
      category: 'Hỗ trợ',
      proxy: '185.199.22.1:1080',
      created_at: '11/10/2023',
      last_checked_at: '2 ngày trước'
    },
    {
      uid: '1000847362913',
      name: 'Đặng Tuấn Kiệt',
      status: 'Live',
      category: 'Marketing',
      proxy: '89.163.44.7:9090',
      created_at: '10/10/2023',
      last_checked_at: '2 phút trước'
    },
    {
      uid: '1000847362914',
      name: 'Lê Quốc Bảo',
      status: 'Live',
      category: 'Bán hàng',
      proxy: '212.83.55.4:3128',
      created_at: '09/10/2023',
      last_checked_at: '8 phút trước'
    },
    {
      uid: '1000847362915',
      name: 'Phan Thanh Long',
      status: 'Checkpoint',
      category: 'Marketing',
      proxy: '77.238.12.9:8888',
      created_at: '08/10/2023',
      last_checked_at: '3 giờ trước'
    },
    {
      uid: '1000847362916',
      name: 'Ngô Minh Phương',
      status: 'Live',
      category: 'Hỗ trợ',
      proxy: '154.92.18.3:4145',
      created_at: '07/10/2023',
      last_checked_at: '1 phút trước'
    },
    {
      uid: '1000847362917',
      name: 'Huỳnh Văn Sơn',
      status: 'Die',
      category: 'Bán hàng',
      proxy: '91.205.30.6:1080',
      created_at: '06/10/2023',
      last_checked_at: '5 ngày trước'
    }
  ];

  for (const acc of ztteamDemoAccounts) {
    const proxyEnc = acc.proxy ? ztteamEncrypt(acc.proxy) : null;
    await ztteamRunSql(
      `INSERT INTO accounts (uid, name, status, category, proxy_enc, created_at, last_checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [acc.uid, acc.name, acc.status, acc.category, proxyEnc, acc.created_at, acc.last_checked_at]
    );
  }
}

/**
 * Xóa sạch toàn bộ tài khoản trong cơ sở dữ liệu
 * @returns {Promise<void>}
 */
async function ztteamClearAllAccounts() {
  await ztteamRunSql('DELETE FROM accounts');
}

/**
 * Cập nhật thông tin chi tiết một tài khoản
 * @param {string|number} ztteamId - ID tài khoản
 * @param {Object} ztteamData - Thông tin cập nhật
 * @returns {Promise<boolean>}
 */
async function ztteamUpdateAccount(ztteamId, ztteamData) {
  const {
    name,
    status,
    category,
    proxy,
    password,
    twoFactorSecret,
    cookie,
    email,
    emailPass,
    userAgent
  } = ztteamData;

  const ztteamUpdates = ["updated_at = datetime('now', 'localtime')"];
  const ztteamParams = [];

  if (name !== undefined) {
    ztteamUpdates.push('name = ?');
    ztteamParams.push(name);
  }
  if (status !== undefined) {
    ztteamUpdates.push('status = ?');
    ztteamParams.push(status);
  }
  if (category !== undefined) {
    ztteamUpdates.push('category = ?');
    ztteamParams.push(category);
  }
  if (proxy !== undefined) {
    ztteamUpdates.push('proxy_enc = ?');
    ztteamParams.push(proxy ? ztteamEncrypt(proxy) : null);
  }
  /** Chỉ cập nhật các trường nhạy cảm khi người dùng thực sự nhập chuỗi mới (không rỗng) */
  if (password !== undefined && typeof password === 'string' && password.trim() !== '') {
    ztteamUpdates.push('password_enc = ?');
    ztteamParams.push(ztteamEncrypt(password.trim()));
  }
  if (twoFactorSecret !== undefined && typeof twoFactorSecret === 'string' && twoFactorSecret.trim() !== '') {
    ztteamUpdates.push('two_factor_secret_enc = ?');
    ztteamParams.push(ztteamEncrypt(twoFactorSecret.trim()));
  }
  if (cookie !== undefined && typeof cookie === 'string' && cookie.trim() !== '') {
    ztteamUpdates.push('cookie_enc = ?');
    ztteamParams.push(ztteamEncrypt(cookie.trim()));
  }
  if (email !== undefined) {
    ztteamUpdates.push('email = ?');
    ztteamParams.push(email ? email.trim() : null);
  }
  if (emailPass !== undefined && typeof emailPass === 'string' && emailPass.trim() !== '') {
    ztteamUpdates.push('email_pass_enc = ?');
    ztteamParams.push(ztteamEncrypt(emailPass.trim()));
  }
  if (userAgent !== undefined) {
    ztteamUpdates.push('user_agent = ?');
    ztteamParams.push(userAgent || null);
  }

  ztteamParams.push(ztteamId);
  const ztteamSql = `UPDATE accounts SET ${ztteamUpdates.join(', ')} WHERE id = ?`;
  const ztteamResult = await ztteamRunSql(ztteamSql, ztteamParams);
  return ztteamResult.changes > 0;
}

module.exports = {
  ztteamInitDatabase,
  ztteamResetDemoData,
  ztteamClearAllAccounts,
  ztteamUpdateAccount,
  ztteamGetAccounts,
  ztteamGetAccountForExecution,
  ztteamAddAccount,
  ztteamBulkAddAccounts,
  ztteamUpdateAccountStatus,
  ztteamDeleteAccount,
  ztteamDeleteAccounts,
  ztteamGetStats,
  ztteamGetCategories,
  ztteamAddCategory,
  ztteamGetSettings,
  ztteamUpdateSettings,
  ztteamAddLog,
  ztteamGetRecentLogs
};
