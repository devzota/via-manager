/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamLogsModal.jsx
 * Description: Modal hiển thị lịch sử và nhật ký hoạt động của hệ thống
 */

import React from 'react';
import { X, FileText, RefreshCw, Clock } from 'lucide-react';

export default function ZTTeamLogsModal({
  ztteamIsOpen,
  ztteamOnClose,
  ztteamLogs,
  ztteamOnRefreshLogs
}) {
  if (!ztteamIsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-850 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/** Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Nhật Ký Hoạt Động Hệ Thống</h3>
              <p className="text-xs text-slate-400">Ghi lại toàn bộ hành vi mở trình duyệt, kiểm tra trạng thái và bảo mật</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={ztteamOnRefreshLogs}
              title="Làm mới"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={ztteamOnClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/** Danh sách Logs */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          {ztteamLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có nhật ký hoạt động nào được ghi nhận.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ztteamLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 text-[11px] whitespace-nowrap">
                      {log.action}
                    </span>
                    {log.account_uid && (
                      <span className="text-indigo-300 font-semibold text-[11px] whitespace-nowrap">
                        [{log.account_uid}]
                      </span>
                    )}
                    <span className="text-slate-300 break-all">{log.details}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] shrink-0">{log.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
