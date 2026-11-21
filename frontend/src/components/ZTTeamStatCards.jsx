/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamStatCards.jsx
 * Description: 4 Thẻ thống kê chuẩn 100% kèm biểu đồ SVG Sparkline & Gradients của thiết kế MetaManager
 */

import React from 'react';

export default function ZTTeamStatCards({ ztteamStats, ztteamActiveFilter, ztteamOnSelectFilter }) {
  const totalCount = ztteamStats.total || 0;
  const liveCount = ztteamStats.live || 0;
  const cpCount = ztteamStats.checkpoint || 0;
  const dieCount = ztteamStats.die || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
      {/** Card 1: Tổng tài khoản */}
      <div
        onClick={() => ztteamOnSelectFilter('')}
        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex flex-col gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
          ztteamActiveFilter === '' ? 'ring-2 ring-primary/40' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Tổng tài khoản
          </span>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">monitoring</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-live text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+12% tháng này</span>
          </div>
        </div>
        <div className="mt-1 h-10 w-full rounded-lg relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 24">
            <defs>
              <linearGradient id="ztteamGradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d="M0 24 L0 14 L15 16 L30 10 L45 13 L60 7 L75 11 L90 4 L105 8 L120 3 L120 24 Z" fill="url(#ztteamGradTotal)" />
            <path d="M0 14 L15 16 L30 10 L45 13 L60 7 L75 11 L90 4 L105 8 L120 3" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="120" cy="3" r="3" fill="#2563eb" />
          </svg>
        </div>
      </div>

      {/** Card 2: Đang hoạt động */}
      <div
        onClick={() => ztteamOnSelectFilter('Live')}
        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex flex-col gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
          ztteamActiveFilter === 'Live' ? 'ring-2 ring-live/40' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Đang hoạt động
          </span>
          <div className="w-9 h-9 rounded-xl bg-live/10 text-live flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-extrabold tracking-tight text-live">
            {liveCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-live text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+5% tuần này</span>
          </div>
        </div>
        <div className="mt-1 h-10 w-full rounded-lg relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 24">
            <defs>
              <linearGradient id="ztteamGradLive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d="M0 24 L0 18 L15 15 L30 19 L45 11 L60 14 L75 8 L90 12 L105 5 L120 2 L120 24 Z" fill="url(#ztteamGradLive)" />
            <path d="M0 18 L15 15 L30 19 L45 11 L60 14 L75 8 L90 12 L105 5 L120 2" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="120" cy="2" r="3" fill="#10b981" />
          </svg>
        </div>
      </div>

      {/** Card 3: Checkpoint */}
      <div
        onClick={() => ztteamOnSelectFilter('Checkpoint')}
        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex flex-col gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
          ztteamActiveFilter === 'Checkpoint' ? 'ring-2 ring-checkpoint/40' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Checkpoint
          </span>
          <div className="w-9 h-9 rounded-xl bg-checkpoint/10 text-checkpoint flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-extrabold tracking-tight text-checkpoint">
            {cpCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-die text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+2% hôm nay</span>
          </div>
        </div>
        <div className="mt-1 h-10 w-full rounded-lg relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 24">
            <defs>
              <linearGradient id="ztteamGradCp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d="M0 24 L0 20 L15 18 L30 19 L45 16 L60 17 L75 13 L90 15 L105 11 L120 12 L120 24 Z" fill="url(#ztteamGradCp)" />
            <path d="M0 20 L15 18 L30 19 L45 16 L60 17 L75 13 L90 15 L105 11 L120 12" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="120" cy="12" r="3" fill="#f59e0b" />
          </svg>
        </div>
      </div>

      {/** Card 4: Đã chết */}
      <div
        onClick={() => ztteamOnSelectFilter('Die')}
        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex flex-col gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
          ztteamActiveFilter === 'Die' ? 'ring-2 ring-die/40' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Đã chết
          </span>
          <div className="w-9 h-9 rounded-xl bg-die/10 text-die flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">error</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-extrabold tracking-tight text-die">
            {dieCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-live text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_down</span>
            <span>-8% tháng này</span>
          </div>
        </div>
        <div className="mt-1 h-10 w-full rounded-lg relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 24">
            <defs>
              <linearGradient id="ztteamGradDie" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d="M0 24 L0 6 L15 10 L30 8 L45 14 L60 11 L75 16 L90 13 L105 19 L120 17 L120 24 Z" fill="url(#ztteamGradDie)" />
            <path d="M0 6 L15 10 L30 8 L45 14 L60 11 L75 16 L90 13 L105 19 L120 17" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="120" cy="17" r="3" fill="#ef4444" />
          </svg>
        </div>
      </div>
    </div>
  );
}
