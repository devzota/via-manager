/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamTopNav.jsx
 * Description: TopNavBar chuẩn 100% theo bản thiết kế MetaManager
 */

import React, { useState, useEffect, useRef } from 'react';

export default function ZTTeamTopNav({
  ztteamTotalAccounts,
  ztteamSearch,
  ztteamOnSearchChange,
  ztteamOnOpenSettings
}) {
  const [ztteamIsDark, setZtteamIsDark] = useState(true);
  const [ztteamUserOpen, setZtteamUserOpen] = useState(false);
  const ztteamSearchInputRef = useRef(null);
  const ztteamDropdownRef = useRef(null);

  /** Quản lý Theme Dark/Light */
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setZtteamIsDark(isDark);
  }, []);

  const ztteamToggleTheme = () => {
    const nextDark = !ztteamIsDark;
    setZtteamIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ztteam_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ztteam_theme', 'light');
    }
  };

  /** Phím tắt Ctrl+K để focus vào ô tìm kiếm */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        ztteamSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /** Đóng dropdown khi click bên ngoài */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ztteamDropdownRef.current && !ztteamDropdownRef.current.contains(e.target)) {
        setZtteamUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center gap-6">
        {/** Tiêu đề trang & Badge đếm */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
            Quản lý tài khoản
          </h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400">
            {ztteamTotalAccounts.toLocaleString()}
          </span>
        </div>

        {/** Harmonized Search Bar (Zero borders) */}
        <div className="relative flex-1 max-w-md mx-4">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            ref={ztteamSearchInputRef}
            type="text"
            value={ztteamSearch}
            onChange={(e) => ztteamOnSearchChange(e.target.value)}
            placeholder="Tìm kiếm tài khoản, UID, proxy..."
            className="w-full h-11 pl-11 pr-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-xl text-sm border-0 focus:border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all shadow-inner"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md shadow-sm">
            Ctrl+K
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          {/** Theme Toggle Button */}
          <button
            onClick={ztteamToggleTheme}
            title="Chuyển chế độ giao diện"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">
              {ztteamIsDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/** Notification Bell */}
          <button
            title="Thông báo"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all relative active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-die text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              3
            </span>
          </button>

          {/** User Profile Dropdown */}
          <div className="relative" ref={ztteamDropdownRef}>
            <button
              onClick={() => setZtteamUserOpen(!ztteamUserOpen)}
              className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 pl-2 pr-3.5 py-2 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-2 ring-primary/20">
                <img
                  alt="Admin Avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFTKUSLhVbxK9rQkT16vUOsEu45pYea5m7OmTUOHR6J1sjwz9DBWh5otk6U9l4g_atgtLFKdPoi0yU9UTk2jQQh-Bupy8cYxEMQWa1jSJapqIAGksf4ZimiTTUkL_QFDHFHXUezQ8DAmn6hX95WrufZXpdMtynuCTyeK41Z0c4CJE_c-h4z0JrOLOnTf1RitY-gTCY4dBbO3ILToUmxQ01pqo2PbJEfEdftbyR40P0ATXpnR6MJODSdQ"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  Admin User
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  Super Admin
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-[16px] text-slate-400 ml-1 transition-transform duration-200 ${
                  ztteamUserOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/** Menu Dropdown */}
            {ztteamUserOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border-0 shadow-none py-2 z-50 transition-colors animate-fadeIn">
                <div className="px-4 py-2.5 mb-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl mx-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Admin User</p>
                  <p className="text-[11px] text-slate-400">admin@ztteam.site</p>
                </div>
                <button
                  onClick={() => setZtteamUserOpen(false)}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>Hồ sơ cá nhân</span>
                </button>
                <button
                  onClick={() => {
                    ztteamOnOpenSettings();
                    setZtteamUserOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Tùy chọn quản trị</span>
                </button>
                <button
                  onClick={() => setZtteamUserOpen(false)}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-die hover:bg-die/10 transition-colors mt-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
