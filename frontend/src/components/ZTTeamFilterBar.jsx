/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamFilterBar.jsx
 * Description: Component thanh tìm kiếm, bộ lọc danh mục và các thao tác tác vụ hàng loạt
 */

import React from 'react';
import { Search, Filter, Trash2, RefreshCw } from 'lucide-react';

export default function ZTTeamFilterBar({
  ztteamSearch,
  ztteamOnSearchChange,
  ztteamCategory,
  ztteamOnCategoryChange,
  ztteamCategories,
  ztteamStatus,
  ztteamOnStatusChange,
  ztteamSelectedCount,
  ztteamOnDeleteSelected,
  ztteamOnCheckSelectedLive
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
      {/** Nhóm tìm kiếm và bộ lọc */}
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/** Ô tìm kiếm */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={ztteamSearch}
            onChange={(e) => ztteamOnSearchChange(e.target.value)}
            placeholder="Tìm theo UID, tên, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/** Chọn Danh mục */}
        <div className="relative min-w-[150px]">
          <select
            value={ztteamCategory}
            onChange={(e) => ztteamOnCategoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            <option value="">Tất cả danh mục</option>
            {ztteamCategories.map((ztteamCat) => (
              <option key={ztteamCat} value={ztteamCat}>
                {ztteamCat}
              </option>
            ))}
          </select>
        </div>

        {/** Chọn Trạng thái */}
        <div className="relative min-w-[140px]">
          <select
            value={ztteamStatus}
            onChange={(e) => ztteamOnStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Live">Live</option>
            <option value="Die">Die</option>
            <option value="Checkpoint">Checkpoint</option>
            <option value="Đang chạy">Đang chạy</option>
            <option value="Chưa check">Chưa check</option>
          </select>
        </div>
      </div>

      {/** Thao tác hàng loạt khi có mục được tick chọn */}
      {ztteamSelectedCount > 0 && (
        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700">
          <span className="text-xs text-indigo-300 font-medium whitespace-nowrap">
            Đã chọn {ztteamSelectedCount} mục
          </span>

          <button
            onClick={ztteamOnCheckSelectedLive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Live</span>
          </button>

          <button
            onClick={ztteamOnDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa đã chọn</span>
          </button>
        </div>
      )}
    </div>
  );
}
