/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamEditModal.jsx
 * Description: Modal chỉnh sửa thông tin chi tiết tài khoản chuẩn 100% ngôn ngữ thiết kế MetaManager
 */

import React, { useState, useEffect } from 'react';
import { ztteamTestProxy } from '../services/ztteam_api';

export default function ZTTeamEditModal({
  ztteamIsOpen,
  ztteamOnClose,
  ztteamAccount,
  ztteamCategories = [],
  ztteamOnSave
}) {
  const [ztteamForm, setZtteamForm] = useState({
    name: '',
    status: 'Live',
    category: 'Mặc định',
    proxy: '',
    password: '',
    twoFactorSecret: '',
    cookie: ''
  });

  const [ztteamIsSubmitting, setZtteamIsSubmitting] = useState(false);
  const [ztteamTestingProxy, setZtteamTestingProxy] = useState(false);
  const [ztteamProxyResult, setZtteamProxyResult] = useState(null);
  const [ztteamQuickInput, setZtteamQuickInput] = useState('');
  const [ztteamQuickNotice, setZtteamQuickNotice] = useState(null);

  useEffect(() => {
    if (ztteamAccount) {
      /** Loại bỏ triệt để nếu tên đang lưu là chuỗi User-Agent */
      const isBadName = ztteamAccount.name && /Mozilla\/5\.0|AppleWebKit|Chrome\/\d+|Safari\/\d+/i.test(ztteamAccount.name);
      setZtteamForm({
        name: isBadName ? `VIA_${ztteamAccount.uid}` : (ztteamAccount.name || ''),
        status: ztteamAccount.status || 'Live',
        category: ztteamAccount.category || 'Mặc định',
        proxy: ztteamAccount.proxy || '',
        password: ztteamAccount.password || '',
        twoFactorSecret: ztteamAccount.twoFactorSecret || '',
        cookie: ztteamAccount.cookie || ''
      });
      setZtteamProxyResult(null);
      setZtteamQuickInput('');
      setZtteamQuickNotice(null);
    }
  }, [ztteamAccount]);

  if (!ztteamIsOpen || !ztteamAccount) return null;

  /** Kiểm tra thử Proxy */
  const ztteamHandleTestProxy = async () => {
    if (!ztteamForm.proxy) return;
    setZtteamTestingProxy(true);
    setZtteamProxyResult(null);
    try {
      const res = await ztteamTestProxy(ztteamForm.proxy);
      setZtteamProxyResult(res);
    } catch (err) {
      setZtteamProxyResult({ success: false, message: err.message });
    } finally {
      setZtteamTestingProxy(false);
    }
  };

  /** Lưu thông tin chỉnh sửa */
  const ztteamHandleSubmit = async (e) => {
    e.preventDefault();
    setZtteamIsSubmitting(true);
    try {
      await ztteamOnSave(ztteamAccount.id, ztteamForm);
      ztteamOnClose();
    } finally {
      setZtteamIsSubmitting(false);
    }
  };

  /** Phân tích thông minh chuỗi định dạng nhanh */
  const ztteamHandleQuickParse = (rawStr) => {
    if (!rawStr || !rawStr.trim()) return;
    const delimiter = rawStr.includes('\t') ? '\t' : '|';
    const parts = rawStr.split(delimiter).map((s) => s.trim());
    if (parts.length === 0) return;

    let detectedName = '';
    let detectedPassword = '';
    let detectedTwoFactor = '';
    let detectedCookie = '';
    let detectedProxy = '';

    const remaining = [];
    for (const part of parts) {
      if (!part) continue;
      /** Bỏ qua nếu là chính UID của tài khoản */
      if (part === ztteamAccount.uid) continue;

      /** Bỏ qua User-Agent chuỗi dài */
      if (/Mozilla\/5\.0/i.test(part) || /AppleWebKit/i.test(part) || /Chrome\/\d+/i.test(part) || /Safari\/\d+/i.test(part)) {
        continue;
      }

      /** Nhận diện Cookie */
      if (/c_user=|xs=|datr=|sb=/i.test(part)) {
        detectedCookie = part;
      }
      /** Nhận diện Proxy */
      else if (/^(?:socks5:\/\/|http:\/\/)?(?:[a-zA-Z0-9.-]+):(\d{2,5})(?::.*)?$/.test(part) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(part)) {
        detectedProxy = part;
      }
      /** Nhận diện 2FA Secret (16-32 ký tự Base32, không có khoảng trắng) */
      else if (/^[A-Z2-7]{16,32}$/i.test(part.replace(/\s+/g, '')) && !part.includes(' ')) {
        detectedTwoFactor = part.replace(/\s+/g, '').toUpperCase();
      }
      /** Nhận diện tên có dấu hoặc khoảng trắng (loại trừ User-Agent) */
      else if (
        part.length < 40 &&
        !/Mozilla/i.test(part) &&
        !/AppleWebKit/i.test(part) &&
        !/Chrome/i.test(part) &&
        !/Safari/i.test(part) &&
        (/\s|[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(part))
      ) {
        detectedName = part;
      }
      else {
        remaining.push(part);
      }
    }

    /** Bỏ qua các chuỗi User-Agent còn sót lại trong remaining */
    const cleanRemaining = remaining.filter((r) => !/Mozilla|AppleWebKit|Safari|Chrome/i.test(r));

    /** Gán mật khẩu từ phần tử còn lại đầu tiên */
    if (!detectedPassword && cleanRemaining.length > 0) {
      detectedPassword = cleanRemaining.shift();
    }
    if (!detectedTwoFactor && cleanRemaining.length > 0 && /^[A-Za-z0-9]{16,32}$/.test(cleanRemaining[0])) {
      detectedTwoFactor = cleanRemaining.shift();
    }

    const updated = { ...ztteamForm };
    const detectedList = [];

    if (detectedPassword) {
      updated.password = detectedPassword;
      detectedList.push('Mật khẩu');
    }
    if (detectedTwoFactor) {
      updated.twoFactorSecret = detectedTwoFactor;
      detectedList.push('2FA Secret');
    }
    if (detectedCookie) {
      updated.cookie = detectedCookie;
      detectedList.push('Cookie');
    }
    if (detectedProxy) {
      updated.proxy = detectedProxy;
      detectedList.push('Proxy');
    }
    if (detectedName) {
      updated.name = detectedName;
      detectedList.push('Tên');
    } else if (/Mozilla\/5\.0|AppleWebKit|Chrome\/\d+|Safari\/\d+/i.test(updated.name)) {
      updated.name = `VIA_${ztteamAccount.uid}`;
    }

    setZtteamForm(updated);
    if (detectedList.length > 0) {
      setZtteamQuickNotice(`✓ Đã tự động điền: ${detectedList.join(', ')}`);
    } else {
      setZtteamQuickNotice('⚠️ Không nhận diện được trường nào trong chuỗi.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      {/** Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={ztteamOnClose}
      ></div>

      {/** Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col m-4 transition-colors duration-200 border-0 max-h-[90vh] overflow-hidden">
        {/** Modal Header */}
        <div className="px-6 py-5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">edit_note</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Chỉnh sửa tài khoản
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                UID: <span className="font-mono text-primary font-bold">{ztteamAccount.uid}</span>
              </p>
            </div>
          </div>
          <button
            title="Đóng"
            onClick={ztteamOnClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/** Modal Body */}
        <form id="ztteamEditAccountForm" onSubmit={ztteamHandleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/** Khung dán nhanh chuỗi định dạng (Smart Quick Paste) */}
          <div className="p-3.5 bg-primary/5 dark:bg-primary/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary dark:text-blue-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Dán nhanh chuỗi định dạng</span>
              </label>
              <span className="text-[10px] text-slate-400">UID|Pass|2FA|Cookie|Proxy...</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={ztteamQuickInput}
                onChange={(e) => {
                  setZtteamQuickInput(e.target.value);
                  ztteamHandleQuickParse(e.target.value);
                }}
                placeholder="Dán chuỗi: UID|Pass|2FA|Cookie|Proxy (tự động phân tích)..."
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => ztteamHandleQuickParse(ztteamQuickInput)}
                className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                <span>Điền nhanh</span>
              </button>
            </div>
            {ztteamQuickNotice && (
              <p className="text-[11px] font-semibold text-live dark:text-emerald-400">
                {ztteamQuickNotice}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/** Tên hiển thị */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên tài khoản
              </label>
              <input
                type="text"
                value={ztteamForm.name}
                onChange={(e) => setZtteamForm({ ...ztteamForm, name: e.target.value })}
                placeholder="Nhập họ và tên..."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/** Trạng thái (Hệ thống tự động nhận diện) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Trạng thái</span>
                <span className="text-[10px] text-slate-400 font-normal">Tự động nhận diện</span>
              </label>
              <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex items-center gap-2 border-0">
                {ztteamForm.status === 'Live' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-live/10 text-live">
                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse"></span>
                    Live (Hoạt động tốt)
                  </span>
                )}
                {ztteamForm.status === 'Checkpoint' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-checkpoint/10 text-checkpoint">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Checkpoint (Cần gỡ)
                  </span>
                )}
                {ztteamForm.status === 'Die' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-die/10 text-die">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Die (Đã chết)
                  </span>
                )}
                {(!ztteamForm.status || ztteamForm.status === 'Chưa check') && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-slate-500">
                    Chưa kiểm tra (Sẽ tự nhận khi mở trình duyệt)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/** Nhóm / Danh mục */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nhóm / Danh mục
              </label>
              <select
                value={ztteamForm.category}
                onChange={(e) => setZtteamForm({ ...ztteamForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {ztteamCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/** Mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu (Facebook)
              </label>
              <input
                type="text"
                value={ztteamForm.password}
                onChange={(e) => setZtteamForm({ ...ztteamForm, password: e.target.value })}
                placeholder="Để trống nếu không đổi..."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/** Proxy */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Proxy riêng (IP:PORT hoặc IP:PORT:USER:PASS)
              </label>
              <button
                type="button"
                onClick={ztteamHandleTestProxy}
                disabled={!ztteamForm.proxy || ztteamTestingProxy}
                className="text-[11px] font-bold text-primary dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[14px]">speed</span>
                <span>{ztteamTestingProxy ? 'Đang test...' : 'Kiểm tra Proxy'}</span>
              </button>
            </div>
            <input
              type="text"
              value={ztteamForm.proxy}
              onChange={(e) => setZtteamForm({ ...ztteamForm, proxy: e.target.value })}
              placeholder="103.47.21.8:8080:user:pass hoặc user:pass:ip:port"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {ztteamProxyResult && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs flex items-start gap-2.5 border-0 ${
                  ztteamProxyResult.success
                    ? 'bg-live/10 text-live'
                    : 'bg-die/10 text-die'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  {ztteamProxyResult.success ? 'check_circle' : 'error'}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {ztteamProxyResult.message}
                    {ztteamProxyResult.latency !== undefined ? ` • Ping: ${ztteamProxyResult.latency}ms` : ''}
                  </p>
                  {ztteamProxyResult.ip && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      IP: <span className="font-mono font-bold">{ztteamProxyResult.ip}</span>
                      {ztteamProxyResult.country ? ` (🌍 ${ztteamProxyResult.country})` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/** 2FA Secret */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã 2FA Secret Key
            </label>
            <input
              type="text"
              value={ztteamForm.twoFactorSecret}
              onChange={(e) => setZtteamForm({ ...ztteamForm, twoFactorSecret: e.target.value })}
              placeholder="Để trống nếu không đổi (chuỗi 16-32 ký tự Base32)..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono uppercase border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/** Cookie */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Cookie Facebook
            </label>
            <textarea
              rows={2}
              value={ztteamForm.cookie}
              onChange={(e) => setZtteamForm({ ...ztteamForm, cookie: e.target.value })}
              placeholder="Để trống nếu không đổi (c_user=...; xs=...)..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>
        </form>

        {/** Modal Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          <button
            type="button"
            onClick={ztteamOnClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="ztteamEditAccountForm"
            disabled={ztteamIsSubmitting}
            className="px-5 py-2 bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{ztteamIsSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
