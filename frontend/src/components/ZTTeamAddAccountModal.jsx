/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamAddAccountModal.jsx
 * Description: Modal thêm tài khoản đơn lẻ và nhập tài khoản hàng loạt (Bulk Import)
 */

import React, { useState } from 'react';
import { X, Plus, UploadCloud, Shield, HelpCircle } from 'lucide-react';

export default function ZTTeamAddAccountModal({
  ztteamIsOpen,
  ztteamInitialMode = 'single',
  ztteamCategories,
  ztteamOnClose,
  ztteamOnCreateSingle,
  ztteamOnBulkImport
}) {
  const [ztteamActiveTab, setZtteamActiveTab] = useState(ztteamInitialMode);
  const [ztteamIsSubmitting, setZtteamIsSubmitting] = useState(false);

  /** State cho form đơn lẻ */
  const [ztteamSingleForm, setZtteamSingleForm] = useState({
    uid: '',
    name: '',
    password: '',
    twoFactorSecret: '',
    cookie: '',
    proxy: '',
    email: '',
    emailPass: '',
    category: 'Mặc định'
  });

  /** State cho form hàng loạt */
  const [ztteamBulkText, setZtteamBulkText] = useState('');
  const [ztteamBulkCategory, setZtteamBulkCategory] = useState('Mặc định');

  if (!ztteamIsOpen) return null;

  /** Xử lý submit form đơn lẻ */
  const ztteamHandleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!ztteamSingleForm.uid.trim()) return;

    setZtteamIsSubmitting(true);
    try {
      await ztteamOnCreateSingle(ztteamSingleForm);
      setZtteamSingleForm({
        uid: '',
        name: '',
        password: '',
        twoFactorSecret: '',
        cookie: '',
        proxy: '',
        email: '',
        emailPass: '',
        category: 'Mặc định'
      });
      ztteamOnClose();
    } finally {
      setZtteamIsSubmitting(false);
    }
  };

  /** Xử lý submit form hàng loạt */
  const ztteamHandleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!ztteamBulkText.trim()) return;

    setZtteamIsSubmitting(true);
    try {
      await ztteamOnBulkImport(ztteamBulkText, ztteamBulkCategory);
      setZtteamBulkText('');
      ztteamOnClose();
    } finally {
      setZtteamIsSubmitting(false);
    }
  };

  const ztteamLineCount = ztteamBulkText.trim() ? ztteamBulkText.trim().split('\n').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-850 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/** Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              {ztteamActiveTab === 'single' ? <Plus className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Thêm Tài Khoản VIA</h3>
              <p className="text-xs text-slate-400">Dữ liệu nhạy cảm được tự động mã hóa AES-256-GCM khi lưu trữ</p>
            </div>
          </div>
          <button
            onClick={ztteamOnClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/** Tab chuyển đổi */}
        <div className="flex border-b border-slate-700/80 px-6 pt-3 bg-slate-900/30 gap-6">
          <button
            onClick={() => setZtteamActiveTab('single')}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              ztteamActiveTab === 'single'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm 1 tài khoản</span>
          </button>
          <button
            onClick={() => setZtteamActiveTab('bulk')}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              ztteamActiveTab === 'bulk'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Nhập hàng loạt (Bulk Import)</span>
          </button>
        </div>

        {/** Nội dung Modal theo Tab */}
        <div className="p-6 overflow-y-auto flex-1">
          {ztteamActiveTab === 'single' ? (
            <form onSubmit={ztteamHandleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    UID Facebook <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ztteamSingleForm.uid}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, uid: e.target.value })}
                    placeholder="Ví dụ: 100089123456789"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tên gợi nhớ / Nickname</label>
                  <input
                    type="text"
                    value={ztteamSingleForm.name}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, name: e.target.value })}
                    placeholder="Ví dụ: VIA Cổ 2018 - Acc 01"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu Facebook</label>
                  <input
                    type="text"
                    value={ztteamSingleForm.password}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, password: e.target.value })}
                    placeholder="Mật khẩu (Sẽ được mã hóa AES-256)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mã 2FA Secret Key</label>
                  <input
                    type="text"
                    value={ztteamSingleForm.twoFactorSecret}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, twoFactorSecret: e.target.value })}
                    placeholder="Khóa 2FA Base32 (VD: 4W3X...)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Proxy riêng cho tài khoản (Hỗ trợ cả IPv4 &amp; IPv6)
                </label>
                <input
                  type="text"
                  value={ztteamSingleForm.proxy}
                  onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, proxy: e.target.value })}
                  placeholder="ip:port:user:pass hoặc [2001:...]:port:user:pass"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cookie Facebook</label>
                <textarea
                  rows="2"
                  value={ztteamSingleForm.cookie}
                  onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, cookie: e.target.value })}
                  placeholder="c_user=...; xs=...; datr=...;"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Danh mục phân loại</label>
                  <select
                    value={ztteamSingleForm.category}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {ztteamCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email khôi phục (nếu có)</label>
                  <input
                    type="email"
                    value={ztteamSingleForm.email}
                    onChange={(e) => setZtteamSingleForm({ ...ztteamSingleForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={ztteamOnClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={ztteamIsSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{ztteamIsSubmitting ? 'Đang lưu...' : 'Lưu Tài Khoản'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={ztteamHandleBulkSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Định dạng mỗi dòng một tài khoản:</p>
                  <p className="font-mono text-[11px] text-indigo-200">
                    UID|PASS|2FA|COOKIE|PROXY|EMAIL|PASSMAIL
                  </p>
                  <p className="text-[11px] text-indigo-300 mt-1">
                    Ví dụ tối giản: <code className="bg-slate-900 px-1 py-0.5 rounded text-white">1000123456|MatKhau123|JBSWY3DPEHPK3PXP</code>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Danh sách tài khoản ({ztteamLineCount} dòng)
                  </label>
                  <span className="text-[11px] text-slate-400">Tự động nhận diện Proxy IPv4 &amp; IPv6</span>
                </div>
                <textarea
                  rows="8"
                  required
                  value={ztteamBulkText}
                  onChange={(e) => setZtteamBulkText(e.target.value)}
                  placeholder={`100089123456789|MatKhauA@123|4W3XZ44V6S9D|c_user=...; xs=...;|123.45.67.89:8080:user:pass\n100089123456790|MatKhauB@456|7Y2XZ44V6S9E||[2001:db8::1]:8080:user:pass`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gán vào danh mục</label>
                <select
                  value={ztteamBulkCategory}
                  onChange={(e) => setZtteamBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {ztteamCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={ztteamOnClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={ztteamIsSubmitting || ztteamLineCount === 0}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{ztteamIsSubmitting ? 'Đang nhập...' : `Import ${ztteamLineCount} Tài Khoản`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
