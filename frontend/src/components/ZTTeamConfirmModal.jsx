/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamConfirmModal.jsx
 * Description: Component Modal xác nhận hành động tái sử dụng chuẩn phong cách Zero-Border (không dùng border)
 */

import React, { useEffect } from 'react';

export default function ZTTeamConfirmModal({
  ztteamIsOpen,
  ztteamTitle = 'Xác nhận hành động',
  ztteamMessage = 'Bạn có chắc chắn muốn thực hiện hành vi này?',
  ztteamType = 'danger', /** 'danger' | 'warning' | 'info' */
  ztteamConfirmText = 'Xác nhận',
  ztteamCancelText = 'Hủy bỏ',
  ztteamSecondaryText = null,
  ztteamOnConfirm,
  ztteamOnCancel,
  ztteamOnSecondary = null
}) {
  /** Lắng nghe phím Escape để đóng modal */
  useEffect(() => {
    const ztteamHandleKeyDown = (e) => {
      if (e.key === 'Escape' && ztteamIsOpen && ztteamOnCancel) {
        ztteamOnCancel();
      }
    };
    if (ztteamIsOpen) {
      window.addEventListener('keydown', ztteamHandleKeyDown);
    }
    return () => window.removeEventListener('keydown', ztteamHandleKeyDown);
  }, [ztteamIsOpen, ztteamOnCancel]);

  if (!ztteamIsOpen) return null;

  /** Cấu hình giao diện icon và màu nút theo type mà không sử dụng border */
  let ztteamIcon = 'help';
  let ztteamIconBg = 'bg-primary/15 text-primary dark:text-blue-400';
  let ztteamConfirmBtnBg = 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20';

  if (ztteamType === 'danger') {
    ztteamIcon = 'delete_forever';
    ztteamIconBg = 'bg-rose-500/15 text-rose-500 dark:text-rose-400';
    ztteamConfirmBtnBg = 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25';
  } else if (ztteamType === 'warning') {
    ztteamIcon = 'warning';
    ztteamIconBg = 'bg-amber-500/15 text-amber-500 dark:text-amber-400';
    ztteamConfirmBtnBg = 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25';
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      {/** Thẻ Card Modal chuẩn Zero-Border */}
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-black/40 text-left transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {/** Icon nhận diện */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ztteamIconBg}`}>
            <span className="material-symbols-outlined text-[26px]">{ztteamIcon}</span>
          </div>

          {/** Nội dung tiêu đề và thông điệp */}
          <div className="flex-1 pt-0.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {ztteamTitle}
            </h3>
            <div className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-normal">
              {ztteamMessage}
            </div>
          </div>
        </div>

        {/** Các nút hành động (Zero Border) */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-2">
          {/** Nút Hủy */}
          <button
            type="button"
            onClick={ztteamOnCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            {ztteamCancelText}
          </button>

          {/** Nút hành động phụ nếu có (VD: Gán Proxy ngay) */}
          {ztteamSecondaryText && ztteamOnSecondary && (
            <button
              type="button"
              onClick={ztteamOnSecondary}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-primary dark:text-blue-400 bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
            >
              {ztteamSecondaryText}
            </button>
          )}

          {/** Nút Xác nhận chính */}
          <button
            type="button"
            onClick={ztteamOnConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${ztteamConfirmBtnBg}`}
          >
            {ztteamConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
