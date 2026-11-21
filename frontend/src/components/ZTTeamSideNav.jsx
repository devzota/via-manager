/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamSideNav.jsx
 * Description: SideNavBar chuẩn 100% theo bản thiết kế MetaManager
 */

import React from 'react';

export default function ZTTeamSideNav({
  ztteamTotalAccounts,
  ztteamCurrentTab,
  ztteamOnSelectTab,
  ztteamOnOpenAddModal
}) {
  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-sm flex flex-col py-6 z-50 transition-colors duration-200">
      {/** Logo & Tiêu đề */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold shadow-md shadow-primary/20 overflow-hidden">
          <img
            className="w-6 h-6 object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiUJM4t10Hs35bxF_r7_X498wTtrbvZe_FK7jGzvnV6TY_pinKTfs0_NtTlz_TF59v04dgfAdngffHXTM6budQOpis_AWUNz-x72F_7aU24fsTMmER9S_zl4tMDnYy0aVqJTiAIDFTzgRHxB2zrfx21tq8V0Px1LT33xM3W3XNJ5ICXh7IW2werzVD0RqKAJwWAqYsIaqOXdNcan-SDBniRGSDF79XfdvAW_THXNrzT3ulSiJScLKEWg"
            alt="MetaManager Logo"
          />
        </div>
        <div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            MetaManager
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Enterprise Admin
          </p>
        </div>
      </div>

      {/** Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="px-3 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Menu chính
        </p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => ztteamOnSelectTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all text-left ${
                ztteamCurrentTab === 'dashboard'
                  ? 'bg-primary/10 text-primary dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Bảng điều khiển</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => ztteamOnSelectTab('accounts')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold transition-all text-left ${
                ztteamCurrentTab === 'accounts'
                  ? 'bg-primary/10 text-primary dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
              <span>Tài khoản</span>
              <span className="ml-auto bg-primary/10 text-primary dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {ztteamTotalAccounts.toLocaleString()}
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => ztteamOnSelectTab('groups')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">groups</span>
              <span>Nhóm</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => ztteamOnSelectTab('proxy')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">vpn_lock</span>
              <span>Cài đặt Proxy</span>
            </button>
          </li>
        </ul>

        <p className="px-3 mt-6 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Hệ thống
        </p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => ztteamOnSelectTab('logs')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>Nhật ký</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-live animate-pulse"></span>
            </button>
          </li>
          <li>
            <button
              onClick={() => ztteamOnSelectTab('settings')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Cài đặt</span>
            </button>
          </li>
        </ul>
      </div>

      {/** Sidebar Footer */}
      <div className="px-4 mt-auto pt-4 space-y-3">
        {/** System Status Box */}
        <div className="px-4 py-3 rounded-xl bg-live/10 dark:bg-live/15">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-live animate-pulse"></span>
            <span className="text-xs font-bold text-live">Hệ thống hoạt động</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Engine sẵn sàng • ZTTeam Safe
          </p>
        </div>

        <button
          onClick={ztteamOnOpenAddModal}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl shadow-lg shadow-primary/25 font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Thêm tài khoản</span>
        </button>
      </div>
    </nav>
  );
}
