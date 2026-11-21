/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamSettingsModal.jsx
 * Description: Modal cấu hình hệ thống chuẩn 100% ngôn ngữ thiết kế MetaManager
 */

import React, { useState, useEffect } from 'react';

export default function ZTTeamSettingsModal({
  ztteamIsOpen,
  ztteamOnClose,
  ztteamSettings,
  ztteamCategories,
  ztteamOnSaveSettings,
  ztteamOnAddCategory,
  ztteamOnClearAllAccounts
}) {
  const [ztteamForm, setZtteamForm] = useState({
    concurrency: '3',
    navigationTimeout: '30000',
    defaultProxy: ''
  });
  const [ztteamNewCatName, setZtteamNewCatName] = useState('');
  const [ztteamIsSaving, setZtteamIsSaving] = useState(false);

  useEffect(() => {
    if (ztteamSettings) {
      setZtteamForm({
        concurrency: ztteamSettings.concurrency || '3',
        navigationTimeout: ztteamSettings.navigationTimeout || '30000',
        defaultProxy: ztteamSettings.defaultProxy || ''
      });
    }
  }, [ztteamSettings]);

  if (!ztteamIsOpen) return null;

  /** Lưu cấu hình */
  const ztteamHandleSave = async (e) => {
    e.preventDefault();
    setZtteamIsSaving(true);
    try {
      await ztteamOnSaveSettings(ztteamForm);
      ztteamOnClose();
    } finally {
      setZtteamIsSaving(false);
    }
  };

  /** Thêm danh mục mới */
  const ztteamHandleAddCat = async (e) => {
    e.preventDefault();
    if (!ztteamNewCatName.trim()) return;
    await ztteamOnAddCategory(ztteamNewCatName.trim());
    setZtteamNewCatName('');
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
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Cấu hình hệ thống
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Thiết lập hiệu năng tự động hóa và phân loại tài khoản
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
        <div className="p-6 overflow-y-auto space-y-6">
          <form id="ztteamSettingsForm" onSubmit={ztteamHandleSave} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Hiệu năng &amp; Trình duyệt
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số luồng đồng thời (Concurrency)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={ztteamForm.concurrency}
                  onChange={(e) => setZtteamForm({ ...ztteamForm, concurrency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Khuyến nghị 2–3 luồng trên máy cá nhân</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Timeout chờ tải trang (ms)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="5000"
                  max="120000"
                  value={ztteamForm.navigationTimeout}
                  onChange={(e) => setZtteamForm({ ...ztteamForm, navigationTimeout: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Mặc định: 30,000 ms (30 giây)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Proxy mặc định (Dự phòng khi VIA không có proxy riêng)
              </label>
              <input
                type="text"
                value={ztteamForm.defaultProxy}
                onChange={(e) => setZtteamForm({ ...ztteamForm, defaultProxy: e.target.value })}
                placeholder="ip:port:user:pass hoặc http://... hoặc socks5://..."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </form>

          {/** Quản lý danh mục */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Quản lý danh mục &amp; Nhóm
            </h4>

            {/** Danh sách tag danh mục hiện có */}
            <div className="flex flex-wrap gap-2">
              {ztteamCategories.map((cat) => (
                <span
                  key={cat.id || cat.name}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>{cat.name}</span>
                </span>
              ))}
            </div>

            {/** Thêm danh mục mới */}
            <form onSubmit={ztteamHandleAddCat} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Nhập tên nhóm mới (Ví dụ: Marketing 2)..."
                value={ztteamNewCatName}
                onChange={(e) => setZtteamNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!ztteamNewCatName.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm</span>
              </button>
            </form>
          </div>
        </div>

        {/** Modal Footer */}
        <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          {ztteamOnClearAllAccounts ? (
            <button
              type="button"
              onClick={ztteamOnClearAllAccounts}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-die bg-die/10 hover:bg-die/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Xóa sạch tài khoản</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={ztteamOnClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="ztteamSettingsForm"
              disabled={ztteamIsSaving}
              className="px-5 py-2 bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{ztteamIsSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
