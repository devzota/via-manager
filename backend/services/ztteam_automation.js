/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: services/ztteam_automation.js
 * Description: Bộ máy tự động hóa Playwright Stealth, Profile độc lập, hỗ trợ Proxy IPv4/IPv6
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ztteamGenerate2FACode, ztteamMaskSecret } = require('./ztteam_security');
const { ztteamUpdateAccountStatus, ztteamUpdateAccount, ztteamAddLog } = require('./ztteam_db');

const ZTTEAM_PROFILES_DIR = path.join(__dirname, '..', 'data', 'profiles');
if (!fs.existsSync(ZTTEAM_PROFILES_DIR)) {
  fs.mkdirSync(ZTTEAM_PROFILES_DIR, { recursive: true });
}

/** Danh sách các tiến trình trình duyệt đang mở để người dùng có thể đóng từ xa */
const ztteamActiveBrowsers = new Map();

/**
 * Phân tích và chuẩn hóa chuỗi cấu hình Proxy (hỗ trợ cả IPv4 và IPv6)
 * Các định dạng hỗ trợ:
 * - ip:port
 * - ip:port:user:pass
 * - user:pass@ip:port
 * - http://... hoặc socks5://...
 * - IPv6: [2001:...]:port hoặc [2001:...]:port:user:pass
 * @param {string} ztteamProxyStr - Chuỗi proxy thô
 * @returns {Object|null} Cấu hình proxy cho Playwright
 */
function ztteamParseProxy(ztteamProxyStr) {
  if (!ztteamProxyStr || typeof ztteamProxyStr !== 'string') return null;

  /** Làm sạch khoảng trắng, dấu ngoặc, dấu nháy kép thừa khi copy/paste */
  let ztteamCleanStr = ztteamProxyStr.trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (!ztteamCleanStr) return null;

  try {
    /** Nhận diện giao thức: mặc định http://, hỗ trợ socks5://, socks4:// */
    let ztteamProtocol = 'http://';
    if (/^socks5:\/\//i.test(ztteamCleanStr)) {
      ztteamProtocol = 'socks5://';
      ztteamCleanStr = ztteamCleanStr.replace(/^socks5:\/\//i, '');
    } else if (/^socks4:\/\//i.test(ztteamCleanStr)) {
      ztteamProtocol = 'socks4://';
      ztteamCleanStr = ztteamCleanStr.replace(/^socks4:\/\//i, '');
    } else if (/^https?:\/\//i.test(ztteamCleanStr)) {
      ztteamProtocol = 'http://';
      ztteamCleanStr = ztteamCleanStr.replace(/^https?:\/\//i, '');
    }

    const ztteamIsPort = (val) => {
      const p = parseInt(val, 10);
      return !isNaN(p) && p >= 1 && p <= 65535 && String(p) === String(val).trim();
    };

    const ztteamIsHost = (val) => {
      if (!val) return false;
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(val) || /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(val) || val === 'localhost';
    };

    /** Định dạng user:pass@host:port hoặc host:port@user:pass */
    if (ztteamCleanStr.includes('@')) {
      const ztteamAtParts = ztteamCleanStr.split('@');
      if (ztteamAtParts.length === 2) {
        let ztteamAuthPart = ztteamAtParts[0];
        let ztteamHpPart = ztteamAtParts[1];
        if (ztteamIsPort(ztteamAuthPart.split(':')[1]) && !ztteamIsPort(ztteamHpPart.split(':')[1])) {
          const temp = ztteamAuthPart;
          ztteamAuthPart = ztteamHpPart;
          ztteamHpPart = temp;
        }
        const [ztteamUser, ztteamPass] = ztteamAuthPart.split(':');
        const ztteamHp = ztteamHpPart.split(':');
        if (ztteamHp.length === 2 && ztteamIsPort(ztteamHp[1])) {
          return {
            server: `${ztteamProtocol}${ztteamHp[0]}:${ztteamHp[1]}`,
            username: ztteamUser || undefined,
            password: ztteamPass || undefined
          };
        }
      }
    }

    /** Trường hợp IPv6: [ipv6]:port hoặc [ipv6]:port:user:pass */
    if (ztteamCleanStr.startsWith('[')) {
      const ztteamCloseBracket = ztteamCleanStr.indexOf(']');
      if (ztteamCloseBracket !== -1) {
        const ztteamIpv6 = ztteamCleanStr.substring(0, ztteamCloseBracket + 1);
        const ztteamRemainder = ztteamCleanStr.substring(ztteamCloseBracket + 2);
        const ztteamParts = ztteamRemainder.split(':');
        if (ztteamIsPort(ztteamParts[0])) {
          return {
            server: `${ztteamProtocol}${ztteamIpv6}:${ztteamParts[0]}`,
            username: ztteamParts[1] || undefined,
            password: ztteamParts[2] || undefined
          };
        }
      }
      return null;
    }

    /** Trường hợp thông thường ngăn cách bởi dấu hai chấm : */
    const ztteamParts = ztteamCleanStr.split(':');
    if (ztteamParts.length === 2 && ztteamIsPort(ztteamParts[1])) {
      return {
        server: `${ztteamProtocol}${ztteamParts[0]}:${ztteamParts[1]}`
      };
    }

    if (ztteamParts.length === 4) {
      const p1 = ztteamIsPort(ztteamParts[1]);
      const p3 = ztteamIsPort(ztteamParts[3]);
      let host, port, user, pass;

      if (p1 && !p3) {
        /** Dạng chuẩn 1: host:port:user:pass */
        host = ztteamParts[0];
        port = ztteamParts[1];
        user = ztteamParts[2];
        pass = ztteamParts[3];
      } else if (!p1 && p3) {
        /** Dạng chuẩn 2 (Phổ biến tại VN): user:pass:host:port */
        user = ztteamParts[0];
        pass = ztteamParts[1];
        host = ztteamParts[2];
        port = ztteamParts[3];
      } else if (p1 && p3) {
        /** Cả part 1 và part 3 đều là số: xét xem bên nào là IP/Host */
        if (ztteamIsHost(ztteamParts[0])) {
          host = ztteamParts[0];
          port = ztteamParts[1];
          user = ztteamParts[2];
          pass = ztteamParts[3];
        } else {
          user = ztteamParts[0];
          pass = ztteamParts[1];
          host = ztteamParts[2];
          port = ztteamParts[3];
        }
      }

      if (host && port) {
        return {
          server: `${ztteamProtocol}${host}:${port}`,
          username: user || undefined,
          password: pass || undefined
        };
      }
    }

    return null;
  } catch (ztteamErr) {
    return null;
  }
}

/**
 * Kiểm tra kết nối thực tế của Proxy qua Playwright Request Engine
 * Hỗ trợ mọi loại proxy: HTTP, HTTPS, SOCKS4, SOCKS5 (kèm hoặc không kèm xác thực)
 * @param {string} ztteamProxyStr - Chuỗi proxy
 * @returns {Promise<{success: boolean, message: string, ip?: string, country?: string, countryCode?: string, city?: string, isp?: string, latency?: number, server?: string}>}
 */
async function ztteamTestProxyConnection(ztteamProxyStr) {
  if (!ztteamProxyStr || typeof ztteamProxyStr !== 'string') {
    return { success: false, message: 'Vui lòng cung cấp chuỗi proxy.' };
  }

  const ztteamParsed = ztteamParseProxy(ztteamProxyStr);
  if (!ztteamParsed) {
    return {
      success: false,
      message: 'Định dạng proxy không hợp lệ (hỗ trợ host:port, host:port:u:p, u:p:host:port, socks5://...).'
    };
  }

  const ztteamStartTime = Date.now();
  let ztteamRequestContext = null;

  try {
    const { request } = require('playwright');
    ztteamRequestContext = await request.newContext({
      proxy: ztteamParsed,
      timeout: 10000
    });

    let ztteamIpData = null;
    try {
      /** Thử dịch vụ ip-api.com để lấy thông tin GeoIP chi tiết */
      const ztteamGeoRes = await ztteamRequestContext.get('http://ip-api.com/json', { timeout: 8000 });
      if (ztteamGeoRes.ok()) {
        const ztteamJson = await ztteamGeoRes.json();
        if (ztteamJson && ztteamJson.status === 'success') {
          ztteamIpData = {
            ip: ztteamJson.query,
            country: ztteamJson.country,
            countryCode: ztteamJson.countryCode,
            city: ztteamJson.city,
            isp: ztteamJson.isp
          };
        }
      }
    } catch (ztteamGeoErr) {
      /** Bỏ qua nếu ip-api quá tải hoặc chặn kết nối */
    }

    /** Nếu chưa lấy được từ ip-api, thử dự phòng với api.ipify.org */
    if (!ztteamIpData) {
      const ztteamIpifyRes = await ztteamRequestContext.get('https://api.ipify.org?format=json', { timeout: 6000 });
      if (ztteamIpifyRes.ok()) {
        const ztteamJson = await ztteamIpifyRes.json();
        if (ztteamJson && ztteamJson.ip) {
          ztteamIpData = { ip: ztteamJson.ip };
        }
      }
    }

    const ztteamLatency = Date.now() - ztteamStartTime;

    if (ztteamIpData && ztteamIpData.ip) {
      return {
        success: true,
        message: 'Proxy hoạt động tốt.',
        ip: ztteamIpData.ip,
        country: ztteamIpData.country || '',
        countryCode: ztteamIpData.countryCode || '',
        city: ztteamIpData.city || '',
        isp: ztteamIpData.isp || '',
        latency: ztteamLatency,
        server: ztteamParsed.server
      };
    } else {
      return {
        success: false,
        message: 'Proxy phản hồi nhưng không nhận được IP.',
        latency: ztteamLatency
      };
    }
  } catch (ztteamErr) {
    const ztteamLatency = Date.now() - ztteamStartTime;
    let ztteamMsg = ztteamErr.message || 'Lỗi kết nối';

    /** Làm sạch thông báo lỗi Playwright để hiển thị đẹp cho người dùng */
    if (ztteamMsg.includes('ECONNREFUSED')) {
      ztteamMsg = 'Proxy từ chối kết nối (Port không mở hoặc Proxy đã tắt).';
    } else if (ztteamMsg.includes('ETIMEDOUT') || ztteamMsg.includes('Timeout')) {
      ztteamMsg = 'Kết nối quá thời gian chờ (Proxy mạng yếu hoặc không phản hồi).';
    } else if (ztteamMsg.includes('407') || ztteamMsg.includes('Proxy Authentication Required')) {
      ztteamMsg = 'Sai tài khoản hoặc mật khẩu xác thực của Proxy.';
    } else if (ztteamMsg.includes('ENOTFOUND')) {
      ztteamMsg = 'Không tìm thấy máy chủ Proxy (Sai địa chỉ Host/IP).';
    } else {
      ztteamMsg = `Proxy không phản hồi: ${ztteamMsg.split('\n')[0].replace('apiRequestContext.get: ', '')}`;
    }

    return {
      success: false,
      message: ztteamMsg,
      latency: ztteamLatency
    };
  } finally {
    if (ztteamRequestContext) {
      try {
        await ztteamRequestContext.dispose();
      } catch (ztteamDispErr) {
        /** Bỏ qua lỗi dọn dẹp */
      }
    }
  }
}

/**
 * Tiêm các mã JavaScript ngụy trang chống phát hiện trình duyệt tự động (Anti-Stealth)
 * @param {import('playwright').BrowserContext} ztteamContext - Context của Playwright
 * @param {string} ztteamUserAgent - Chuỗi User-Agent đang sử dụng
 */
async function ztteamApplyStealth(ztteamContext, ztteamUserAgent = '') {
  const ztteamIsMac = ztteamUserAgent.includes('Macintosh') || ztteamUserAgent.includes('Mac OS');

  await ztteamContext.addInitScript((isMac) => {
    /** Ẩn cờ navigator.webdriver */
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    /** Khớp đúng navigator.platform với hệ điều hành của User-Agent */
    Object.defineProperty(navigator, 'platform', {
      get: () => (isMac ? 'MacIntel' : 'Win32')
    });

    /** Giả lập đối tượng window.chrome chuẩn */
    window.chrome = {
      app: { isInstalled: false },
      webstore: { onInstallStageEvent: {}, onDownloadProgress: {} },
      runtime: {
        PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
        PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
        RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
        OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' }
      }
    };

    /** Giả lập danh sách ngôn ngữ tự nhiên */
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'vi-VN', 'vi']
    });

    /** Giả lập plugins để tránh bị phát hiện headless */
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
  }, ztteamIsMac);
}

/**
 * Chuyển đổi định dạng cookie thô sang mảng cookie của Playwright
 * @param {string} ztteamRawCookie - Chuỗi cookie (dạng c_user=...; xs=... hoặc JSON)
 * @param {string} ztteamDomain - Tên miền áp dụng (mặc định .facebook.com)
 * @returns {Array<Object>} Mảng cookie hợp lệ
 */
function ztteamParseCookies(ztteamRawCookie, ztteamDomain = '.facebook.com') {
  if (!ztteamRawCookie) return [];

  /** Nếu là JSON array */
  if (ztteamRawCookie.trim().startsWith('[')) {
    try {
      const ztteamParsed = JSON.parse(ztteamRawCookie);
      return ztteamParsed.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || ztteamDomain,
        path: c.path || '/'
      }));
    } catch (e) {
      /** Lỗi parse JSON thì thử parse dạng text */
    }
  }

  /** Dạng text chuẩn c_user=123; xs=abc; */
  const ztteamResult = [];
  const ztteamPairs = ztteamRawCookie.split(';');

  for (const ztteamPair of ztteamPairs) {
    const ztteamIdx = ztteamPair.indexOf('=');
    if (ztteamIdx > 0) {
      const ztteamKey = ztteamPair.substring(0, ztteamIdx).trim();
      const ztteamVal = ztteamPair.substring(ztteamIdx + 1).trim();
      if (ztteamKey && ztteamVal) {
        ztteamResult.push({
          name: ztteamKey,
          value: ztteamVal,
          domain: ztteamDomain,
          path: '/'
        });
      }
    }
  }

  return ztteamResult;
}

/**
 * Tự động tìm kiếm ô 2FA và điền mã xác thực 6 số vào trang
 * @param {import('playwright').Page} ztteamPage - Trang Playwright
 * @param {string} ztteamSecret - Mã 2FA Secret Key
 * @returns {Promise<boolean>} Trả về true nếu đã điền và submit thành công
 */
async function ztteamTryFill2FACode(ztteamPage, ztteamSecret) {
  if (!ztteamPage || !ztteamSecret) return false;

  try {
    if (ztteamPage.isClosed()) return false;

    /** 1. Xử lý trường hợp Facebook hiện màn hình chọn phương thức (Thử cách khác / Dùng ứng dụng xác thực) */
    const ztteamTryAnotherWay = ztteamPage.locator('a, button, div[role="button"]').filter({
      hasText: /Thử cách khác|Dùng ứng dụng xác thực|Use authentication app|Try another way/i
    }).first();
    if (await ztteamTryAnotherWay.isVisible({ timeout: 500 }).catch(() => false)) {
      await ztteamTryAnotherWay.click().catch(() => {});
      await ztteamPage.waitForTimeout(1000);
    }

    /** 2. Danh sách selector nhận diện ô nhập mã 2FA */
    const ztteam2FASelectors = [
      'input[name="approvals_code"]',
      'input#approvals_code',
      'input[autocomplete="one-time-code"]',
      'input[placeholder*="mã" i]',
      'input[placeholder*="code" i]',
      'input[aria-label*="mã" i]',
      'input[aria-label*="code" i]',
      'input[type="text"][maxlength="6"]',
      'input[type="number"][maxlength="6"]',
      'input[type="tel"][maxlength="6"]',
      'input[name="code"]',
      'input#code'
    ];

    let ztteamTargetInput = null;
    for (const ztteamSel of ztteam2FASelectors) {
      const ztteamLocator = ztteamPage.locator(ztteamSel).first();
      if (await ztteamLocator.isVisible({ timeout: 200 }).catch(() => false)) {
        ztteamTargetInput = ztteamLocator;
        break;
      }
    }

    if (!ztteamTargetInput) {
      return false;
    }

    /** 3. Sinh mã TOTP 6 số từ mã bí mật */
    const ztteamTotp = ztteamGenerate2FACode(ztteamSecret);
    if (!ztteamTotp || !ztteamTotp.success || !ztteamTotp.code) {
      return false;
    }

    /** 4. Điền mã vào ô nhập */
    await ztteamTargetInput.fill(ztteamTotp.code);

    /** 5. Bấm nút Tiếp tục / Gửi mã hoặc nhấn Enter */
    const ztteamSubmitBtn = ztteamPage.locator('button, div[role="button"], input[type="submit"]').filter({
      hasText: /Tiếp tục|Gửi|Xác nhận|Continue|Submit|Next/i
    }).first();

    if (await ztteamSubmitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ztteamSubmitBtn.click().catch(() => {});
    } else {
      await ztteamTargetInput.press('Enter').catch(() => {});
    }

    /** 6. Chờ Facebook xử lý và tự động bấm qua màn hình "Lưu trình duyệt" */
    await ztteamPage.waitForTimeout(3000);

    const ztteamSaveBrowserBtn = ztteamPage.locator('button, div[role="button"], input[type="submit"]').filter({
      hasText: /Lưu trình duyệt|Tiếp tục|Continue|Không lưu/i
    }).first();
    if (await ztteamSaveBrowserBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await ztteamSaveBrowserBtn.click().catch(() => {});
    }

    return true;
  } catch (ztteamErr) {
    return false;
  }
}

/**
 * Theo dõi nền liên tục trong 45 giây để tự động điền 2FA ngay khi ô xuất hiện
 * @param {import('playwright').Page} ztteamPage - Trang Playwright
 * @param {Object} ztteamAccount - Dữ liệu tài khoản
 * @param {import('playwright').BrowserContext} ztteamContext - Context trình duyệt
 * @param {Function} ztteamOnEvent - Callback thông báo
 */
function ztteamStart2FAWatcher(ztteamPage, ztteamAccount, ztteamContext, ztteamOnEvent) {
  if (!ztteamAccount || !ztteamAccount.twoFactorSecret) return;

  const ztteamUid = String(ztteamAccount.uid);
  let ztteamFilled = false;
  let ztteamElapsedMs = 0;
  const ztteamIntervalMs = 1500;
  const ztteamMaxMs = 45000;

  const ztteamTimer = setInterval(async () => {
    ztteamElapsedMs += ztteamIntervalMs;

    /** Dừng nếu vượt quá thời gian tối đa hoặc trình duyệt đã đóng */
    if (ztteamElapsedMs > ztteamMaxMs || !ztteamActiveBrowsers.has(ztteamUid)) {
      clearInterval(ztteamTimer);
      return;
    }

    if (ztteamFilled) {
      clearInterval(ztteamTimer);
      return;
    }

    try {
      if (ztteamPage.isClosed()) {
        clearInterval(ztteamTimer);
        return;
      }

      const ztteamSuccess = await ztteamTryFill2FACode(ztteamPage, ztteamAccount.twoFactorSecret);
      if (ztteamSuccess) {
        ztteamFilled = true;
        clearInterval(ztteamTimer);
        await ztteamAddLog(ztteamUid, 'TỰ ĐỘNG ĐIỀN 2FA', 'Đã tự động nhận diện ô 2FA và điền mã xác thực thành công.');
        if (ztteamOnEvent) {
          ztteamOnEvent({
            type: 'STATUS',
            uid: ztteamUid,
            status: 'Live',
            message: 'Đã tự động điền 2FA thành công!'
          });
        }

        /** Chờ 3.5s để cập nhật Cookie sống mới */
        setTimeout(async () => {
          try {
            if (ztteamActiveBrowsers.has(ztteamUid)) {
              const ztteamCurrentCookies = await ztteamContext.cookies();
              const ztteamHasCUser = ztteamCurrentCookies.some(c => c.name === 'c_user');
              if (ztteamHasCUser) {
                const ztteamFreshCookieStr = ztteamCurrentCookies.map(c => `${c.name}=${c.value}`).join('; ');
                if (ztteamAccount.id) {
                  await ztteamUpdateAccount(ztteamAccount.id, { cookie: ztteamFreshCookieStr });
                }
                await ztteamUpdateAccountStatus(ztteamUid, 'Live');
                await ztteamAddLog(ztteamUid, 'LƯU COOKIE MỚI', 'Đã lưu Cookie mới sau khi tự động vượt 2FA.');
              }
            }
          } catch (e) {
            /** Bỏ qua lỗi cập nhật cookie phụ */
          }
        }, 3500);
      }
    } catch (e) {
      /** Bỏ qua lỗi chu kỳ */
    }
  }, ztteamIntervalMs);
}

/**
 * Mở trình duyệt tương tác trực tiếp cho một tài khoản VIA (Headed Mode)
 * @param {Object} ztteamAccount - Dữ liệu tài khoản đầy đủ
 * @param {Function} ztteamOnEvent - Callback phát sự kiện lên giao diện
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function ztteamOpenBrowser(ztteamAccount, ztteamOnEvent = null) {
  const ztteamUid = String(ztteamAccount.uid);
  const ztteamProfileDir = path.join(ZTTEAM_PROFILES_DIR, `profile_${ztteamUid}`);

  if (ztteamActiveBrowsers.has(ztteamUid)) {
    return { success: true, message: 'Trình duyệt cho tài khoản này đã đang mở.' };
  }

  let ztteamContext = null;
  try {
    if (ztteamOnEvent) ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Đang chạy', message: 'Đang khởi chạy trình duyệt...' });
    await ztteamUpdateAccountStatus(ztteamUid, 'Đang chạy');
    await ztteamAddLog(ztteamUid, 'MỞ TRÌNH DUYỆT', 'Bắt đầu khởi chạy Profile trình duyệt.');

    const ztteamProxyConfig = ztteamParseProxy(ztteamAccount.proxy);

    /** Khởi chạy Google Chrome Persistent Context (Lưu toàn bộ Cache & Session) */
    const ztteamUserAgent = ztteamAccount.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    const ztteamLaunchOptions = {
      channel: 'chrome',
      headless: false,
      viewport: null,
      proxy: ztteamProxyConfig || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ],
      userAgent: ztteamUserAgent
    };

    try {
      ztteamContext = await chromium.launchPersistentContext(ztteamProfileDir, ztteamLaunchOptions);
    } catch (ztteamLaunchErr) {
      /** Fallback sang Chromium mặc định nếu máy không cài sẵn Chrome */
      delete ztteamLaunchOptions.channel;
      ztteamContext = await chromium.launchPersistentContext(ztteamProfileDir, ztteamLaunchOptions);
    }

    ztteamActiveBrowsers.set(ztteamUid, ztteamContext);
    await ztteamApplyStealth(ztteamContext, ztteamUserAgent);

    /** Thông báo sự kiện trình duyệt đang mở thời gian thực */
    if (ztteamOnEvent) {
      ztteamOnEvent({ type: 'BROWSER_STATE', uid: ztteamUid, isOpen: true });
    }

    /** Nếu có cookie và là lần mở đầu tiên, nạp cookie vào trình duyệt */
    if (ztteamAccount.cookie) {
      const ztteamCookies = ztteamParseCookies(ztteamAccount.cookie);
      if (ztteamCookies.length > 0) {
        await ztteamContext.addCookies(ztteamCookies);
      }
    }

    const ztteamPage = ztteamContext.pages()[0] || (await ztteamContext.newPage());
    let ztteamLastStatus = 'Live';

    /** Kích hoạt bộ theo dõi tự động điền 2FA thông minh (chạy nền liên tục 45 giây) */
    ztteamStart2FAWatcher(ztteamPage, ztteamAccount, ztteamContext, ztteamOnEvent);

    /** Hàm phân loại trạng thái qua đường dẫn URL */
    const ztteamEvaluateUrl = (ztteamUrl) => {
      if (!ztteamUrl) return null;
      if (ztteamUrl.includes('checkpoint/disabled') || ztteamUrl.includes('disabled')) {
        return 'Die';
      }
      if (ztteamUrl.includes('checkpoint')) {
        return 'Checkpoint';
      }
      if (ztteamUrl.includes('/login') || ztteamUrl.includes('/recover')) {
        return 'Die';
      }
      return null;
    };

    /** Theo dõi điều hướng thời gian thực để cập nhật Checkpoint ngay khi bị dính */
    ztteamPage.on('framenavigated', async (ztteamFrame) => {
      try {
        if (ztteamFrame === ztteamPage.mainFrame()) {
          const ztteamUrl = ztteamFrame.url();
          const ztteamDetected = ztteamEvaluateUrl(ztteamUrl);
          if (ztteamDetected && ztteamDetected !== ztteamLastStatus) {
            ztteamLastStatus = ztteamDetected;
            await ztteamUpdateAccountStatus(ztteamUid, ztteamDetected);
            await ztteamAddLog(ztteamUid, 'CHUYỂN TRẠNG THÁI', `Phát hiện URL: ${ztteamDetected} (${ztteamUrl.substring(0, 100)})`);
            if (ztteamOnEvent) {
              ztteamOnEvent({
                type: 'STATUS',
                uid: ztteamUid,
                status: ztteamDetected,
                message: `Tài khoản phát hiện trạng thái: ${ztteamDetected}`
              });
            }
          }
        }
      } catch (ztteamNavErr) {
        /** Bỏ qua lỗi theo dõi URL */
      }
    });

    /** Khi người dùng tắt cửa sổ trình duyệt */
    ztteamContext.on('close', async () => {
      ztteamActiveBrowsers.delete(ztteamUid);
      const ztteamFinalStatus = ztteamLastStatus || 'Live';
      await ztteamUpdateAccountStatus(ztteamUid, ztteamFinalStatus);
      await ztteamAddLog(ztteamUid, 'ĐÓNG TRÌNH DUYỆT', `Người dùng đã đóng trình duyệt. Trạng thái lưu: ${ztteamFinalStatus}`);
      if (ztteamOnEvent) {
        ztteamOnEvent({
          type: 'STATUS',
          uid: ztteamUid,
          status: ztteamFinalStatus,
          message: `Trình duyệt đã đóng. Trạng thái: ${ztteamFinalStatus}`
        });
        ztteamOnEvent({
          type: 'BROWSER_STATE',
          uid: ztteamUid,
          isOpen: false,
          finalStatus: ztteamFinalStatus
        });
      }
    });

    /** Điều hướng mượt mà tới Facebook web chính thức trong khối try-catch an toàn */
    try {
      await ztteamPage.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (ztteamNavError) {
      /** Bỏ qua lỗi điều hướng mạng hoặc ERR_ABORTED (chuyển hướng 302 của Facebook). Tuyệt đối KHÔNG tự ý đóng trình duyệt */
      const ztteamErrMsg = ztteamNavError.message || '';
      if (!ztteamErrMsg.includes('ERR_ABORTED') && !ztteamErrMsg.includes('closed')) {
        await ztteamAddLog(ztteamUid, 'CẢNH BÁO TẢI TRANG', `Tải trang Facebook chậm hoặc gặp phản hồi mạng: ${ztteamErrMsg.substring(0, 100)}`);
      }
    }

    /** Kiểm tra ngay trạng thái URL sau khi nạp xong trang */
    try {
      const ztteamCurrentUrl = ztteamPage.url();
      const ztteamInitialStatus = ztteamEvaluateUrl(ztteamCurrentUrl);
      if (ztteamInitialStatus) {
        ztteamLastStatus = ztteamInitialStatus;
        await ztteamUpdateAccountStatus(ztteamUid, ztteamInitialStatus);
        if (ztteamOnEvent) {
          ztteamOnEvent({
            type: 'STATUS',
            uid: ztteamUid,
            status: ztteamInitialStatus,
            message: `Trạng thái nhận diện: ${ztteamInitialStatus}`
          });
        }
      }
    } catch (ztteamEvalErr) {
      /** Bỏ qua lỗi đọc URL */
    }

    /** Kiểm tra tự động đăng nhập khi cookie hết hạn hoặc chưa login */
    try {
      const ztteamIsLoginForm = await ztteamPage.evaluate(() => {
        return Boolean(document.querySelector('input[name="email"]') && document.querySelector('input[name="pass"]'));
      }).catch(() => false);

      if (ztteamIsLoginForm) {
        if (ztteamAccount.password) {
          await ztteamAddLog(ztteamUid, 'TỰ ĐỘNG ĐĂNG NHẬP', 'Phát hiện form đăng nhập. Bắt đầu tự động điền tài khoản & mật khẩu...');
          if (ztteamOnEvent) {
            ztteamOnEvent({
              type: 'STATUS',
              uid: ztteamUid,
              status: 'Đang chạy',
              message: 'Đang tự động điền tài khoản và mật khẩu...'
            });
          }

          /** Điền Email/UID và Mật khẩu */
          await ztteamPage.fill('input[name="email"]', ztteamAccount.uid || ztteamAccount.email);
          await ztteamPage.fill('input[name="pass"]', ztteamAccount.password);

          /** Bấm nút Đăng nhập */
          try {
            const ztteamLoginBtn = ztteamPage.locator('div[role="button"]').filter({ hasText: /Đăng nhập|Log In/i }).first();
            if (await ztteamLoginBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
              await ztteamLoginBtn.click();
            } else {
              await ztteamPage.press('input[name="pass"]', 'Enter');
            }
          } catch (ztteamClickErr) {
            await ztteamPage.press('input[name="pass"]', 'Enter');
          }

          /** Chờ phản hồi từ Facebook */
          await ztteamPage.waitForTimeout(3000);

          /** Thử điền 2FA ngay nếu đã xuất hiện */
          if (ztteamAccount.twoFactorSecret) {
            await ztteamTryFill2FACode(ztteamPage, ztteamAccount.twoFactorSecret);
          }

          /** Kiểm tra trạng thái và URL sau khi đăng nhập */
          const ztteamUrlAfterLogin = ztteamPage.url();
          if (ztteamUrlAfterLogin.includes('checkpoint/disabled') || ztteamUrlAfterLogin.includes('disabled')) {
            ztteamLastStatus = 'Die';
            await ztteamUpdateAccountStatus(ztteamUid, 'Die');
            await ztteamAddLog(ztteamUid, 'TÀI KHOẢN VÔ HIỆU HÓA', 'Facebook phản hồi: Tài khoản đã bị vô hiệu hóa (Disabled).');
            if (ztteamOnEvent) {
              ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Die', message: 'Tài khoản đã bị Facebook vô hiệu hóa (Disabled)' });
            }
          } else if (ztteamUrlAfterLogin.includes('checkpoint')) {
            ztteamLastStatus = 'Checkpoint';
            await ztteamUpdateAccountStatus(ztteamUid, 'Checkpoint');
            await ztteamAddLog(ztteamUid, 'CHECKPOINT', 'Tài khoản dính Checkpoint Facebook.');
            if (ztteamOnEvent) {
              ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Checkpoint', message: 'Tài khoản dính Checkpoint' });
            }
          } else {
            /** Kiểm tra cookie mới nếu đăng nhập thành công */
            const ztteamCurrentCookies = await ztteamContext.cookies();
            const ztteamHasCUser = ztteamCurrentCookies.some(c => c.name === 'c_user');
            if (ztteamHasCUser) {
              ztteamLastStatus = 'Live';
              const ztteamFreshCookieStr = ztteamCurrentCookies.map(c => `${c.name}=${c.value}`).join('; ');
              if (ztteamAccount.id) {
                await ztteamUpdateAccount(ztteamAccount.id, { cookie: ztteamFreshCookieStr });
              }
              await ztteamUpdateAccountStatus(ztteamUid, 'Live');
              await ztteamAddLog(ztteamUid, 'ĐĂNG NHẬP THÀNH CÔNG', 'Tự động đăng nhập thành công! Đã lưu Cookie mới vào hệ thống.');
              if (ztteamOnEvent) {
                ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Live', message: 'Đăng nhập thành công! Đã lưu Cookie mới' });
              }
            }
          }
        } else {
          await ztteamAddLog(ztteamUid, 'CẢNH BÁO', 'Cookie hết hạn và không có mật khẩu để tự động đăng nhập.');
        }
      } else {
        /** Nếu không có form login, kiểm tra xem đã có c_user chưa */
        const ztteamCurrentCookies = await ztteamContext.cookies();
        const ztteamHasCUser = ztteamCurrentCookies.some(c => c.name === 'c_user');
        if (ztteamHasCUser) {
          ztteamLastStatus = 'Live';
          await ztteamUpdateAccountStatus(ztteamUid, 'Live');
        }
      }
    } catch (ztteamAutoLoginErr) {
      await ztteamAddLog(ztteamUid, 'LỖI ĐĂNG NHẬP TỰ ĐỘNG', `Chi tiết: ${ztteamAutoLoginErr.message}`);
    }

    return { success: true, message: 'Đã mở trình duyệt thành công.' };
  } catch (ztteamError) {
    /** Khối này chỉ kích hoạt nếu Playwright thất bại hoàn toàn khi khởi tạo Profile */
    if (ztteamContext) {
      try {
        await ztteamContext.close();
      } catch (ztteamCloseErr) {
        /** Bỏ qua lỗi đóng */
      }
    }
    ztteamActiveBrowsers.delete(ztteamUid);
    await ztteamAddLog(ztteamUid, 'LỖI KHỞI CHẠY PROFILE', ztteamError.message);
    if (ztteamOnEvent) ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Error', message: `Lỗi khởi chạy: ${ztteamError.message}` });
    return { success: false, message: ztteamError.message };
  }
}

/**
 * Đóng trình duyệt đang mở của 1 tài khoản
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<boolean>}
 */
async function ztteamCloseBrowser(ztteamUid) {
  const ztteamContext = ztteamActiveBrowsers.get(String(ztteamUid));
  if (ztteamContext) {
    try {
      await ztteamContext.close();
      ztteamActiveBrowsers.delete(String(ztteamUid));
      return true;
    } catch (e) {
      ztteamActiveBrowsers.delete(String(ztteamUid));
      return false;
    }
  }
  return false;
}

/**
 * Tự động kiểm tra trạng thái Live/Die/Checkpoint của tài khoản (Headless Mode)
 * @param {Object} ztteamAccount - Dữ liệu tài khoản
 * @param {Function} ztteamOnEvent - Callback thông báo trạng thái
 * @returns {Promise<{uid: string, status: string, message: string}>}
 */
async function ztteamCheckAccountLive(ztteamAccount, ztteamOnEvent = null) {
  const ztteamUid = String(ztteamAccount.uid);
  const ztteamProfileDir = path.join(ZTTEAM_PROFILES_DIR, `profile_${ztteamUid}`);

  if (ztteamOnEvent) ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: 'Đang chạy', message: 'Đang kiểm tra...' });

  let ztteamContext = null;
  try {
    const ztteamProxyConfig = ztteamParseProxy(ztteamAccount.proxy);

    ztteamContext = await chromium.launchPersistentContext(ztteamProfileDir, {
      headless: true,
      viewport: { width: 1280, height: 720 },
      proxy: ztteamProxyConfig || undefined,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });

    await ztteamApplyStealth(ztteamContext);

    /** Nạp cookie nếu có */
    if (ztteamAccount.cookie) {
      const ztteamCookies = ztteamParseCookies(ztteamAccount.cookie);
      if (ztteamCookies.length > 0) {
        await ztteamContext.addCookies(ztteamCookies);
      }
    }

    const ztteamPage = ztteamContext.pages()[0] || (await ztteamContext.newPage());

    /** Mở trang mbasic hoặc web facebook để check */
    await ztteamPage.goto('https://mbasic.facebook.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const ztteamCurrentUrl = ztteamPage.url();
    let ztteamFinalStatus = 'Live';
    let ztteamMsg = 'Tài khoản hoạt động bình thường.';

    if (ztteamCurrentUrl.includes('checkpoint') || ztteamCurrentUrl.includes('disabled')) {
      ztteamFinalStatus = 'Checkpoint';
      ztteamMsg = 'Tài khoản dính Checkpoint hoặc bị khóa.';
    } else if (ztteamCurrentUrl.includes('login') || ztteamCurrentUrl.includes('recover')) {
      /** Nếu chưa đăng nhập hoặc cookie chết */
      if (ztteamAccount.password) {
        /** Tự động điền pass và 2fa nếu cần */
        ztteamFinalStatus = 'Live';
        ztteamMsg = 'Đã nhận diện mật khẩu, sẵn sàng đăng nhập.';
      } else {
        ztteamFinalStatus = 'Die';
        ztteamMsg = 'Cookie đã hết hạn và không có mật khẩu dự phòng.';
      }
    }

    await ztteamContext.close();

    await ztteamUpdateAccountStatus(ztteamUid, ztteamFinalStatus);
    await ztteamAddLog(ztteamUid, 'KIỂM TRA LIVE', `${ztteamFinalStatus}: ${ztteamMsg}`);
    if (ztteamOnEvent) ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: ztteamFinalStatus, message: ztteamMsg });

    return { uid: ztteamUid, status: ztteamFinalStatus, message: ztteamMsg };
  } catch (ztteamErr) {
    if (ztteamContext) {
      try { await ztteamContext.close(); } catch (e) {}
    }
    const ztteamErrStatus = 'Die';
    await ztteamUpdateAccountStatus(ztteamUid, ztteamErrStatus);
    await ztteamAddLog(ztteamUid, 'LỖI KIỂM TRA', ztteamErr.message);
    if (ztteamOnEvent) ztteamOnEvent({ type: 'STATUS', uid: ztteamUid, status: ztteamErrStatus, message: ztteamErr.message });
    return { uid: ztteamUid, status: ztteamErrStatus, message: ztteamErr.message };
  }
}

/**
 * Lấy danh sách UID tài khoản đang mở trình duyệt Chrome
 * @returns {Array<string>}
 */
function ztteamGetActiveBrowserUids() {
  return Array.from(ztteamActiveBrowsers.keys());
}

/**
 * Kích hoạt điền 2FA ngay lập tức cho tab trình duyệt đang mở của 1 UID
 * @param {string} ztteamUid - UID tài khoản
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function ztteamAutoFill2FANow(ztteamUid) {
  const ztteamContext = ztteamActiveBrowsers.get(String(ztteamUid));
  if (!ztteamContext) {
    return { success: false, message: 'Trình duyệt của tài khoản này chưa được mở.' };
  }

  const { ztteamGetAccountForExecution } = require('./ztteam_db');
  const ztteamAccount = await ztteamGetAccountForExecution(ztteamUid);
  if (!ztteamAccount || !ztteamAccount.twoFactorSecret) {
    return { success: false, message: 'Tài khoản không có mã 2FA secret.' };
  }

  const ztteamPages = ztteamContext.pages();
  const ztteamPage = ztteamPages[ztteamPages.length - 1] || ztteamPages[0];
  if (!ztteamPage) {
    return { success: false, message: 'Không tìm thấy tab trình duyệt đang mở.' };
  }

  const ztteamFilled = await ztteamTryFill2FACode(ztteamPage, ztteamAccount.twoFactorSecret);
  if (ztteamFilled) {
    await ztteamAddLog(ztteamUid, 'ĐIỀN 2FA TỨC THÌ', 'Đã tự động điền mã xác thực 2FA thành công.');
    return { success: true, message: 'Đã tự động điền mã 2FA thành công!' };
  } else {
    return { success: false, message: 'Không tìm thấy ô nhập 2FA trên màn hình hiện tại.' };
  }
}

/**
 * Lấy thông tin chi tiết các tab trình duyệt đang mở
 * @returns {Promise<Array<Object>>}
 */
async function ztteamGetActiveBrowserInfo() {
  const ztteamInfo = [];
  for (const [uid, context] of ztteamActiveBrowsers.entries()) {
    try {
      const pages = context.pages();
      const p = pages[0];
      ztteamInfo.push({
        uid,
        pageCount: pages.length,
        url: p ? p.url() : 'none',
        title: p ? await p.title().catch(() => '') : 'none'
      });
    } catch (err) {
      ztteamInfo.push({ uid, error: err.message });
    }
  }
  return ztteamInfo;
}

module.exports = {
  ztteamParseProxy,
  ztteamTestProxyConnection,
  ztteamOpenBrowser,
  ztteamCloseBrowser,
  ztteamCheckAccountLive,
  ztteamGetActiveBrowserUids,
  ztteamGetActiveBrowserInfo,
  ztteamAutoFill2FANow,
  ztteamTryFill2FACode
};
