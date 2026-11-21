/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamToast.jsx
 * Description: Component thông báo Toast nổi tái sử dụng chuẩn phong cách Zero-Border (không dùng border)
 */

import React, { useEffect, useState } from 'react';

export default function ZTTeamToast({ ztteamToast, ztteamOnClose, ztteamDuration = 3500 }) {
  const [ztteamProgress, setZtteamProgress] = useState(100);

  useEffect(() => {
    if (!ztteamToast) return;

    setZtteamProgress(100);
    const ztteamStartTime = Date.now();
    const ztteamInterval = setInterval(() => {
      const ztteamElapsed = Date.now() - ztteamStartTime;
      const ztteamRemaining = Math.max(0, 100 - (ztteamElapsed / ztteamDuration) * 100);
      setZtteamProgress(ztteamRemaining);

      if (ztteamElapsed >= ztteamDuration) {
        clearInterval(ztteamInterval);
        if (ztteamOnClose) ztteamOnClose();
      }
    }, 30);

    return () => clearInterval(ztteamInterval);
  }, [ztteamToast, ztteamDuration, ztteamOnClose]);

  if (!ztteamToast) return null;

  const { message, type = 'info' } = ztteamToast;

  /** Cấu hình màu sắc, icon theo từng loại mà tuyệt đối không dùng class border */
  let ztteamIcon = 'info';
  let ztteamIconBg = 'bg-primary/20 text-primary dark:text-blue-400';
  let ztteamProgressBarColor = 'bg-primary';

  if (type === 'success') {
    ztteamIcon = 'check_circle';
    ztteamIconBg = 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400';
    ztteamProgressBarColor = 'bg-emerald-500';
  } else if (type === 'error' || type === 'danger') {
    ztteamIcon = 'error';
    ztteamIconBg = 'bg-rose-500/20 text-rose-500 dark:text-rose-400';
    ztteamProgressBarColor = 'bg-rose-500';
  } else if (type === 'warning') {
    ztteamIcon = 'warning';
    ztteamIconBg = 'bg-amber-500/20 text-amber-500 dark:text-amber-400';
    ztteamProgressBarColor = 'bg-amber-500';
  }

  return (
    <div className="fixed bottom-6 right-6 z-[130] animate-fadeIn">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl shadow-black/40 backdrop-blur-md px-4 py-3.5 flex items-center gap-3.5 max-w-md min-w-[300px]">
        {/** Icon đại diện */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ztteamIconBg}`}>
          <span className="material-symbols-outlined text-[18px]">{ztteamIcon}</span>
        </div>

        {/** Nội dung thông điệp */}
        <div className="flex-1 pr-2">
          <p className="text-xs font-medium leading-relaxed text-slate-100">
            {message}
          </p>
        </div>

        {/** Nút tắt nhanh */}
        <button
          onClick={ztteamOnClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>

        {/** Thanh tiến trình tự tiêu biến (Zero Border) */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/40">
          <div
            className={`h-full transition-all duration-75 ${ztteamProgressBarColor}`}
            style={{ width: `${ztteamProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
