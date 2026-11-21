/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/services/ztteam_api.js
 * Description: Client API và kết nối WebSocket thời gian thực tới ZTTeam Backend
 */

const ZTTEAM_BASE_API = '/api';

/**
 * Lấy danh sách tài khoản kèm phân trang và bộ lọc
 * @param {Object} ztteamParams - Tham số phân trang, bộ lọc
 * @returns {Promise<Object>}
 */
export async function ztteamFetchAccounts({ page = 1, limit = 10, status = '', category = '', search = '' } = {}) {
  const ztteamQuery = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    category,
    search
  });

  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts?${ztteamQuery.toString()}`);
  return ztteamRes.json();
}

/**
 * Lấy thống kê số lượng tài khoản theo trạng thái
 * @returns {Promise<Object>}
 */
export async function ztteamFetchStats() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/stats`);
  return ztteamRes.json();
}

/**
 * Lấy danh sách toàn bộ danh mục
 * @returns {Promise<Object>}
 */
export async function ztteamFetchCategories() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/categories`);
  return ztteamRes.json();
}

/**
 * Thêm 1 tài khoản đơn lẻ
 * @param {Object} ztteamAccountData - Dữ liệu tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamCreateAccount(ztteamAccountData) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ztteamAccountData)
  });
  return ztteamRes.json();
}

/**
 * Nhập tài khoản hàng loạt theo định dạng thô
 * @param {string} rawText - Chuỗi UID|PASS|2FA|COOKIE|PROXY
 * @param {string} category - Tên danh mục
 * @returns {Promise<Object>}
 */
export async function ztteamBulkImportAccounts(rawText, category = 'Mặc định') {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, category })
  });
  return ztteamRes.json();
}

/**
 * Xóa 1 tài khoản
 * @param {number} ztteamId - ID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamDeleteAccount(ztteamId) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts/${ztteamId}`, {
    method: 'DELETE'
  });
  return ztteamRes.json();
}

/**
 * Xóa nhiều tài khoản theo danh sách ID
 * @param {Array<number>} ztteamIds - Mảng ID cần xóa
 * @returns {Promise<Object>}
 */
export async function ztteamBulkDeleteAccounts(ztteamIds) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ztteamIds })
  });
  return ztteamRes.json();
}

/**
 * Cập nhật thông tin chi tiết một tài khoản
 * @param {number|string} ztteamId - ID tài khoản
 * @param {Object} ztteamData - Thông tin cập nhật
 * @returns {Promise<Object>}
 */
export async function ztteamUpdateAccount(ztteamId, ztteamData) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts/${ztteamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ztteamData)
  });
  return ztteamRes.json();
}

/**
 * Xóa sạch toàn bộ tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamClearAllAccounts() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/accounts/clear-all`, {
    method: 'POST'
  });
  return ztteamRes.json();
}

/**
 * Kiểm tra kết nối Proxy trực tiếp
 * @param {string} proxy - Chuỗi proxy
 * @returns {Promise<Object>}
 */
export async function ztteamTestProxy(proxy) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/proxy/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proxy })
  });
  return ztteamRes.json();
}

/**
 * Mở trình duyệt tương tác cho 1 tài khoản
 * @param {number} ztteamId - ID tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamOpenBrowser(ztteamId, ztteamUid) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: ztteamId, uid: ztteamUid })
  });
  return ztteamRes.json();
}

/**
 * Đóng trình duyệt của 1 tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamCloseBrowser(ztteamUid) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: ztteamUid })
  });
  return ztteamRes.json();
}

/**
 * Lấy danh sách UID tài khoản đang mở trình duyệt Chrome
 * @returns {Promise<Object>}
 */
export async function ztteamFetchActiveBrowsers() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/active`);
  return ztteamRes.json();
}

/**
 * Kiểm tra trạng thái Live/Die cho 1 tài khoản
 * @param {number} ztteamId - ID tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamCheckAccountLive(ztteamId, ztteamUid) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/check-live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: ztteamId, uid: ztteamUid })
  });
  return ztteamRes.json();
}

/**
 * Sinh mã 2FA 6 số nhanh
 * @param {number} ztteamId - ID tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamGenerate2FACode(ztteamId, ztteamUid) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/generate-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: ztteamId, uid: ztteamUid })
  });
  return ztteamRes.json();
}

/**
 * Tự động điền mã 2FA vào tab trình duyệt đang mở
 * @param {number} ztteamId - ID tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<Object>}
 */
export async function ztteamAutoFill2FA(ztteamId, ztteamUid) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/automation/autofill-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: ztteamId, uid: ztteamUid })
  });
  return ztteamRes.json();
}

/**
 * Lấy lịch sử hoạt động
 * @returns {Promise<Object>}
 */
export async function ztteamFetchLogs() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/logs`);
  return ztteamRes.json();
}

/**
 * Lấy cấu hình hệ thống
 * @returns {Promise<Object>}
 */
export async function ztteamFetchSettings() {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/settings`);
  return ztteamRes.json();
}

/**
 * Lưu cấu hình hệ thống
 * @param {Object} ztteamSettings - Đối tượng cấu hình
 * @returns {Promise<Object>}
 */
export async function ztteamSaveSettings(ztteamSettings) {
  const ztteamRes = await fetch(`${ZTTEAM_BASE_API}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ztteamSettings)
  });
  return ztteamRes.json();
}

/**
 * Khởi tạo kết nối WebSocket thời gian thực
 * @param {Function} ztteamOnMessageCallback - Hàm xử lý khi có tin nhắn từ máy chủ
 * @returns {WebSocket} Đối tượng WebSocket
 */
export function ztteamConnectWebSocket(ztteamOnMessageCallback) {
  const ztteamProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ztteamHost = window.location.hostname || 'localhost';
  const ztteamWsUrl = `${ztteamProtocol}//${ztteamHost}:5000`;

  let ztteamWs = null;
  try {
    ztteamWs = new WebSocket(ztteamWsUrl);

    ztteamWs.onmessage = (ztteamEvent) => {
      try {
        const ztteamData = JSON.parse(ztteamEvent.data);
        if (ztteamOnMessageCallback) {
          ztteamOnMessageCallback(ztteamData);
        }
      } catch (e) {
        /** Bỏ qua nếu dữ liệu không phải JSON */
      }
    };

    ztteamWs.onclose = () => {
      /** Tự động thử kết nối lại sau 3 giây nếu mất mạng */
      setTimeout(() => {
        ztteamConnectWebSocket(ztteamOnMessageCallback);
      }, 3000);
    };
  } catch (err) {
    /** Lỗi kết nối WebSocket ban đầu */
  }

  return ztteamWs;
}
