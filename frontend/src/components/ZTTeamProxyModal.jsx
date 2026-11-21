/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamProxyModal.jsx
 * Description: Modal Quản lý & Cài đặt Proxy, kiểm tra live proxy chuẩn ngôn ngữ thiết kế MetaManager
 */

import React, { useState, useEffect } from 'react';
import { ztteamTestProxy } from '../services/ztteam_api';

export default function ZTTeamProxyModal({
  ztteamIsOpen,
  ztteamOnClose,
  ztteamTargetAccount = null,
  ztteamDefaultProxy = '',
  ztteamOnSaveDefaultProxy,
  ztteamOnUpdateAccountProxy
}) {
  const [ztteamProxyInput, setZtteamProxyInput] = useState('');
  const [ztteamTesting, setZtteamTesting] = useState(false);
  const [ztteamTestResult, setZtteamTestResult] = useState(null);
  const [ztteamIsSaving, setZtteamIsSaving] = useState(false);

  useEffect(() => {
    if (ztteamTargetAccount) {
      setZtteamProxyInput(ztteamTargetAccount.proxy || '');
    } else {
      setZtteamProxyInput(ztteamDefaultProxy || '');
    }
    setZtteamTestResult(null);
  }, [ztteamTargetAccount, ztteamDefaultProxy, ztteamIsOpen]);

  if (!ztteamIsOpen) return null;

  /** Kiểm tra live Proxy */
  const ztteamHandleTest = async () => {
    if (!ztteamProxyInput.trim()) return;
    setZtteamTesting(true);
    setZtteamTestResult(null);
    try {
      const res = await ztteamTestProxy(ztteamProxyInput.trim());
      setZtteamTestResult(res);
    } catch (err) {
      setZtteamTestResult({ success: false, message: err.message });
    } finally {
      setZtteamTesting(false);
    }
  };

  /** Lưu proxy */
  const ztteamHandleSave = async (e) => {
    e.preventDefault();
    setZtteamIsSaving(true);
    try {
      if (ztteamTargetAccount && ztteamOnUpdateAccountProxy) {
        await ztteamOnUpdateAccountProxy(ztteamTargetAccount.id, ztteamProxyInput.trim());
      } else if (ztteamOnSaveDefaultProxy) {
        await ztteamOnSaveDefaultProxy(ztteamProxyInput.trim());
      }
      ztteamOnClose();
    } finally {
      setZtteamIsSaving(false);
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
              <span className="material-symbols-outlined text-[22px]">vpn_lock</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {ztteamTargetAccount ? 'Đổi Proxy Tài Khoản' : 'Cài Đặt Proxy Hệ Thống'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {ztteamTargetAccount
                  ? `Đổi proxy cho tài khoản UID: ${ztteamTargetAccount.uid}`
                  : 'Cấu hình proxy mặc định và kiểm tra kết nối mạng'}
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
        <form id="ztteamProxyForm" onSubmit={ztteamHandleSave} className="p-6 overflow-y-auto space-y-5">
          {/** Format Info */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Các định dạng Proxy hỗ trợ:</p>
            <ul className="space-y-1 font-mono text-[11px] text-primary dark:text-blue-400">
              <li>• ip:port (VD: 103.47.21.8:8080)</li>
              <li>• ip:port:user:pass</li>
              <li>• user:pass:ip:port (Chuẩn nhà cung cấp MMO)</li>
              <li>• http://user:pass@ip:port</li>
              <li>• socks5://user:pass@ip:port</li>
              <li>• IPv6: [2001:...]:port:user:pass</li>
            </ul>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {ztteamTargetAccount ? 'Proxy mới cho tài khoản' : 'Proxy mặc định hệ thống'}
              </label>
              <button
                type="button"
                onClick={ztteamHandleTest}
                disabled={!ztteamProxyInput.trim() || ztteamTesting}
                className="text-xs font-bold text-primary dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">speed</span>
                <span>{ztteamTesting ? 'Đang test...' : 'Kiểm tra Proxy Live'}</span>
              </button>
            </div>
            <input
              type="text"
              value={ztteamProxyInput}
              onChange={(e) => setZtteamProxyInput(e.target.value)}
              placeholder="103.47.21.8:8080:user:pass hoặc user:pass:ip:port"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/** Kết quả Test Proxy (Zero borders) */}
          {ztteamTestResult && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-3 border-0 transition-all ${
                ztteamTestResult.success
                  ? 'bg-live/10 text-live'
                  : 'bg-die/10 text-die'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] shrink-0 mt-0.5">
                {ztteamTestResult.success ? 'check_circle' : 'error'}
              </span>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-sm leading-tight">{ztteamTestResult.message}</p>
                {ztteamTestResult.ip && (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 pt-1">
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 dark:text-slate-400">IP Public:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/80">
                        {ztteamTestResult.ip}
                      </span>
                      {ztteamTestResult.latency !== undefined && (
                        <span className="font-mono font-semibold text-live">
                          • Ping: {ztteamTestResult.latency}ms
                        </span>
                      )}
                    </p>
                    {(ztteamTestResult.country || ztteamTestResult.city || ztteamTestResult.isp) && (
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        {ztteamTestResult.country && (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            🌍 {ztteamTestResult.city ? `${ztteamTestResult.city}, ` : ''}{ztteamTestResult.country}
                          </span>
                        )}
                        {ztteamTestResult.isp && (
                          <span>({ztteamTestResult.isp})</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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
            form="ztteamProxyForm"
            disabled={ztteamIsSaving}
            className="px-5 py-2 bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{ztteamIsSaving ? 'Đang lưu...' : 'Lưu Proxy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
