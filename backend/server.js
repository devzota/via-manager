/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: server.js
 * Description: REST API Server Express kết hợp WebSocket thời gian thực cho ZTTeam VIA Manager
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const {
  ztteamInitDatabase,
  ztteamResetDemoData,
  ztteamClearAllAccounts,
  ztteamUpdateAccount,
  ztteamGetAccounts,
  ztteamGetAccountForExecution,
  ztteamAddAccount,
  ztteamBulkAddAccounts,
  ztteamDeleteAccount,
  ztteamDeleteAccounts,
  ztteamGetStats,
  ztteamGetCategories,
  ztteamAddCategory,
  ztteamGetSettings,
  ztteamUpdateSettings,
  ztteamAddLog,
  ztteamGetRecentLogs
} = require('./services/ztteam_db');

const {
  ztteamParseProxy,
  ztteamTestProxyConnection,
  ztteamOpenBrowser,
  ztteamCloseBrowser,
  ztteamCheckAccountLive,
  ztteamGetActiveBrowserUids,
  ztteamGetActiveBrowserInfo,
  ztteamAutoFill2FANow
} = require('./services/ztteam_automation');

const { ztteamGenerate2FACode } = require('./services/ztteam_security');

const ztteamApp = express();
const ztteamServer = http.createServer(ztteamApp);
const ztteamWss = new WebSocketServer({ server: ztteamServer });

const ZTTEAM_PORT = process.env.ZTTEAM_PORT || 5000;

ztteamApp.use(cors());
ztteamApp.use(express.json({ limit: '10mb' }));

/** Tập hợp các kết nối WebSocket đang hoạt động */
const ztteamClients = new Set();

ztteamWss.on('connection', (ztteamWs) => {
  ztteamClients.add(ztteamWs);

  ztteamWs.on('close', () => {
    ztteamClients.delete(ztteamWs);
  });
});

/**
 * Phát tin nhắn thời gian thực tới tất cả Frontend kết nối
 * @param {Object} ztteamData - Dữ liệu cần gửi
 */
function ztteamBroadcast(ztteamData) {
  const ztteamPayload = JSON.stringify(ztteamData);
  for (const ztteamClient of ztteamClients) {
    if (ztteamClient.readyState === 1) {
      ztteamClient.send(ztteamPayload);
    }
  }
}

/** ---------------- API TÀI KHOẢN ---------------- */

/** Lấy danh sách tài khoản (kèm phân trang, lọc, tìm kiếm) */
ztteamApp.get('/api/accounts', async (req, res) => {
  try {
    const { page, limit, status, category, search } = req.query;
    const ztteamResult = await ztteamGetAccounts({ page, limit, status, category, search });
    res.json({ success: true, data: ztteamResult });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Thêm 1 tài khoản mới */
ztteamApp.post('/api/accounts', async (req, res) => {
  try {
    const ztteamId = await ztteamAddAccount(req.body);
    await ztteamAddLog(req.body.uid, 'THÊM TÀI KHOẢN', 'Thêm thành công tài khoản đơn lẻ.');
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
    res.json({ success: true, id: ztteamId });
  } catch (ztteamErr) {
    res.status(400).json({ success: false, message: ztteamErr.message });
  }
});

/**
 * Phân tích thông minh một dòng nhập liệu tài khoản theo định dạng linh hoạt
 * @param {string} line - Chuỗi dòng nhập liệu
 * @param {string} defaultCategory - Danh mục mặc định
 * @returns {Object|null}
 */
function ztteamSmartParseLine(line, defaultCategory = 'Mặc định') {
  if (!line || !line.trim()) return null;
  const delimiter = line.includes('\t') ? '\t' : '|';
  const parts = line.split(delimiter).map((s) => s.trim());
  if (parts.length === 0 || !parts[0]) return null;

  const uid = parts[0];
  let name = '';
  let password = '';
  let twoFactorSecret = '';
  let cookie = '';
  let accessToken = '';
  let proxy = '';
  let email = '';
  let emailPass = '';
  let userAgent = '';

  /** Kiểm tra nếu phần tử thứ 2 là tên người hợp lệ (độ dài < 40 ký tự, không phải User-Agent) */
  let remaining = parts.slice(1);
  if (
    remaining.length > 0 &&
    remaining[0].length < 40 &&
    !/Mozilla\/5\.0|AppleWebKit|Chrome\/\d+|Safari\/\d+/i.test(remaining[0]) &&
    /\s|[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(remaining[0])
  ) {
    name = remaining[0];
    remaining = remaining.slice(1);
  }

  /** Phân loại các trường còn lại dựa vào đặc điểm nội dung */
  const unclassified = [];
  for (const part of remaining) {
    if (!part) continue;
    /** Chuỗi User-Agent nếu có trong dòng import */
    if (/Mozilla\/5\.0/i.test(part)) {
      userAgent = part;
      continue;
    }
    /** Cookie Facebook chứa c_user= hoặc xs= */
    else if (/c_user=|xs=|datr=|sb=/i.test(part)) {
      cookie = part;
    }
    /** Token Facebook Graph API: bắt đầu bằng EAA */
    else if (/^EAA[a-zA-Z0-9]+/i.test(part) && !accessToken) {
      accessToken = part;
    }
    /** Email chứa @ và không chứa dấu hai chấm */
    else if (part.includes('@') && !part.includes(':')) {
      if (!email) email = part;
      else if (!emailPass) emailPass = part;
    }
    /** Proxy: hỗ trợ thông minh qua ztteamParseProxy (mọi chuẩn IP:PORT, IP:PORT:USER:PASS, USER:PASS:IP:PORT, SOCKS5) */
    else if (!proxy && (ztteamParseProxy(part) || /^(?:[a-zA-Z0-9.-]+):(\d{2,5})(?::.*)?$/.test(part))) {
      proxy = part;
    }
    /** Mã 2FA Secret: chuỗi Base32 dài từ 16-32 ký tự */
    else if (/^[A-Z2-7]{16,32}$/i.test(part) && !twoFactorSecret) {
      twoFactorSecret = part.replace(/\s+/g, '').toUpperCase();
    }
    else {
      unclassified.push(part);
    }
  }

  /** Gán các trường chưa phân loại theo thứ tự ưu tiên */
  if (!password && unclassified.length > 0) password = unclassified.shift();
  if (!emailPass && unclassified.length > 0 && email) emailPass = unclassified.shift();
  if (!twoFactorSecret && unclassified.length > 0 && /^[A-Z0-9]{16,32}$/i.test(unclassified[0])) twoFactorSecret = unclassified.shift();
  if (!cookie && unclassified.length > 0 && unclassified[0].includes('=')) cookie = unclassified.shift();
  if (!accessToken && unclassified.length > 0 && unclassified[0].startsWith('EAA')) accessToken = unclassified.shift();
  if (!email && unclassified.length > 0 && unclassified[0].includes('@')) email = unclassified.shift();

  return {
    uid,
    name: name || undefined,
    password,
    twoFactorSecret,
    cookie,
    accessToken,
    proxy,
    email,
    emailPass,
    userAgent: userAgent || undefined,
    category: defaultCategory || 'Mặc định'
  };
}

/** Nhập tài khoản hàng loạt (Smart Parser hỗ trợ đa định dạng) */
ztteamApp.post('/api/accounts/bulk', async (req, res) => {
  try {
    const { rawText, category } = req.body;
    let ztteamAccounts = [];

    if (Array.isArray(req.body.accounts)) {
      ztteamAccounts = req.body.accounts;
    } else if (rawText && typeof rawText === 'string') {
      const ztteamLines = rawText.split('\n');
      for (const ztteamLine of ztteamLines) {
        const parsed = ztteamSmartParseLine(ztteamLine, category);
        if (parsed) {
          ztteamAccounts.push(parsed);
        }
      }
    }

    const ztteamBulkResult = await ztteamBulkAddAccounts(ztteamAccounts);
    await ztteamAddLog(null, 'IMPORT HÀNG LOẠT', `Đã import ${ztteamBulkResult.successCount} tài khoản thành công.`);
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });

    res.json({ success: true, data: ztteamBulkResult });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Reset dữ liệu về 8 tài khoản mẫu chuẩn */
ztteamApp.post('/api/accounts/reset-demo', async (req, res) => {
  try {
    await ztteamResetDemoData();
    await ztteamAddLog(null, 'RESET DEMO', 'Đã khôi phục 8 tài khoản mẫu chuẩn 100% theo index.html.');
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
    res.json({ success: true, message: 'Đã khôi phục 8 tài khoản mẫu thành công.' });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Cập nhật thông tin chi tiết tài khoản */
ztteamApp.put('/api/accounts/:id', async (req, res) => {
  try {
    const ztteamSuccess = await ztteamUpdateAccount(req.params.id, req.body);
    if (ztteamSuccess) {
      await ztteamAddLog(req.body.uid || req.params.id, 'CẬP NHẬT TÀI KHOẢN', 'Cập nhật tài khoản thành công.');
      ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
      res.json({ success: true, message: 'Đã cập nhật thông tin tài khoản thành công.' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Xóa sạch toàn bộ tài khoản */
ztteamApp.post('/api/accounts/clear-all', async (req, res) => {
  try {
    await ztteamClearAllAccounts();
    await ztteamAddLog(null, 'XÓA TẤT CẢ', 'Đã xóa toàn bộ tài khoản trong cơ sở dữ liệu.');
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
    res.json({ success: true, message: 'Đã xóa toàn bộ tài khoản thành công.' });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Kiểm tra kết nối Proxy thực tế qua Playwright Request Engine */
ztteamApp.post('/api/proxy/test', async (req, res) => {
  const { proxy } = req.body;
  if (!proxy) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp chuỗi proxy.' });
  }

  try {
    const ztteamResult = await ztteamTestProxyConnection(proxy);
    res.json(ztteamResult);
  } catch (ztteamErr) {
    res.json({
      success: false,
      message: `Lỗi kiểm tra proxy: ${ztteamErr.message}`
    });
  }
});

/** Xóa 1 tài khoản */
ztteamApp.delete('/api/accounts/:id', async (req, res) => {
  try {
    const ztteamSuccess = await ztteamDeleteAccount(req.params.id);
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
    res.json({ success: ztteamSuccess });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Xóa nhiều tài khoản theo danh sách ID */
ztteamApp.post('/api/accounts/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const ztteamDeleted = await ztteamDeleteAccounts(ids);
    ztteamBroadcast({ type: 'ACCOUNT_UPDATED' });
    res.json({ success: true, count: ztteamDeleted });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** ---------------- API THỐNG KÊ, DANH MỤC, CẤU HÌNH, LOG ---------------- */

/** Lấy số liệu thống kê */
ztteamApp.get('/api/stats', async (req, res) => {
  try {
    const ztteamStats = await ztteamGetStats();
    res.json({ success: true, data: ztteamStats });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Lấy danh sách danh mục */
ztteamApp.get('/api/categories', async (req, res) => {
  try {
    const ztteamCategories = await ztteamGetCategories();
    res.json({ success: true, data: ztteamCategories });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Thêm danh mục */
ztteamApp.post('/api/categories', async (req, res) => {
  try {
    await ztteamAddCategory(req.body.name);
    res.json({ success: true });
  } catch (ztteamErr) {
    res.status(400).json({ success: false, message: ztteamErr.message });
  }
});

/** Lấy cấu hình hệ thống */
ztteamApp.get('/api/settings', async (req, res) => {
  try {
    const ztteamSettings = await ztteamGetSettings();
    res.json({ success: true, data: ztteamSettings });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** Lưu cấu hình */
ztteamApp.post('/api/settings', async (req, res) => {
  try {
    await ztteamUpdateSettings(req.body);
    res.json({ success: true });
  } catch (ztteamErr) {
    res.status(400).json({ success: false, message: ztteamErr.message });
  }
});

/** Lấy nhật ký hoạt động */
ztteamApp.get('/api/logs', async (req, res) => {
  try {
    const ztteamLogs = await ztteamGetRecentLogs(req.query.limit || 50);
    res.json({ success: true, data: ztteamLogs });
  } catch (ztteamErr) {
    res.status(500).json({ success: false, message: ztteamErr.message });
  }
});

/** ---------------- API ĐIỀU KHIỂN TỰ ĐỘNG HÓA PLAYWRIGHT ---------------- */

/** Mở trình duyệt tương tác cho 1 tài khoản */
ztteamApp.post('/api/automation/open', async (req, res) => {
  const { id, uid } = req.body;
  const ztteamTarget = id || uid;

  const ztteamAccount = await ztteamGetAccountForExecution(ztteamTarget);
  if (!ztteamAccount) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
  }

  /** Trả về phản hồi ngay để UI không bị treo */
  res.json({ success: true, message: 'Đang mở trình duyệt...' });

  /** Thực hiện bất đồng bộ */
  ztteamOpenBrowser(ztteamAccount, (ztteamEvt) => {
    ztteamBroadcast(ztteamEvt);
  });
});

/** Lấy danh sách UID tài khoản đang mở trình duyệt Chrome */
ztteamApp.get('/api/automation/active', async (req, res) => {
  const ztteamInfo = await ztteamGetActiveBrowserInfo();
  res.json({ success: true, activeUids: ztteamGetActiveBrowserUids(), browsers: ztteamInfo });
});

/** Đóng trình duyệt của 1 tài khoản */
ztteamApp.post('/api/automation/close', async (req, res) => {
  const { uid } = req.body;
  const ztteamClosed = await ztteamCloseBrowser(uid);
  ztteamBroadcast({ type: 'STATUS', uid, status: 'Live', message: 'Đã đóng trình duyệt.' });
  ztteamBroadcast({ type: 'BROWSER_STATE', uid, isOpen: false });
  res.json({ success: ztteamClosed });
});

/** Kiểm tra trạng thái Live/Die cho 1 tài khoản */
ztteamApp.post('/api/automation/check-live', async (req, res) => {
  const { id, uid } = req.body;
  const ztteamAccount = await ztteamGetAccountForExecution(id || uid);
  if (!ztteamAccount) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
  }

  res.json({ success: true, message: 'Bắt đầu kiểm tra trạng thái...' });

  ztteamCheckAccountLive(ztteamAccount, (ztteamEvt) => {
    ztteamBroadcast(ztteamEvt);
  });
});

/** Sinh mã 2FA nhanh cho tài khoản */
ztteamApp.post('/api/automation/generate-2fa', async (req, res) => {
  const { id, uid } = req.body;
  const ztteamAccount = await ztteamGetAccountForExecution(id || uid);
  if (!ztteamAccount || !ztteamAccount.twoFactorSecret) {
    return res.status(400).json({ success: false, message: 'Tài khoản không có mã 2FA secret.' });
  }

  const ztteamCode = ztteamGenerate2FACode(ztteamAccount.twoFactorSecret);
  res.json({ success: true, code: ztteamCode });
});

/** Tự động điền mã 2FA vào trình duyệt đang mở */
ztteamApp.post('/api/automation/autofill-2fa', async (req, res) => {
  const { id, uid } = req.body;
  const ztteamTarget = uid || id;
  if (!ztteamTarget) {
    return res.status(400).json({ success: false, message: 'Thiếu UID tài khoản.' });
  }

  const ztteamResult = await ztteamAutoFill2FANow(ztteamTarget);
  res.json(ztteamResult);
});

/** Khởi động Server */
async function ztteamStartServer() {
  await ztteamInitDatabase();
  ztteamServer.listen(ZTTEAM_PORT, () => {
    console.log(`[ZTTeam Server] Đang chạy tại http://localhost:${ZTTEAM_PORT}`);
    console.log(`[ZTTeam WebSocket] Sẵn sàng nhận kết nối thời gian thực.`);
  });
}

ztteamStartServer();
