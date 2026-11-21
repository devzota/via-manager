# ZTTeam Auto Login System — Giải Pháp Đầy Đủ Production

Tài liệu kỹ thuật toàn diện: Công nghệ, Môi trường, Cấu trúc dự án và Mã nguồn hoàn chỉnh cho hệ thống tự động hóa đăng nhập hàng loạt 100+ tài khoản tích hợp 2FA.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ | Phiên bản | Vai trò |
| :--- | :--- | :--- | :--- |
| Runtime | Node.js | >= 20 LTS | Nền tảng chạy chính |
| Trình duyệt tự động | Playwright | ^1.48 | Điều khiển Chromium, quản lý Persistent Context |
| Chống phát hiện Bot | playwright-extra + stealth plugin | ^4.3 | Ẩn cờ `navigator.webdriver`, giả lập fingerprint |
| Sinh mã 2FA (TOTP) | otplib | ^12.0 | Tính OTP 6 số từ Base32 Secret Key theo RFC 6238 |
| Giới hạn luồng | p-limit | ^6.1 | Worker Pool, giới hạn concurrency khi chạy hàng loạt |
| Mã hóa dữ liệu | Node.js crypto (built-in) | — | AES-256-GCM mã hóa/giải mã ID, Password, 2FA Secret |
| Kiểm tra Proxy | axios + https-proxy-agent | ^1.7 / ^7.0 | Health check Proxy trước khi mở browser |
| Giải Captcha | capsolver-npm hoặc 2captcha | ^1.0 | Tự động giải reCAPTCHA / hCaptcha / Turnstile |
| Quản lý biến môi trường | dotenv | ^16.0 | Load Master Key, cấu hình từ file `.env` |
| CLI & Log | chalk + winston | ^5.0 / ^3.0 | Hiển thị log màu trên terminal, ghi log ra file |

---

## 2. Môi Trường Triển Khai (Environment)

### 2.1. Yêu Cầu Phần Cứng

| Quy mô | CPU | RAM | Disk | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 10 - 30 acc | 2 vCPU | 4 GB | 20 GB SSD | Máy tính cá nhân đủ chạy |
| 30 - 100 acc | 4 vCPU | 8 GB | 40 GB SSD | VPS/Cloud Server khuyến nghị |
| 100 - 500 acc | 8 vCPU | 16 GB | 80 GB SSD | VPS cao cấp hoặc Dedicated Server |

> [!IMPORTANT]
> Mỗi instance Chromium chiếm ~300MB - 500MB RAM. Với `CONCURRENCY = 5` (5 trình duyệt song song), cần tối thiểu **4GB RAM khả dụng**.

### 2.2. Hệ Điều Hành & Cài Đặt

**Khuyến nghị: Ubuntu 22.04 LTS (Server)**

```bash
## Bước 1: Cài Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

## Bước 2: Cài các thư viện hệ thống cho Playwright Chromium
sudo npx playwright install-deps chromium

## Bước 3: Cài Xvfb (Virtual Display) — cho chế độ Headed trên server không có màn hình
sudo apt-get install -y xvfb

## Bước 4: Clone project & cài dependencies
cd /opt
git clone https://github.com/ztteam/auto-login-system.git
cd auto-login-system
npm install

## Bước 5: Cài Playwright Chromium browser binary
npx playwright install chromium
```

**Chạy trên Windows (Dev/Test)**

```powershell
## Cài Node.js 20 LTS từ https://nodejs.org
## Mở PowerShell tại thư mục project
npm install
npx playwright install chromium
```

---

## 3. Cấu Trúc Dự Án Hoàn Chỉnh

```text
ztteam-auto-login/
├── .env                          # Master Key mã hóa, API Key Captcha Solver
├── package.json                  # Dependencies & scripts
├── config/
│   └── settings.js               # Cấu hình concurrency, timeout, retry...
├── data/
│   ├── accounts.json.enc         # File danh sách 100 acc đã mã hóa AES-256
│   └── accounts.example.json     # File mẫu plaintext (chỉ dùng để import lần đầu)
├── profiles/                     # Thư mục chứa Browser Profile cách ly
│   ├── acc_001/
│   ├── acc_002/
│   └── ...acc_100/
├── logs/
│   └── runtime.log               # Log file ghi lại quá trình chạy
├── src/
│   ├── index.js                  # Entry point chính — CLI khởi chạy
│   ├── encryption.js             # Module mã hóa/giải mã AES-256-GCM
│   ├── proxy-checker.js          # Module kiểm tra Proxy health
│   ├── fingerprint.js            # Module quản lý & cố định fingerprint
│   ├── captcha-solver.js         # Module tích hợp API giải Captcha
│   ├── totp-generator.js         # Module sinh mã 2FA (TOTP)
│   ├── login-worker.js           # Module xử lý đăng nhập 1 tài khoản
│   ├── batch-runner.js           # Module điều phối chạy hàng loạt (Worker Pool)
│   └── mutex-lock.js             # Module khóa Profile tránh xung đột
└── tools/
    ├── import-accounts.js        # Script import & mã hóa danh sách acc từ JSON plaintext
    └── decrypt-viewer.js         # Script xem (giải mã) danh sách acc (chỉ dev debug)
```

---

## 4. Mã Nguồn Hoàn Chỉnh Từng Module

### 4.1. File `.env`

```env
## ZTTeam Auto Login — Environment Variables
## KHÔNG ĐƯỢC COMMIT FILE NÀY LÊN GIT

## Master Key dùng để mã hóa/giải mã toàn bộ thông tin tài khoản
## Sinh ngẫu nhiên 1 lần duy nhất: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ZTTEAM_MASTER_KEY=a1b2c3d4e5f6...your_64_hex_chars_here...

## API Key dịch vụ giải Captcha (CapSolver hoặc 2Captcha)
ZTTEAM_CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxxxxxxxxx

## Số luồng trình duyệt chạy song song
ZTTEAM_CONCURRENCY=5

## Số lần thử lại tối đa khi lỗi
ZTTEAM_MAX_RETRIES=3
```

---

### 4.2. `package.json`

```json
{
  "name": "ztteam-auto-login",
  "version": "1.0.0",
  "description": "ZTTeam Automated Login System with 2FA & Batch Processing",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "import": "node tools/import-accounts.js",
    "dev": "node src/index.js --dry-run"
  },
  "dependencies": {
    "playwright-extra": "^4.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "otplib": "^12.0.1",
    "p-limit": "^6.1.0",
    "axios": "^1.7.0",
    "https-proxy-agent": "^7.0.0",
    "dotenv": "^16.4.0",
    "chalk": "^5.3.0",
    "winston": "^3.14.0",
    "capsolver-npm": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

### 4.3. `config/settings.js` — Cấu Hình Trung Tâm

```javascript
require('dotenv').config();

/**
 * ZTTeam — Cấu hình trung tâm cho hệ thống Auto Login
 */
const ztteamSettings = {
  /** Số trình duyệt chạy song song */
  concurrency: parseInt(process.env.ZTTEAM_CONCURRENCY) || 5,

  /** Số lần retry tối đa khi login thất bại */
  maxRetries: parseInt(process.env.ZTTEAM_MAX_RETRIES) || 3,

  /** Master Key mã hóa AES-256 */
  masterKey: process.env.ZTTEAM_MASTER_KEY,

  /** API Key dịch vụ giải Captcha */
  capsolverApiKey: process.env.ZTTEAM_CAPSOLVER_API_KEY,

  /** Đường dẫn file dữ liệu tài khoản đã mã hóa */
  accountsFilePath: './data/accounts.json.enc',

  /** Thư mục gốc chứa Browser Profiles */
  profilesDir: './profiles',

  /** Timeout chờ trang load (ms) */
  navigationTimeout: 30000,

  /** Delay gõ phím giả lập người dùng (ms) */
  typingDelay: { min: 50, max: 150 },

  /** URL trang đăng nhập mục tiêu */
  targetLoginUrl: 'https://example.com/login',

  /** CSS Selectors của trang đăng nhập mục tiêu */
  selectors: {
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: '#login-btn',
    otpInput: '#two-factor-input',
    otpSubmitButton: '#submit-2fa-btn',
    dashboardIndicator: '.user-dashboard',
    captchaFrame: 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"]'
  }
};

module.exports = ztteamSettings;
```

---

### 4.4. `src/encryption.js` — Mã Hóa AES-256-GCM

```javascript
const crypto = require('crypto');

const ZTTEAM_ALGORITHM = 'aes-256-gcm';
const ZTTEAM_IV_LENGTH = 16;
const ZTTEAM_AUTH_TAG_LENGTH = 16;

/**
 * Mã hóa chuỗi bằng AES-256-GCM
 * @param {string} ztteamPlainText - Chuỗi cần mã hóa
 * @param {string} ztteamHexKey - Master Key dạng hex (64 ký tự)
 * @returns {string} Chuỗi đã mã hóa (iv:authTag:cipherText) dạng hex
 */
function ztteamEncrypt(ztteamPlainText, ztteamHexKey) {
  const ztteamKey = Buffer.from(ztteamHexKey, 'hex');
  const ztteamIv = crypto.randomBytes(ZTTEAM_IV_LENGTH);
  const ztteamCipher = crypto.createCipheriv(ZTTEAM_ALGORITHM, ztteamKey, ztteamIv);

  let ztteamEncrypted = ztteamCipher.update(ztteamPlainText, 'utf8', 'hex');
  ztteamEncrypted += ztteamCipher.final('hex');

  const ztteamAuthTag = ztteamCipher.getAuthTag().toString('hex');

  return `${ztteamIv.toString('hex')}:${ztteamAuthTag}:${ztteamEncrypted}`;
}

/**
 * Giải mã chuỗi AES-256-GCM
 * @param {string} ztteamEncryptedText - Chuỗi đã mã hóa (iv:authTag:cipherText)
 * @param {string} ztteamHexKey - Master Key dạng hex
 * @returns {string} Chuỗi plaintext gốc
 */
function ztteamDecrypt(ztteamEncryptedText, ztteamHexKey) {
  const [ztteamIvHex, ztteamAuthTagHex, ztteamCipherHex] = ztteamEncryptedText.split(':');

  const ztteamKey = Buffer.from(ztteamHexKey, 'hex');
  const ztteamIv = Buffer.from(ztteamIvHex, 'hex');
  const ztteamAuthTag = Buffer.from(ztteamAuthTagHex, 'hex');

  const ztteamDecipher = crypto.createDecipheriv(ZTTEAM_ALGORITHM, ztteamKey, ztteamIv);
  ztteamDecipher.setAuthTag(ztteamAuthTag);

  let ztteamDecrypted = ztteamDecipher.update(ztteamCipherHex, 'hex', 'utf8');
  ztteamDecrypted += ztteamDecipher.final('utf8');

  return ztteamDecrypted;
}

/**
 * Mã hóa toàn bộ Object chứa thông tin tài khoản
 * @param {Object} ztteamAccountData - Object plaintext
 * @param {string} ztteamHexKey - Master Key
 * @returns {string} JSON string đã mã hóa
 */
function ztteamEncryptAccountData(ztteamAccountData, ztteamHexKey) {
  const ztteamJsonStr = JSON.stringify(ztteamAccountData);
  return ztteamEncrypt(ztteamJsonStr, ztteamHexKey);
}

/**
 * Giải mã toàn bộ Object tài khoản
 * @param {string} ztteamEncryptedData - Chuỗi đã mã hóa
 * @param {string} ztteamHexKey - Master Key
 * @returns {Array} Mảng Object plaintext
 */
function ztteamDecryptAccountData(ztteamEncryptedData, ztteamHexKey) {
  const ztteamJsonStr = ztteamDecrypt(ztteamEncryptedData, ztteamHexKey);
  return JSON.parse(ztteamJsonStr);
}

module.exports = { ztteamEncrypt, ztteamDecrypt, ztteamEncryptAccountData, ztteamDecryptAccountData };
```

---

### 4.5. `src/totp-generator.js` — Sinh Mã 2FA

```javascript
const { authenticator } = require('otplib');

/**
 * Sinh mã OTP 6 chữ số từ Base32 Secret Key
 * @param {string} ztteam2faSecret - Base32 TOTP Secret
 * @returns {string} Mã OTP 6 số hợp lệ tại thời điểm hiện tại
 */
function ztteamGenerateOTP(ztteam2faSecret) {
  authenticator.options = { window: 1 };
  return authenticator.generate(ztteam2faSecret);
}

/**
 * Kiểm tra thời gian còn lại trước khi mã OTP hết hạn
 * @returns {number} Số giây còn lại (OTP thường hết hạn sau 30s)
 */
function ztteamGetOTPTimeRemaining() {
  const ztteamEpoch = Math.floor(Date.now() / 1000);
  return 30 - (ztteamEpoch % 30);
}

module.exports = { ztteamGenerateOTP, ztteamGetOTPTimeRemaining };
```

---

### 4.6. `src/proxy-checker.js` — Kiểm Tra Proxy

```javascript
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

/**
 * Kiểm tra Proxy có hoạt động và trả về IP thực
 * @param {string} ztteamProxyUrl - URL Proxy (http://user:pass@ip:port)
 * @returns {Object} { alive: boolean, ip: string|null, latency: number }
 */
async function ztteamCheckProxy(ztteamProxyUrl) {
  const ztteamStartTime = Date.now();

  try {
    const ztteamAgent = new HttpsProxyAgent(ztteamProxyUrl);
    const ztteamResponse = await axios.get('https://api.ipify.org?format=json', {
      httpsAgent: ztteamAgent,
      timeout: 8000
    });

    return {
      alive: true,
      ip: ztteamResponse.data.ip,
      latency: Date.now() - ztteamStartTime
    };
  } catch (ztteamError) {
    return {
      alive: false,
      ip: null,
      latency: Date.now() - ztteamStartTime
    };
  }
}

module.exports = { ztteamCheckProxy };
```

---

### 4.7. `src/fingerprint.js` — Cố Định Fingerprint

```javascript
const fs = require('fs');
const path = require('path');

const ZTTEAM_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
];

const ZTTEAM_SCREEN_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 }
];

const ZTTEAM_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore'
];

/**
 * Lấy hoặc tạo mới Fingerprint cố định cho 1 tài khoản
 * Lần đầu sẽ random & lưu file. Lần sau đọc lại file đó để giữ đúng cũ.
 * @param {string} ztteamProfileDir - Đường dẫn thư mục Profile
 * @returns {Object} { userAgent, viewport, timezoneId, locale }
 */
function ztteamGetFingerprint(ztteamProfileDir) {
  const ztteamFpFile = path.join(ztteamProfileDir, 'fingerprint.json');

  /** Nếu đã có file fingerprint cũ -> đọc lại giữ nguyên */
  if (fs.existsSync(ztteamFpFile)) {
    return JSON.parse(fs.readFileSync(ztteamFpFile, 'utf8'));
  }

  /** Lần đầu: random fingerprint & lưu vĩnh viễn */
  const ztteamFingerprint = {
    userAgent: ZTTEAM_USER_AGENTS[Math.floor(Math.random() * ZTTEAM_USER_AGENTS.length)],
    viewport: ZTTEAM_SCREEN_SIZES[Math.floor(Math.random() * ZTTEAM_SCREEN_SIZES.length)],
    timezoneId: ZTTEAM_TIMEZONES[Math.floor(Math.random() * ZTTEAM_TIMEZONES.length)],
    locale: 'vi-VN'
  };

  fs.mkdirSync(ztteamProfileDir, { recursive: true });
  fs.writeFileSync(ztteamFpFile, JSON.stringify(ztteamFingerprint, null, 2));

  return ztteamFingerprint;
}

module.exports = { ztteamGetFingerprint };
```

---

### 4.8. `src/captcha-solver.js` — Giải Captcha Tự Động

```javascript
const ztteamSettings = require('../config/settings');

/**
 * Phát hiện và giải quyết Captcha trên trang
 * @param {import('playwright').Page} ztteamPage - Playwright Page instance
 * @returns {boolean} true nếu đã giải thành công hoặc không có Captcha
 */
async function ztteamSolveCaptchaIfPresent(ztteamPage) {
  try {
    /** Kiểm tra xem trang có iFrame Captcha không */
    const ztteamCaptchaFrame = await ztteamPage.$(ztteamSettings.selectors.captchaFrame);

    if (!ztteamCaptchaFrame) {
      return true; /** Không có Captcha */
    }

    console.log('[ZTTeam Captcha] Phát hiện Captcha. Đang gửi yêu cầu giải...');

    /** Lấy SiteKey từ trang */
    const ztteamSiteKey = await ztteamPage.evaluate(() => {
      const recaptchaEl = document.querySelector('.g-recaptcha');
      if (recaptchaEl) return recaptchaEl.getAttribute('data-sitekey');
      const hcaptchaEl = document.querySelector('.h-captcha');
      if (hcaptchaEl) return hcaptchaEl.getAttribute('data-sitekey');
      return null;
    });

    if (!ztteamSiteKey) {
      console.log('[ZTTeam Captcha] Không tìm thấy SiteKey.');
      return false;
    }

    /** Gọi API CapSolver để giải */
    const { Solver } = require('capsolver-npm');
    const ztteamSolver = new Solver(ztteamSettings.capsolverApiKey);

    const ztteamResult = await ztteamSolver.recaptchav2({
      pageurl: ztteamPage.url(),
      sitekey: ztteamSiteKey
    });

    /** Inject token vào form */
    await ztteamPage.evaluate((token) => {
      const responseEl = document.querySelector('#g-recaptcha-response') || document.querySelector('[name="g-recaptcha-response"]');
      if (responseEl) {
        responseEl.value = token;
        responseEl.style.display = 'block';
      }
    }, ztteamResult.text);

    console.log('[ZTTeam Captcha] Giải Captcha thành công!');
    return true;

  } catch (ztteamError) {
    console.error('[ZTTeam Captcha] Lỗi giải Captcha:', ztteamError.message);
    return false;
  }
}

module.exports = { ztteamSolveCaptchaIfPresent };
```

---

### 4.9. `src/mutex-lock.js` — Khóa Profile Tránh Xung Đột

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Đặt khóa cho thư mục Profile (tạo file .lock)
 * @param {string} ztteamProfileDir - Đường dẫn thư mục Profile
 * @returns {boolean} true nếu đặt khóa thành công, false nếu đã bị khóa bởi Worker khác
 */
function ztteamAcquireLock(ztteamProfileDir) {
  const ztteamLockFile = path.join(ztteamProfileDir, '.lock');

  if (fs.existsSync(ztteamLockFile)) {
    /** Kiểm tra lock cũ có bị treo không (quá 5 phút -> xóa lock cũ) */
    const ztteamLockAge = Date.now() - fs.statSync(ztteamLockFile).mtimeMs;
    if (ztteamLockAge > 5 * 60 * 1000) {
      fs.unlinkSync(ztteamLockFile);
    } else {
      return false; /** Profile đang bị Worker khác sử dụng */
    }
  }

  fs.mkdirSync(ztteamProfileDir, { recursive: true });
  fs.writeFileSync(ztteamLockFile, JSON.stringify({
    pid: process.pid,
    lockedAt: new Date().toISOString()
  }));

  return true;
}

/**
 * Giải phóng khóa Profile
 * @param {string} ztteamProfileDir - Đường dẫn thư mục Profile
 */
function ztteamReleaseLock(ztteamProfileDir) {
  const ztteamLockFile = path.join(ztteamProfileDir, '.lock');
  if (fs.existsSync(ztteamLockFile)) {
    fs.unlinkSync(ztteamLockFile);
  }
}

module.exports = { ztteamAcquireLock, ztteamReleaseLock };
```

---

### 4.10. `src/login-worker.js` — Xử Lý Đăng Nhập 1 Tài Khoản (Core Worker)

```javascript
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const ztteamSettings = require('../config/settings');
const { ztteamGenerateOTP, ztteamGetOTPTimeRemaining } = require('./totp-generator');
const { ztteamCheckProxy } = require('./proxy-checker');
const { ztteamGetFingerprint } = require('./fingerprint');
const { ztteamSolveCaptchaIfPresent } = require('./captcha-solver');
const { ztteamAcquireLock, ztteamReleaseLock } = require('./mutex-lock');

chromium.use(stealth);

/**
 * Delay ngẫu nhiên giả lập hành vi con người
 */
function ztteamRandomDelay(ztteamMin, ztteamMax) {
  const ztteamMs = Math.floor(Math.random() * (ztteamMax - ztteamMin + 1)) + ztteamMin;
  return new Promise(resolve => setTimeout(resolve, ztteamMs));
}

/**
 * Xử lý đăng nhập hoàn chỉnh cho 1 tài khoản (có Retry)
 * @param {Object} ztteamAccount - Object chứa thông tin tài khoản đã giải mã
 * @returns {Object} { success: boolean, accId: string, message: string }
 */
async function ztteamLoginSingleAccount(ztteamAccount) {
  const { ztteam_acc_id, ztteam_username, ztteam_password, ztteam_2fa_secret, ztteam_proxy, ztteam_profile_dir } = ztteamAccount;

  /** ========== BƯỚC 0: Mutex Lock ========== */
  if (!ztteamAcquireLock(ztteam_profile_dir)) {
    return { success: false, accId: ztteam_acc_id, message: 'Profile đang bị khóa bởi Worker khác' };
  }

  /** ========== BƯỚC 1: Kiểm tra Proxy ========== */
  if (ztteam_proxy) {
    const ztteamProxyStatus = await ztteamCheckProxy(ztteam_proxy);
    if (!ztteamProxyStatus.alive) {
      ztteamReleaseLock(ztteam_profile_dir);
      return { success: false, accId: ztteam_acc_id, message: `Proxy DEAD: ${ztteam_proxy}` };
    }
    console.log(`[ZTTeam] Proxy OK cho ${ztteam_acc_id} | IP: ${ztteamProxyStatus.ip} | Latency: ${ztteamProxyStatus.latency}ms`);
  }

  /** ========== BƯỚC 2: Lấy Fingerprint cố định ========== */
  const ztteamFp = ztteamGetFingerprint(ztteam_profile_dir);

  /** ========== BƯỚC 3: Retry Loop ========== */
  for (let ztteamAttempt = 1; ztteamAttempt <= ztteamSettings.maxRetries; ztteamAttempt++) {
    let ztteamContext = null;

    try {
      /** Khởi tạo Persistent Browser Context */
      ztteamContext = await chromium.launchPersistentContext(ztteam_profile_dir, {
        headless: false,
        proxy: ztteam_proxy ? { server: ztteam_proxy } : undefined,
        userAgent: ztteamFp.userAgent,
        viewport: ztteamFp.viewport,
        timezoneId: ztteamFp.timezoneId,
        locale: ztteamFp.locale,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      const ztteamPage = await ztteamContext.newPage();
      ztteamPage.setDefaultTimeout(ztteamSettings.navigationTimeout);

      /** Truy cập trang đăng nhập */
      await ztteamPage.goto(ztteamSettings.targetLoginUrl, { waitUntil: 'networkidle' });

      /** ========== BƯỚC 4: Kiểm tra Session cũ ========== */
      const ztteamIsLoggedIn = await ztteamPage.$(ztteamSettings.selectors.dashboardIndicator);

      if (ztteamIsLoggedIn) {
        console.log(`[ZTTeam] ✅ Tái sử dụng Session thành công: ${ztteam_acc_id}`);
        
        /** === THỰC HIỆN CÔNG VIỆC CỦA ACC Ở ĐÂY === */
        
        await ztteamContext.close();
        ztteamReleaseLock(ztteam_profile_dir);
        return { success: true, accId: ztteam_acc_id, message: 'Session reuse - không cần login lại' };
      }

      /** ========== BƯỚC 5: Nhập ID & Password ========== */
      console.log(`[ZTTeam] 🔐 Tiến hành Login cho: ${ztteam_acc_id} (lần thử ${ztteamAttempt})`);

      await ztteamRandomDelay(500, 1500);
      await ztteamPage.fill(ztteamSettings.selectors.usernameInput, '');
      await ztteamPage.type(ztteamSettings.selectors.usernameInput, ztteam_username, {
        delay: Math.floor(Math.random() * (ztteamSettings.typingDelay.max - ztteamSettings.typingDelay.min)) + ztteamSettings.typingDelay.min
      });

      await ztteamRandomDelay(300, 800);
      await ztteamPage.fill(ztteamSettings.selectors.passwordInput, '');
      await ztteamPage.type(ztteamSettings.selectors.passwordInput, ztteam_password, {
        delay: Math.floor(Math.random() * (ztteamSettings.typingDelay.max - ztteamSettings.typingDelay.min)) + ztteamSettings.typingDelay.min
      });

      await ztteamRandomDelay(500, 1000);

      /** Giải Captcha nếu có trước khi bấm Login */
      await ztteamSolveCaptchaIfPresent(ztteamPage);

      await ztteamPage.click(ztteamSettings.selectors.loginButton);

      /** ========== BƯỚC 6: Xử lý 2FA ========== */
      try {
        await ztteamPage.waitForSelector(ztteamSettings.selectors.otpInput, { timeout: 10000 });

        /** Đợi đủ thời gian nếu OTP sắp hết hạn */
        const ztteamTimeLeft = ztteamGetOTPTimeRemaining();
        if (ztteamTimeLeft < 5) {
          console.log(`[ZTTeam] ⏳ OTP sắp hết hạn (${ztteamTimeLeft}s). Đợi mã mới...`);
          await ztteamRandomDelay(ztteamTimeLeft * 1000 + 1000, ztteamTimeLeft * 1000 + 2000);
        }

        const ztteamOtpCode = ztteamGenerateOTP(ztteam_2fa_secret);
        await ztteamRandomDelay(300, 600);
        await ztteamPage.type(ztteamSettings.selectors.otpInput, ztteamOtpCode, { delay: 80 });
        await ztteamRandomDelay(300, 500);
        await ztteamPage.click(ztteamSettings.selectors.otpSubmitButton);

        await ztteamPage.waitForNavigation({ waitUntil: 'networkidle' });

      } catch (ztteam2faError) {
        /** Có thể trang không yêu cầu 2FA (ví dụ nhớ thiết bị) -> bỏ qua */
        console.log(`[ZTTeam] Trang không yêu cầu 2FA hoặc đã bypass: ${ztteam2faError.message}`);
      }

      /** ========== BƯỚC 7: Xác nhận đăng nhập thành công ========== */
      const ztteamLoginSuccess = await ztteamPage.$(ztteamSettings.selectors.dashboardIndicator);

      if (ztteamLoginSuccess) {
        console.log(`[ZTTeam] ✅ Đăng nhập thành công: ${ztteam_acc_id}`);

        /** === THỰC HIỆN CÔNG VIỆC CỦA ACC Ở ĐÂY === */

        await ztteamContext.close();
        ztteamReleaseLock(ztteam_profile_dir);
        return { success: true, accId: ztteam_acc_id, message: 'Login thành công' };
      }

      /** Login thất bại -> retry */
      console.log(`[ZTTeam] ❌ Login thất bại cho ${ztteam_acc_id}. Retry...`);
      await ztteamContext.close();

    } catch (ztteamError) {
      console.error(`[ZTTeam] ❌ Lỗi tài khoản ${ztteam_acc_id} lần ${ztteamAttempt}:`, ztteamError.message);
      if (ztteamContext) await ztteamContext.close();
    }

    /** Exponential Backoff: chờ 5s, 10s, 20s giữa mỗi lần retry */
    if (ztteamAttempt < ztteamSettings.maxRetries) {
      const ztteamWait = 5000 * Math.pow(2, ztteamAttempt - 1);
      console.log(`[ZTTeam] ⏳ Đợi ${ztteamWait / 1000}s trước khi retry...`);
      await new Promise(resolve => setTimeout(resolve, ztteamWait));
    }
  }

  ztteamReleaseLock(ztteam_profile_dir);
  return { success: false, accId: ztteam_acc_id, message: `Thất bại sau ${ztteamSettings.maxRetries} lần thử` };
}

module.exports = { ztteamLoginSingleAccount };
```

---

### 4.11. `src/batch-runner.js` — Điều Phối Chạy Hàng Loạt

```javascript
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const ztteamSettings = require('../config/settings');
const { ztteamDecryptAccountData } = require('./encryption');
const { ztteamLoginSingleAccount } = require('./login-worker');

/**
 * Chạy hàng loạt tất cả tài khoản trong hệ thống
 * @returns {Object} Báo cáo kết quả { total, success, failed, results[] }
 */
async function ztteamRunBatch() {
  console.log('='.repeat(60));
  console.log('[ZTTeam Batch] Khởi chạy hệ thống Auto Login');
  console.log(`[ZTTeam Batch] Concurrency: ${ztteamSettings.concurrency} luồng song song`);
  console.log('='.repeat(60));

  /** Đọc & giải mã danh sách tài khoản */
  const ztteamEncryptedData = fs.readFileSync(ztteamSettings.accountsFilePath, 'utf8');
  const ztteamAccounts = ztteamDecryptAccountData(ztteamEncryptedData, ztteamSettings.masterKey);

  console.log(`[ZTTeam Batch] Tổng số tài khoản: ${ztteamAccounts.length}`);

  /** Gắn đường dẫn Profile cho từng acc */
  ztteamAccounts.forEach(acc => {
    acc.ztteam_profile_dir = path.resolve(ztteamSettings.profilesDir, acc.ztteam_acc_id);
  });

  /** Khởi tạo Worker Pool */
  const ztteamLimit = pLimit(ztteamSettings.concurrency);
  const ztteamStartTime = Date.now();

  /** Đưa tất cả acc vào hàng đợi */
  const ztteamTasks = ztteamAccounts.map((account, index) => {
    return ztteamLimit(async () => {
      console.log(`\n[ZTTeam Batch] ─── Xử lý tài khoản ${index + 1}/${ztteamAccounts.length}: ${account.ztteam_acc_id} ───`);
      return ztteamLoginSingleAccount(account);
    });
  });

  /** Chờ tất cả hoàn thành */
  const ztteamResults = await Promise.all(ztteamTasks);

  /** Báo cáo kết quả */
  const ztteamSuccessCount = ztteamResults.filter(r => r.success).length;
  const ztteamFailedCount = ztteamResults.filter(r => !r.success).length;
  const ztteamDuration = ((Date.now() - ztteamStartTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('[ZTTeam Batch] BÁO CÁO KẾT QUẢ');
  console.log('='.repeat(60));
  console.log(`  Tổng:        ${ztteamAccounts.length}`);
  console.log(`  Thành công:  ${ztteamSuccessCount} ✅`);
  console.log(`  Thất bại:    ${ztteamFailedCount} ❌`);
  console.log(`  Thời gian:   ${ztteamDuration}s`);
  console.log('='.repeat(60));

  /** Log chi tiết acc thất bại */
  const ztteamFailed = ztteamResults.filter(r => !r.success);
  if (ztteamFailed.length > 0) {
    console.log('\n[ZTTeam Batch] Danh sách tài khoản thất bại:');
    ztteamFailed.forEach(r => console.log(`  - ${r.accId}: ${r.message}`));
  }

  /** Ghi log ra file */
  const ztteamLogData = {
    timestamp: new Date().toISOString(),
    total: ztteamAccounts.length,
    success: ztteamSuccessCount,
    failed: ztteamFailedCount,
    duration: ztteamDuration + 's',
    details: ztteamResults
  };
  fs.mkdirSync('./logs', { recursive: true });
  fs.writeFileSync('./logs/runtime.log', JSON.stringify(ztteamLogData, null, 2));

  return ztteamLogData;
}

module.exports = { ztteamRunBatch };
```

---

### 4.12. `src/index.js` — Entry Point (CLI)

```javascript
require('dotenv').config();
const { ztteamRunBatch } = require('./batch-runner');
const ztteamSettings = require('../config/settings');

/**
 * ZTTeam Auto Login System — Entry Point
 */
async function ztteamMain() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ZTTeam Auto Login System v1.0.0           ║');
  console.log('║   Batch Login with 2FA & Proxy Isolation    ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  /** Kiểm tra Master Key */
  if (!ztteamSettings.masterKey || ztteamSettings.masterKey.length !== 64) {
    console.error('[ZTTeam] ❌ ZTTEAM_MASTER_KEY chưa được cấu hình hoặc sai định dạng trong file .env');
    process.exit(1);
  }

  /** Kiểm tra chế độ Dry Run */
  if (process.argv.includes('--dry-run')) {
    console.log('[ZTTeam] Chế độ DRY RUN — chỉ kiểm tra cấu hình, không chạy login thật.\n');
    console.log(`  Master Key:    ${'*'.repeat(60)}${ztteamSettings.masterKey.slice(-4)}`);
    console.log(`  Concurrency:   ${ztteamSettings.concurrency}`);
    console.log(`  Max Retries:   ${ztteamSettings.maxRetries}`);
    console.log(`  Target URL:    ${ztteamSettings.targetLoginUrl}`);
    console.log(`  Accounts File: ${ztteamSettings.accountsFilePath}`);
    console.log(`  Profiles Dir:  ${ztteamSettings.profilesDir}`);
    process.exit(0);
  }

  /** Chạy Batch */
  try {
    await ztteamRunBatch();
  } catch (ztteamError) {
    console.error('[ZTTeam] ❌ Lỗi nghiêm trọng:', ztteamError.message);
    process.exit(1);
  }
}

ztteamMain();
```

---

### 4.13. `tools/import-accounts.js` — Import & Mã Hóa Danh Sách Tài Khoản

```javascript
require('dotenv').config();
const fs = require('fs');
const { ztteamEncryptAccountData } = require('../src/encryption');

/**
 * Script import danh sách tài khoản từ JSON plaintext -> file mã hóa AES-256
 *
 * Cách dùng:
 *   1. Tạo file data/accounts.example.json theo mẫu bên dưới
 *   2. Chạy: npm run import
 *   3. File data/accounts.json.enc sẽ được tạo (đã mã hóa)
 *   4. XÓA NGAY file accounts.example.json sau khi import xong
 */

const ZTTEAM_EXAMPLE_PATH = './data/accounts.example.json';
const ZTTEAM_ENCRYPTED_PATH = './data/accounts.json.enc';

/**
 * Mẫu file accounts.example.json:
 * [
 *   {
 *     "ztteam_acc_id": "acc_001",
 *     "ztteam_username": "user001@domain.com",
 *     "ztteam_password": "password123",
 *     "ztteam_2fa_secret": "JBSWY3DPEHPK3PXP",
 *     "ztteam_proxy": "http://user:pass@1.2.3.4:8080",
 *     "ztteam_status": "active"
 *   }
 * ]
 */

function ztteamImportAccounts() {
  const ztteamMasterKey = process.env.ZTTEAM_MASTER_KEY;

  if (!ztteamMasterKey || ztteamMasterKey.length !== 64) {
    console.error('[ZTTeam Import] ❌ ZTTEAM_MASTER_KEY chưa được cấu hình đúng trong .env');
    process.exit(1);
  }

  if (!fs.existsSync(ZTTEAM_EXAMPLE_PATH)) {
    console.error(`[ZTTeam Import] ❌ Không tìm thấy file: ${ZTTEAM_EXAMPLE_PATH}`);
    console.log('[ZTTeam Import] Hãy tạo file này theo mẫu trong comment bên trên.');
    process.exit(1);
  }

  const ztteamRawData = JSON.parse(fs.readFileSync(ZTTEAM_EXAMPLE_PATH, 'utf8'));
  console.log(`[ZTTeam Import] Đọc được ${ztteamRawData.length} tài khoản từ file plaintext.`);

  const ztteamEncrypted = ztteamEncryptAccountData(ztteamRawData, ztteamMasterKey);
  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync(ZTTEAM_ENCRYPTED_PATH, ztteamEncrypted);

  console.log(`[ZTTeam Import] ✅ Đã mã hóa và lưu vào: ${ZTTEAM_ENCRYPTED_PATH}`);
  console.log('[ZTTeam Import] ⚠️  HÃY XÓA NGAY file plaintext: ' + ZTTEAM_EXAMPLE_PATH);
}

ztteamImportAccounts();
```

---

## 5. Quy Trình Vận Hành Từ A → Z

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 Developer
    participant Env as 🖥️ Server/VPS
    participant Tool as 🤖 ZTTeam Auto Login
    participant Target as 🌐 Trang Đăng Nhập

    Dev->>Env: 1. Cài Node.js 20 + Playwright + Dependencies
    Dev->>Env: 2. Cấu hình .env (Master Key, API Key)
    Dev->>Env: 3. Tạo accounts.example.json (100 acc)
    Dev->>Tool: 4. npm run import (mã hóa danh sách acc)
    Dev->>Dev: 5. XÓA file plaintext

    Dev->>Tool: 6. npm start (khởi chạy Batch)
    
    loop Mỗi Acc trong hàng đợi (Worker Pool = 5)
        Tool->>Tool: Kiểm tra Proxy Health
        Tool->>Tool: Khóa Mutex Profile
        Tool->>Tool: Load Fingerprint cố định
        Tool->>Target: Mở trình duyệt (Persistent Profile)
        
        alt Cookie/Session còn hạn
            Target-->>Tool: Vào thẳng Dashboard ✅
        else Cookie hết hạn
            Tool->>Target: Nhập Username (delay 50-150ms)
            Tool->>Target: Nhập Password (delay 50-150ms)
            Tool->>Tool: Giải Captcha (nếu có)
            Tool->>Target: Bấm Login
            Tool->>Tool: Sinh mã OTP từ TOTP Secret
            Tool->>Target: Nhập mã 2FA & Submit
            Target-->>Tool: Login thành công ✅
        end
        
        Tool->>Tool: Thực hiện tác vụ của acc
        Tool->>Tool: Đóng browser & giải phóng RAM
        Tool->>Tool: Giải phóng Mutex Lock
    end
    
    Tool->>Dev: 7. Báo cáo: 95/100 thành công, 5 thất bại
    Tool->>Env: 8. Ghi log vào logs/runtime.log
```

---

## 6. Lệnh Chạy Nhanh

```bash
## Bước 1: Cài đặt dependencies
npm install

## Bước 2: Cài Chromium cho Playwright
npx playwright install chromium

## Bước 3: Sinh Master Key (chạy 1 lần duy nhất, copy kết quả vào .env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## Bước 4: Import & mã hóa danh sách tài khoản
npm run import

## Bước 5: Test cấu hình (Dry Run)
npm run dev

## Bước 6: Chạy thật
npm start

## Chạy trên Server Linux không có màn hình (dùng Xvfb)
xvfb-run --auto-servernum npm start
```
