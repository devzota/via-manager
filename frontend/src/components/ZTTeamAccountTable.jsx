/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/components/ZTTeamAccountTable.jsx
 * Description: Bảng danh sách tài khoản chuẩn 100% markup, màu sắc và dropdown của MetaManager
 */

import React, { useState, useEffect, useRef } from 'react';

export default function ZTTeamAccountTable({
  ztteamAccounts,
  ztteamSelectedIds,
  ztteamOnToggleSelect,
  ztteamOnToggleSelectAll,
  ztteamOnOpenBrowser,
  ztteamOnCloseBrowser,
  ztteamOnCheckLive,
  ztteamOnGenerate2FA,
  ztteamOnAutoFill2FA = null,
  ztteamOnDeleteAccount,
  ztteamOnDeleteSelected,
  ztteamStatusFilter = '',
  ztteamOnFilterChange = null,
  ztteamOnEditAccount = null,
  ztteamOnChangeProxy = null,
  ztteamActiveBrowserUids = null
}) {
  const [ztteamOpenRowMenuId, setZtteamOpenRowMenuId] = useState(null);
  const [ztteamCopiedId, setZtteamCopiedId] = useState(null);
  const [ztteamFilterOpen, setZtteamFilterOpen] = useState(false);
  const ztteamTableRef = useRef(null);

  /** Đóng dropdown khi click ra ngoài */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ztteamTableRef.current && !ztteamTableRef.current.contains(e.target)) {
        setZtteamOpenRowMenuId(null);
        setZtteamFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ztteamAllSelected =
    ztteamAccounts.length > 0 && ztteamAccounts.every((acc) => ztteamSelectedIds.includes(acc.id));

  /** Lấy 2 ký tự viết tắt cho Avatar */
  const ztteamGetInitials = (name, uid) => {
    if (!name) return 'VI';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /** Sao chép UID|Pass */
  const ztteamHandleCopyCredentials = (account) => {
    const text = `${account.uid}|${account.password || '******'}|${account.twoFactorSecret || ''}`;
    navigator.clipboard.writeText(text);
    setZtteamCopiedId(account.id);
    setTimeout(() => setZtteamCopiedId(null), 2000);
    setZtteamOpenRowMenuId(null);
  };

  return (
    <div
      ref={ztteamTableRef}
      className="bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm flex flex-col transition-colors duration-200"
    >
      {/** Table Header Toolbar */}
      <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Tài khoản liên kết
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý và giám sát tất cả các tài khoản được liên kết
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ztteamSelectedIds.length > 0 && (
            <button
              onClick={ztteamOnDeleteSelected}
              className="px-3.5 py-2 bg-die/10 hover:bg-die/20 text-die rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Xóa ({ztteamSelectedIds.length})</span>
            </button>
          )}

          {/** Nút Lọc kèm Dropdown */}
          <div className="relative">
            <button
              onClick={() => setZtteamFilterOpen(!ztteamFilterOpen)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span>Lọc {ztteamStatusFilter ? `(${ztteamStatusFilter})` : ''}</span>
            </button>

            {ztteamFilterOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl border-0 shadow-none py-1.5 z-50 transition-colors animate-fadeIn">
                <button
                  onClick={() => {
                    if (ztteamOnFilterChange) ztteamOnFilterChange('');
                    setZtteamFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${ztteamStatusFilter === ''
                      ? 'text-primary bg-primary/10'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>Tất cả trạng thái</span>
                  {ztteamStatusFilter === '' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                <button
                  onClick={() => {
                    if (ztteamOnFilterChange) ztteamOnFilterChange('Live');
                    setZtteamFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${ztteamStatusFilter === 'Live'
                      ? 'text-live bg-live/10'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>Live (Đang hoạt động)</span>
                  {ztteamStatusFilter === 'Live' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                <button
                  onClick={() => {
                    if (ztteamOnFilterChange) ztteamOnFilterChange('Checkpoint');
                    setZtteamFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${ztteamStatusFilter === 'Checkpoint'
                      ? 'text-checkpoint bg-checkpoint/10'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>Checkpoint</span>
                  {ztteamStatusFilter === 'Checkpoint' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                <button
                  onClick={() => {
                    if (ztteamOnFilterChange) ztteamOnFilterChange('Die');
                    setZtteamFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${ztteamStatusFilter === 'Die'
                      ? 'text-die bg-die/10'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>Die (Đã chết)</span>
                  {ztteamStatusFilter === 'Die' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
              </div>
            )}
          </div>

          <button className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">view_column</span>
            <span>Cột</span>
          </button>
          <button className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Xuất</span>
          </button>
        </div>
      </div>

      {/** Data Table (Zero borders, smooth hover) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={ztteamAllSelected}
                  onChange={ztteamOnToggleSelectAll}
                  className="rounded border-0 bg-slate-200 dark:bg-slate-700 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4">UID</th>
              <th className="py-3.5 px-4">Tên tài khoản</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Proxy</th>
              <th className="py-3.5 px-4">Ngày thêm</th>
              <th className="py-3.5 px-4">Đồng bộ cuối</th>
              <th className="py-3.5 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 dark:text-slate-200">
            {ztteamAccounts.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-500">
                      manage_accounts
                    </span>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Chưa có tài khoản nào phù hợp
                    </p>
                    <p className="text-xs text-slate-400">
                      Bấm &quot;Thêm tài khoản&quot; ở góc trái để bắt đầu nhập.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              ztteamAccounts.map((account, index) => {
                const isSelected = ztteamSelectedIds.includes(account.id);
                const isRunning = Boolean(ztteamActiveBrowserUids && ztteamActiveBrowserUids.has(String(account.uid)));
                const isMenuOpen = ztteamOpenRowMenuId === account.id;
                const isBottomRow = index >= ztteamAccounts.length - 2;

                /** Phân màu Avatar theo trạng thái chuẩn thiết kế */
                let avatarColorClasses = 'bg-primary/10 text-primary dark:text-blue-400';
                if (account.status === 'Checkpoint') {
                  avatarColorClasses = 'bg-checkpoint/10 text-checkpoint';
                } else if (account.status === 'Die') {
                  avatarColorClasses = 'bg-die/10 text-die';
                }

                return (
                  <tr
                    key={account.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {/** Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => ztteamOnToggleSelect(account.id)}
                        className="rounded border-0 bg-slate-200 dark:bg-slate-700 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/** UID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {account.uid}
                    </td>

                    {/** Tên tài khoản */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${avatarColorClasses}`}
                        >
                          {ztteamGetInitials(account.name, account.uid)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-none">
                            {account.name || `VIA_${account.uid}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Nhóm: {account.category || 'Mặc định'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/** Trạng thái */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {account.status === 'Live' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-live/10 text-live">
                            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse"></span>
                            Live
                          </span>
                        )}
                        {account.status === 'Checkpoint' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-checkpoint/10 text-checkpoint">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            Checkpoint
                          </span>
                        )}
                        {account.status === 'Die' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-die/10 text-die">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            Die
                          </span>
                        )}
                        {(!account.status || account.status === 'Chưa check') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Chưa check
                          </span>
                        )}
                        {/** Huy hiệu hiển thị trình duyệt Chrome đang mở */}
                        {isRunning && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Đang mở Chrome
                          </span>
                        )}
                      </div>
                    </td>

                    {/** Proxy */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {account.proxy ? (
                        <button
                          type="button"
                          onClick={() => ztteamOnChangeProxy && ztteamOnChangeProxy(account)}
                          title="Bấm để kiểm tra hoặc đổi Proxy"
                          className="hover:underline hover:text-primary text-slate-600 dark:text-slate-300 font-mono text-xs text-left cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px] text-primary">vpn_lock</span>
                          <span>{account.proxy}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/** Ngày thêm */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {account.createdAt ? account.createdAt.split(' ')[0] : '—'}
                    </td>

                    {/** Đồng bộ cuối */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${account.status === 'Live'
                              ? 'bg-live'
                              : account.status === 'Checkpoint'
                                ? 'bg-checkpoint'
                                : 'bg-die'
                            }`}
                        ></span>
                        <span>{account.lastCheckedAt || 'Chưa kiểm tra'}</span>
                      </div>
                    </td>

                    {/** Thao tác */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/** Nút Chỉnh sửa */}
                        <button
                          onClick={() => ztteamOnEditAccount && ztteamOnEditAccount(account)}
                          title="Chỉnh sửa tài khoản"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/** Nút Đăng nhập / Mở trình duyệt */}
                        {isRunning ? (
                          <button
                            onClick={() => ztteamOnCloseBrowser(account.uid)}
                            title="Đang mở Profile. Bấm để đóng trình duyệt Chrome"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-die bg-die/10 hover:bg-die/20 transition-all cursor-pointer animate-pulse"
                          >
                            <span className="material-symbols-outlined text-[18px]">stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => ztteamOnOpenBrowser(account.id, account.uid)}
                            title="Mở trình duyệt Profile riêng"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-live hover:bg-live/10 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">login</span>
                          </button>
                        )}

                        {/** Nút Xóa */}
                        <button
                          onClick={() => ztteamOnDeleteAccount(account.id)}
                          title="Xóa tài khoản"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-die hover:bg-die/10 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>

                        {/** 3-dots Menu dropdown */}
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setZtteamOpenRowMenuId(isMenuOpen ? null : account.id)
                            }
                            title="Thao tác"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              more_vert
                            </span>
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 ${isBottomRow ? 'bottom-full mb-1' : 'top-full mt-1'
                                } w-44 bg-white dark:bg-slate-900 rounded-xl border-0 shadow-none py-1.5 z-50 transition-colors text-left animate-fadeIn`}
                            >
                              {/** Xem chi tiết & Chỉnh sửa */}
                              <button
                                onClick={() => {
                                  if (ztteamOnEditAccount) ztteamOnEditAccount(account);
                                  setZtteamOpenRowMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span>Xem chi tiết</span>
                              </button>

                              {/** Đổi Proxy */}
                              <button
                                onClick={() => {
                                  if (ztteamOnChangeProxy) ztteamOnChangeProxy(account);
                                  setZtteamOpenRowMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                                <span>Đổi Proxy</span>
                              </button>

                              {/** Kiểm tra Live */}
                              <button
                                onClick={() => {
                                  ztteamOnCheckLive(account.id, account.uid);
                                  setZtteamOpenRowMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">sync</span>
                                <span>Kiểm tra Live</span>
                              </button>

                              {/** Lấy mã 2FA (nếu có) */}
                              {account.has2FA && (
                                <button
                                  onClick={async () => {
                                    await ztteamOnGenerate2FA(account.id, account.uid);
                                    setZtteamOpenRowMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">key</span>
                                  <span>Lấy mã 2FA</span>
                                </button>
                              )}

                              {/** Tự động điền 2FA vào trình duyệt đang mở */}
                              {account.has2FA && isRunning && (
                                <button
                                  onClick={async () => {
                                    if (ztteamOnAutoFill2FA) {
                                      await ztteamOnAutoFill2FA(account.id, account.uid);
                                    }
                                    setZtteamOpenRowMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                                  <span>Tự điền 2FA vào Chrome</span>
                                </button>
                              )}

                              {/** Sao chép UID|Pass */}
                              <button
                                onClick={() => ztteamHandleCopyCredentials(account)}
                                className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  content_copy
                                </span>
                                <span>
                                  {ztteamCopiedId === account.id ? 'Đã chép!' : 'Sao chép UID|Pass'}
                                </span>
                              </button>

                              {/** Xóa tài khoản */}
                              <button
                                onClick={() => {
                                  ztteamOnDeleteAccount(account.id);
                                  setZtteamOpenRowMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-die hover:bg-die/10 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                <span>Xóa tài khoản</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
