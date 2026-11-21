/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamAddModal.jsx
 * Description: Modal thêm tài khoản hàng loạt chuẩn 100% markup và phong cách của MetaManager
 */

import React, { useState } from 'react';

export default function ZTTeamAddModal({
  ztteamIsOpen,
  ztteamOnClose,
  ztteamOnBulkImport
}) {
  const [ztteamRawText, setZtteamRawText] = useState('');
  const [ztteamCategory, setZtteamCategory] = useState('Marketing');
  const [ztteamIsSubmitting, setZtteamIsSubmitting] = useState(false);

  if (!ztteamIsOpen) return null;

  /** Phân tích số lượng dòng và hợp lệ */
  const lines = ztteamRawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const totalCount = lines.length;
  const validCount = lines.filter((l) => {
    const delimiter = l.includes('\t') ? '\t' : '|';
    return l.split(delimiter).length >= 1 && l.split(delimiter)[0].trim();
  }).length;
  const invalidCount = totalCount - validCount;

  const ztteamHandleSubmit = async () => {
    if (totalCount === 0) return;
    setZtteamIsSubmitting(true);
    try {
      const res = await ztteamOnBulkImport(ztteamRawText, ztteamCategory);
      if (res && res.success) {
        setZtteamRawText('');
        ztteamOnClose();
      }
    } finally {
      setZtteamIsSubmitting(false);
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
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col m-4 transition-colors duration-200">
        {/** Modal Header */}
        <div className="px-6 py-5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Thêm tài khoản hàng loạt
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập danh sách tài khoản theo định dạng tự động nhận diện
            </p>
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
        <div className="p-6">
          {/** Category Selection */}
          <div className="mb-4 flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nhóm / Danh mục:
            </label>
            <select
              value={ztteamCategory}
              onChange={(e) => setZtteamCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="Marketing">Marketing</option>
              <option value="Bán hàng">Bán hàng</option>
              <option value="Hỗ trợ">Hỗ trợ</option>
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="VIA Cổ">VIA Cổ</option>
              <option value="VIA Ngoại">VIA Ngoại</option>
              <option value="VIA Kháng">VIA Kháng</option>
              <option value="Mặc định">Mặc định</option>
            </select>
          </div>

          {/** Format Guide */}
          <div className="flex items-start gap-3 bg-primary/5 dark:bg-primary/10 rounded-xl p-3.5 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white mb-0.5">Hỗ trợ đa định dạng (Phân tách bằng | hoặc Tab):</p>
              <div className="flex flex-wrap gap-1 mt-1 text-[11px] font-mono text-primary dark:text-blue-400">
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">UID|PASS</span>
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">UID|PASS|2FA</span>
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">UID|PASS|2FA|COOKIE|PROXY</span>
              </div>
            </div>
          </div>

          <textarea
            value={ztteamRawText}
            onChange={(e) => setZtteamRawText(e.target.value)}
            className="w-full h-44 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm border-0 focus:border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="1000847362910|matkhau1|JBSWY3DPEHPK3PXP|cookie...|103.47.21.8:8080&#10;1000847362911|matkhau2|KRSXG5CTMVRXEZLU"
          ></textarea>

          {/** Stats Preview */}
          <div className="flex items-center gap-5 mt-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
              <span>{totalCount} tài khoản</span>
            </div>
            <div className="flex items-center gap-1.5 text-live font-semibold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{validCount} hợp lệ</span>
            </div>
            <div className="flex items-center gap-1.5 text-die font-semibold">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{invalidCount} lỗi</span>
            </div>
          </div>
        </div>

        {/** Modal Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          <button
            onClick={ztteamOnClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            disabled={ztteamIsSubmitting || totalCount === 0}
            onClick={ztteamHandleSubmit}
            className="px-5 py-2 bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            <span>{ztteamIsSubmitting ? 'Đang thêm...' : 'Bắt đầu thêm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
