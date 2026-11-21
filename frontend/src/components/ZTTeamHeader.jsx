/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamHeader.jsx
 * Description: Component thanh tiêu đề điều hướng, trạng thái kết nối và các nút hành động chính
 */

import React from 'react';
import { ShieldCheck, Plus, UploadCloud, Settings, FileText, Wifi } from 'lucide-react';

export default function ZTTeamHeader({
  ztteamIsConnected,
  ztteamOnOpenAddModal,
  ztteamOnOpenBulkModal,
  ztteamOnOpenSettingsModal,
  ztteamOnOpenLogsModal
}) {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-30 px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/** Logo & Thương hiệu ZTTeam */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-indigo-500/30 shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">ZTTeam VIA Studio</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                v2.0 Safe
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Phát triển bởi <span className="text-indigo-400 font-medium">ZTTeam</span> (ztteam.site) — Quản lý & Bảo mật tài khoản
            </p>
          </div>
        </div>

        {/** Trạng thái kết nối & Các nút chức năng */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/** Huy hiệu WebSocket Online */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-xs text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${ztteamIsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{ztteamIsConnected ? 'Real-time Đã kết nối' : 'Đang kết nối lại...'}</span>
          </div>

          {/** Nút Nhật ký hoạt động */}
          <button
            onClick={ztteamOnOpenLogsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhật ký</span>
          </button>

          {/** Nút Cấu hình hệ thống */}
          <button
            onClick={ztteamOnOpenSettingsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Cài đặt</span>
          </button>

          {/** Nút Nhập hàng loạt */}
          <button
            onClick={ztteamOnOpenBulkModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Nhập hàng loạt</span>
          </button>

          {/** Nút Thêm 1 tài khoản */}
          <button
            onClick={ztteamOnOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>
    </header>
  );
}
