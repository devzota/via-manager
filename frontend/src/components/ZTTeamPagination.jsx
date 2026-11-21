/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamPagination.jsx
 * Description: Thanh phân trang chuẩn 100% markup và phong cách của MetaManager
 */

import React, { useState, useEffect, useRef } from 'react';

export default function ZTTeamPagination({
  ztteamCurrentPage,
  ztteamTotalPages,
  ztteamTotalItems,
  ztteamPageSize,
  ztteamOnPageChange,
  ztteamOnPageSizeChange
}) {
  const [ztteamSizeDropdownOpen, setZtteamSizeDropdownOpen] = useState(false);
  const ztteamSizeRef = useRef(null);

  /** Đóng dropdown khi click ra ngoài */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ztteamSizeRef.current && !ztteamSizeRef.current.contains(e.target)) {
        setZtteamSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startItem = ztteamTotalItems === 0 ? 0 : (ztteamCurrentPage - 1) * ztteamPageSize + 1;
  const endItem = Math.min(ztteamCurrentPage * ztteamPageSize, ztteamTotalItems);

  const ztteamPageSizes = [8, 20, 50, 100];

  return (
    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 rounded-b-2xl">
      <div className="flex items-center gap-3">
        <span>
          Hiển thị {startItem} - {endItem} của {ztteamTotalItems.toLocaleString()} tài khoản
        </span>
        <span className="text-slate-300 dark:text-slate-600">•</span>

        {/** Custom Selectbox số bản ghi */}
        <div className="relative" ref={ztteamSizeRef}>
          <button
            onClick={() => setZtteamSizeDropdownOpen(!ztteamSizeDropdownOpen)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <span>{ztteamPageSize} / trang</span>
            <span
              className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${
                ztteamSizeDropdownOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {ztteamSizeDropdownOpen && (
            <div className="absolute bottom-full mb-1.5 left-0 w-32 bg-white dark:bg-slate-900 rounded-xl border-0 shadow-none py-1 z-50 transition-colors animate-fadeIn">
              {ztteamPageSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    ztteamOnPageSizeChange(size);
                    setZtteamSizeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    ztteamPageSize === size
                      ? 'text-primary bg-primary/10'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {size} / trang
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/** Các nút chuyển trang */}
      <div className="flex items-center gap-1.5">
        {/** Trang đầu */}
        <button
          disabled={ztteamCurrentPage <= 1}
          onClick={() => ztteamOnPageChange(1)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">first_page</span>
        </button>

        {/** Trang trước */}
        <button
          disabled={ztteamCurrentPage <= 1}
          onClick={() => ztteamOnPageChange(ztteamCurrentPage - 1)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/** Số trang */}
        {Array.from({ length: Math.min(5, ztteamTotalPages || 1) }, (_, i) => {
          let pageNum = i + 1;
          if (ztteamTotalPages > 5) {
            if (ztteamCurrentPage > 3) {
              pageNum = ztteamCurrentPage - 3 + i;
            }
            if (pageNum > ztteamTotalPages) {
              pageNum = ztteamTotalPages - (4 - i);
            }
          }
          if (pageNum < 1) pageNum = 1;

          const isActive = pageNum === ztteamCurrentPage;

          return (
            <button
              key={pageNum}
              onClick={() => ztteamOnPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/** Trang tiếp */}
        <button
          disabled={ztteamCurrentPage >= ztteamTotalPages}
          onClick={() => ztteamOnPageChange(ztteamCurrentPage + 1)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>

        {/** Trang cuối */}
        <button
          disabled={ztteamCurrentPage >= ztteamTotalPages}
          onClick={() => ztteamOnPageChange(ztteamTotalPages)}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );
}
