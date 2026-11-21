/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: src/App.jsx
 * Description: Ứng dụng chính MetaManager Dashboard kết nối dữ liệu thật và giữ nguyên 100% bản thiết kế index.html
 */

import React, { useState, useEffect, useCallback } from 'react';
import ZTTeamSideNav from './components/ZTTeamSideNav';
import ZTTeamTopNav from './components/ZTTeamTopNav';
import ZTTeamStatCards from './components/ZTTeamStatCards';
import ZTTeamAccountTable from './components/ZTTeamAccountTable';
import ZTTeamPagination from './components/ZTTeamPagination';
import ZTTeamAddModal from './components/ZTTeamAddModal';
import ZTTeamSettingsModal from './components/ZTTeamSettingsModal';
import ZTTeamEditModal from './components/ZTTeamEditModal';
import ZTTeamProxyModal from './components/ZTTeamProxyModal';
import ZTTeamConfirmModal from './components/ZTTeamConfirmModal';
import ZTTeamToast from './components/ZTTeamToast';

import {
  ztteamFetchAccounts,
  ztteamFetchStats,
  ztteamFetchCategories,
  ztteamBulkImportAccounts,
  ztteamUpdateAccount,
  ztteamDeleteAccount,
  ztteamBulkDeleteAccounts,
  ztteamClearAllAccounts,
  ztteamOpenBrowser,
  ztteamCloseBrowser,
  ztteamCheckAccountLive,
  ztteamGenerate2FACode,
  ztteamAutoFill2FA,
  ztteamFetchSettings,
  ztteamSaveSettings,
  ztteamConnectWebSocket,
  ztteamFetchActiveBrowsers
} from './services/ztteam_api';

export default function App() {
  /** Quản lý Menu tab */
  const [ztteamCurrentTab, setZtteamCurrentTab] = useState('accounts');

  /** Dữ liệu tài khoản & Thống kê */
  const [ztteamAccounts, setZtteamAccounts] = useState([]);
  const [ztteamStats, setZtteamStats] = useState({ total: 0, live: 0, die: 0, checkpoint: 0, running: 0 });
  const [ztteamCategories, setZtteamCategories] = useState([]);
  const [ztteamSettings, setZtteamSettings] = useState(null);

  /** Phân trang, Tìm kiếm & Lọc trạng thái */
  const [ztteamPage, setZtteamPage] = useState(1);
  const [ztteamPageSize, setZtteamPageSize] = useState(8);
  const [ztteamTotalPages, setZtteamTotalPages] = useState(1);
  const [ztteamTotalItems, setZtteamTotalItems] = useState(0);
  const [ztteamSearch, setZtteamSearch] = useState('');
  const [ztteamStatusFilter, setZtteamStatusFilter] = useState('');

  /** Quản lý chọn tài khoản checkbox */
  const [ztteamSelectedIds, setZtteamSelectedIds] = useState([]);

  /** Quản lý danh sách UID đang mở cửa sổ Chrome */
  const [ztteamActiveBrowserUids, setZtteamActiveBrowserUids] = useState(new Set());

  /** Quản lý Modal */
  const [ztteamAddModalOpen, setZtteamAddModalOpen] = useState(false);
  const [ztteamSettingsModalOpen, setZtteamSettingsModalOpen] = useState(false);
  const [ztteamEditModalOpen, setZtteamEditModalOpen] = useState(false);
  const [ztteamEditingAccount, setZtteamEditingAccount] = useState(null);
  const [ztteamProxyModalOpen, setZtteamProxyModalOpen] = useState(false);
  const [ztteamTargetProxyAccount, setZtteamTargetProxyAccount] = useState(null);

  /** Toast thông báo & Modal Xác nhận */
  const [ztteamToast, setZtteamToast] = useState(null);
  const [ztteamConfirmModalConfig, setZtteamConfirmModalConfig] = useState(null);

  const ztteamShowToast = (message, type = 'info') => {
    setZtteamToast({ message, type });
  };

  const ztteamOpenConfirm = (config) => {
    setZtteamConfirmModalConfig(config);
  };

  const ztteamCloseConfirm = () => {
    setZtteamConfirmModalConfig(null);
  };

  /** Tải danh sách tài khoản */
  const ztteamLoadAccounts = useCallback(async () => {
    try {
      const res = await ztteamFetchAccounts({
        page: ztteamPage,
        limit: ztteamPageSize,
        status: ztteamStatusFilter,
        search: ztteamSearch
      });
      if (res.success) {
        setZtteamAccounts(res.data.accounts);
        setZtteamTotalPages(res.data.totalPages);
        setZtteamTotalItems(res.data.total);
      }
    } catch (e) {
      /** Lỗi mạng */
    }
  }, [ztteamPage, ztteamPageSize, ztteamStatusFilter, ztteamSearch]);

  /** Tải thống kê */
  const ztteamLoadStats = async () => {
    try {
      const res = await ztteamFetchStats();
      if (res.success) {
        setZtteamStats(res.data);
      }
    } catch (e) {
      /** Bỏ qua */
    }
  };

  /** Tải danh mục */
  const ztteamLoadCategories = async () => {
    try {
      const res = await ztteamFetchCategories();
      if (res.success) {
        setZtteamCategories(res.data);
      }
    } catch (e) {
      /** Bỏ qua */
    }
  };

  /** Tải cấu hình */
  const ztteamLoadSettings = async () => {
    try {
      const res = await ztteamFetchSettings();
      if (res.success) {
        setZtteamSettings(res.data);
      }
    } catch (e) {
      /** Bỏ qua */
    }
  };

  /** Khởi tạo và lắng nghe WebSocket */
  useEffect(() => {
    ztteamLoadAccounts();
    ztteamLoadStats();
    ztteamLoadCategories();
    ztteamLoadSettings();

    /** Tải danh sách cửa sổ trình duyệt đang mở ban đầu */
    const ztteamLoadActiveBrowsers = async () => {
      try {
        const res = await ztteamFetchActiveBrowsers();
        if (res && res.success && Array.isArray(res.activeUids)) {
          setZtteamActiveBrowserUids(new Set(res.activeUids.map(String)));
        }
      } catch (e) {
        /** Bỏ qua lỗi kết nối */
      }
    };
    ztteamLoadActiveBrowsers();

    const ws = ztteamConnectWebSocket((data) => {
      if (data.type === 'STATUS') {
        setZtteamAccounts((prev) =>
          prev.map((acc) => (acc.uid === data.uid ? { ...acc, status: data.status } : acc))
        );
        ztteamLoadStats();
        if (data.message) {
          ztteamShowToast(`[${data.uid}] ${data.message}`, 'info');
        }
      } else if (data.type === 'BROWSER_STATE') {
        const targetUid = String(data.uid);
        setZtteamActiveBrowserUids((prev) => {
          const next = new Set(prev);
          if (data.isOpen) {
            next.add(targetUid);
          } else {
            next.delete(targetUid);
          }
          return next;
        });
      } else if (data.type === 'ACCOUNT_UPDATED') {
        ztteamLoadAccounts();
        ztteamLoadStats();
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [ztteamLoadAccounts]);

  /** Chọn / bỏ chọn 1 tài khoản */
  const ztteamHandleToggleSelect = (id) => {
    setZtteamSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /** Chọn / bỏ chọn tất cả */
  const ztteamHandleToggleSelectAll = () => {
    if (ztteamAccounts.every((acc) => ztteamSelectedIds.includes(acc.id))) {
      setZtteamSelectedIds([]);
    } else {
      setZtteamSelectedIds(ztteamAccounts.map((acc) => acc.id));
    }
  };

  /** Mở trình duyệt tương tác */
  const ztteamHandleOpenBrowser = async (id, uid) => {
    try {
      ztteamShowToast(`Đang mở profile Chrome cho VIA ${uid}...`, 'info');
      const res = await ztteamOpenBrowser(id, uid);
      if (res && !res.success) {
        ztteamShowToast(res.message || 'Không thể mở trình duyệt.', 'error');
      }
    } catch (err) {
      ztteamShowToast('Lỗi mở trình duyệt: ' + err.message, 'error');
    }
  };

  /** Đóng trình duyệt */
  const ztteamHandleCloseBrowser = async (uid) => {
    await ztteamCloseBrowser(uid);
    ztteamShowToast(`Đã đóng trình duyệt của VIA ${uid}`, 'info');
  };

  /** Check live tài khoản */
  const ztteamHandleCheckLive = async (id, uid) => {
    ztteamShowToast(`Đang kiểm tra trạng thái VIA ${uid}...`, 'info');
    await ztteamCheckAccountLive(id, uid);
  };

  /** Sinh mã 2FA nhanh */
  const ztteamHandleGenerate2FA = async (id, uid) => {
    const res = await ztteamGenerate2FACode(id, uid);
    if (res && res.code) {
      navigator.clipboard.writeText(res.code);
      ztteamShowToast(`Mã 2FA: ${res.code} (Đã chép vào clipboard)`, 'success');
    }
  };

  /** Tự động điền 2FA vào trình duyệt */
  const ztteamHandleAutoFill2FA = async (id, uid) => {
    try {
      ztteamShowToast('Đang tìm ô 2FA và tự động điền mã...', 'info');
      const res = await ztteamAutoFill2FA(id, uid);
      if (res && res.success) {
        ztteamShowToast(res.message || 'Đã tự động điền 2FA thành công!', 'success');
      } else {
        ztteamShowToast(res.message || 'Không tìm thấy ô 2FA trên trình duyệt.', 'error');
      }
    } catch (err) {
      ztteamShowToast('Lỗi gửi lệnh điền 2FA: ' + err.message, 'error');
    }
  };

  /** Xóa 1 tài khoản với modal xác nhận Zero-Border */
  const ztteamHandleDeleteAccount = (id) => {
    ztteamOpenConfirm({
      title: 'Xóa tài khoản VIA',
      message: 'Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Dữ liệu đã xóa sẽ không thể phục hồi.',
      type: 'danger',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        ztteamCloseConfirm();
        await ztteamDeleteAccount(id);
        setZtteamSelectedIds((prev) => prev.filter((i) => i !== id));
        ztteamLoadAccounts();
        ztteamLoadStats();
        ztteamShowToast('Đã xóa tài khoản thành công', 'success');
      }
    });
  };

  /** Xóa các mục đã chọn với modal xác nhận Zero-Border */
  const ztteamHandleDeleteSelected = () => {
    if (ztteamSelectedIds.length === 0) return;
    ztteamOpenConfirm({
      title: 'Xóa hàng loạt tài khoản',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${ztteamSelectedIds.length} tài khoản đang được chọn?`,
      type: 'danger',
      confirmText: `Xóa ${ztteamSelectedIds.length} tài khoản`,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        ztteamCloseConfirm();
        await ztteamBulkDeleteAccounts(ztteamSelectedIds);
        setZtteamSelectedIds([]);
        ztteamLoadAccounts();
        ztteamLoadStats();
        ztteamShowToast(`Đã xóa ${ztteamSelectedIds.length} tài khoản đã chọn`, 'success');
      }
    });
  };

  /** Nhập hàng loạt */
  const ztteamHandleBulkImport = async (rawText, category) => {
    try {
      const res = await ztteamBulkImportAccounts(rawText, category);
      if (res && res.success) {
        /** Tự động đặt lại bộ lọc để tài khoản mới luôn hiển thị ngay lập tức */
        setZtteamSearch('');
        setZtteamStatusFilter('');
        setZtteamPage(1);

        ztteamLoadAccounts();
        ztteamLoadStats();

        const data = res.data || {};
        if (data.insertedCount > 0 && data.updatedCount > 0) {
          ztteamShowToast(`Đã thêm mới ${data.insertedCount} tài khoản và cập nhật ${data.updatedCount} tài khoản trùng UID!`, 'success');
        } else if (data.insertedCount > 0) {
          ztteamShowToast(`Đã thêm mới thành công ${data.insertedCount} tài khoản!`, 'success');
        } else if (data.updatedCount > 0) {
          ztteamShowToast(`Tài khoản đã tồn tại trên hệ thống — Đã cập nhật lại thông tin thành công!`, 'info');
        } else {
          ztteamShowToast(`Đã xử lý xong ${data.successCount || 0} tài khoản.`, 'success');
        }
        return res;
      } else {
        ztteamShowToast(res?.message || 'Không thể thêm tài khoản. Vui lòng kiểm tra lại định dạng.', 'danger');
        return res;
      }
    } catch (err) {
      ztteamShowToast(`Lỗi kết nối máy chủ: ${err.message}`, 'danger');
      return { success: false, message: err.message };
    }
  };

  /** Lưu cấu hình */
  const ztteamHandleSaveSettings = async (settings) => {
    const res = await ztteamSaveSettings(settings);
    if (res.success) {
      ztteamLoadSettings();
      ztteamShowToast('Đã lưu cấu hình thành công!', 'success');
    }
  };

  /** Thêm danh mục */
  const ztteamHandleAddCategory = async (catName) => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName })
    });
    ztteamLoadCategories();
    ztteamShowToast(`Đã thêm danh mục: ${catName}`, 'success');
  };

  /** Mở modal chỉnh sửa tài khoản */
  const ztteamHandleOpenEdit = (account) => {
    setZtteamEditingAccount(account);
    setZtteamEditModalOpen(true);
  };

  /** Lưu thông tin chỉnh sửa tài khoản */
  const ztteamHandleSaveAccount = async (id, data) => {
    const res = await ztteamUpdateAccount(id, data);
    if (res && res.success) {
      ztteamLoadAccounts();
      ztteamLoadStats();
      ztteamShowToast('Đã lưu thông tin tài khoản thành công', 'success');
    }
  };

  /** Mở modal đổi proxy cho 1 tài khoản */
  const ztteamHandleOpenProxyForAccount = (account) => {
    setZtteamTargetProxyAccount(account);
    setZtteamProxyModalOpen(true);
  };

  /** Mở modal cài đặt Proxy từ SideNav */
  const ztteamHandleOpenProxySettings = () => {
    setZtteamTargetProxyAccount(null);
    setZtteamProxyModalOpen(true);
  };

  /** Cập nhật proxy cho 1 tài khoản */
  const ztteamHandleUpdateAccountProxy = async (id, proxy) => {
    const res = await ztteamUpdateAccount(id, { proxy });
    if (res && res.success) {
      ztteamLoadAccounts();
      ztteamShowToast('Đã cập nhật Proxy cho tài khoản', 'success');
    }
  };

  /** Lưu proxy mặc định */
  const ztteamHandleSaveDefaultProxy = async (proxy) => {
    await ztteamSaveSettings({
      ...(ztteamSettings || {}),
      defaultProxy: proxy
    });
    ztteamLoadSettings();
    ztteamShowToast('Đã lưu cấu hình proxy mặc định', 'success');
  };

  /** Xóa toàn bộ tài khoản với cảnh báo mức cao nhất */
  const ztteamHandleClearAllAccounts = () => {
    ztteamOpenConfirm({
      title: 'Xóa toàn bộ cơ sở dữ liệu',
      message: 'CẢNH BÁO NGUY CƠ CAO: Bạn có chắc chắn muốn dọn sạch toàn bộ tất cả tài khoản VIA trong hệ thống? Thao tác này sẽ xóa sạch dữ liệu.',
      type: 'danger',
      confirmText: 'Xác nhận xóa tất cả',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        ztteamCloseConfirm();
        await ztteamClearAllAccounts();
        setZtteamSelectedIds([]);
        ztteamLoadAccounts();
        ztteamLoadStats();
        ztteamShowToast('Đã dọn sạch toàn bộ tài khoản trong database', 'info');
      }
    });
  };

  return (
    <div className="w-full min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
      {/** SideNavBar chuẩn 100% MetaManager */}
      <ZTTeamSideNav
        ztteamTotalAccounts={ztteamStats.total || 0}
        ztteamCurrentTab={ztteamCurrentTab}
        ztteamOnSelectTab={(tab) => {
          setZtteamCurrentTab(tab);
          if (tab === 'settings') setZtteamSettingsModalOpen(true);
          if (tab === 'proxy') ztteamHandleOpenProxySettings();
        }}
        ztteamOnOpenAddModal={() => setZtteamAddModalOpen(true)}
      />

      {/** Main Content Wrapper */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/** TopNavBar chuẩn 100% MetaManager */}
        <ZTTeamTopNav
          ztteamTotalAccounts={ztteamStats.total || 0}
          ztteamSearch={ztteamSearch}
          ztteamOnSearchChange={(val) => {
            setZtteamSearch(val);
            setZtteamPage(1);
          }}
          ztteamOnOpenSettings={() => setZtteamSettingsModalOpen(true)}
        />

        {/** Main Canvas */}
        <main className="pt-6 px-8 pb-12 max-w-7xl mx-auto w-full flex-1">
          {/** 4 Stat Cards chuẩn 100% kèm biểu đồ SVG Sparkline & Gradients */}
          <ZTTeamStatCards
            ztteamStats={ztteamStats}
            ztteamActiveFilter={ztteamStatusFilter}
            ztteamOnSelectFilter={(status) => {
              setZtteamStatusFilter(status);
              setZtteamPage(1);
            }}
          />

          {/** Bảng danh sách tài khoản & Toolbar */}
          <ZTTeamAccountTable
            ztteamAccounts={ztteamAccounts}
            ztteamSelectedIds={ztteamSelectedIds}
            ztteamOnToggleSelect={ztteamHandleToggleSelect}
            ztteamOnToggleSelectAll={ztteamHandleToggleSelectAll}
            ztteamOnOpenBrowser={ztteamHandleOpenBrowser}
            ztteamOnCloseBrowser={ztteamHandleCloseBrowser}
            ztteamOnCheckLive={ztteamHandleCheckLive}
            ztteamOnGenerate2FA={ztteamHandleGenerate2FA}
            ztteamOnAutoFill2FA={ztteamHandleAutoFill2FA}
            ztteamOnDeleteAccount={ztteamHandleDeleteAccount}
            ztteamOnDeleteSelected={ztteamHandleDeleteSelected}
            ztteamStatusFilter={ztteamStatusFilter}
            ztteamOnFilterChange={(status) => {
              setZtteamStatusFilter(status);
              setZtteamPage(1);
            }}
            ztteamOnEditAccount={ztteamHandleOpenEdit}
            ztteamOnChangeProxy={ztteamHandleOpenProxyForAccount}
            ztteamActiveBrowserUids={ztteamActiveBrowserUids}
          />

          {/** Thanh phân trang chuẩn 100% */}
          <ZTTeamPagination
            ztteamCurrentPage={ztteamPage}
            ztteamTotalPages={ztteamTotalPages}
            ztteamTotalItems={ztteamTotalItems}
            ztteamPageSize={ztteamPageSize}
            ztteamOnPageChange={(newPage) => setZtteamPage(newPage)}
            ztteamOnPageSizeChange={(newSize) => {
              setZtteamPageSize(newSize);
              setZtteamPage(1);
            }}
          />
        </main>
      </div>

      {/** Modal Thêm tài khoản hàng loạt chuẩn 100% */}
      <ZTTeamAddModal
        ztteamIsOpen={ztteamAddModalOpen}
        ztteamOnClose={() => setZtteamAddModalOpen(false)}
        ztteamOnBulkImport={ztteamHandleBulkImport}
      />

      {/** Modal Cấu hình hệ thống */}
      <ZTTeamSettingsModal
        ztteamIsOpen={ztteamSettingsModalOpen}
        ztteamOnClose={() => setZtteamSettingsModalOpen(false)}
        ztteamSettings={ztteamSettings}
        ztteamCategories={ztteamCategories}
        ztteamOnSaveSettings={ztteamHandleSaveSettings}
        ztteamOnAddCategory={ztteamHandleAddCategory}
        ztteamOnClearAllAccounts={ztteamHandleClearAllAccounts}
      />

      {/** Modal Chỉnh sửa tài khoản */}
      <ZTTeamEditModal
        ztteamIsOpen={ztteamEditModalOpen}
        ztteamOnClose={() => {
          setZtteamEditModalOpen(false);
          setZtteamEditingAccount(null);
        }}
        ztteamAccount={ztteamEditingAccount}
        ztteamCategories={ztteamCategories}
        ztteamOnSave={ztteamHandleSaveAccount}
      />

      {/** Modal Quản lý & Cài đặt Proxy */}
      <ZTTeamProxyModal
        ztteamIsOpen={ztteamProxyModalOpen}
        ztteamOnClose={() => {
          setZtteamProxyModalOpen(false);
          setZtteamTargetProxyAccount(null);
        }}
        ztteamTargetAccount={ztteamTargetProxyAccount}
        ztteamDefaultProxy={ztteamSettings?.defaultProxy || ''}
        ztteamOnSaveDefaultProxy={ztteamHandleSaveDefaultProxy}
        ztteamOnUpdateAccountProxy={ztteamHandleUpdateAccountProxy}
      />

      {/** Modal Xác nhận tái sử dụng chuẩn Zero-Border */}
      {ztteamConfirmModalConfig && (
        <ZTTeamConfirmModal
          ztteamIsOpen={Boolean(ztteamConfirmModalConfig)}
          ztteamTitle={ztteamConfirmModalConfig.title}
          ztteamMessage={ztteamConfirmModalConfig.message}
          ztteamType={ztteamConfirmModalConfig.type}
          ztteamConfirmText={ztteamConfirmModalConfig.confirmText}
          ztteamCancelText={ztteamConfirmModalConfig.cancelText}
          ztteamSecondaryText={ztteamConfirmModalConfig.secondaryText}
          ztteamOnConfirm={ztteamConfirmModalConfig.onConfirm}
          ztteamOnCancel={ztteamCloseConfirm}
          ztteamOnSecondary={ztteamConfirmModalConfig.onSecondary}
        />
      )}

      {/** Toast thông báo tái sử dụng chuẩn Zero-Border */}
      <ZTTeamToast
        ztteamToast={ztteamToast}
        ztteamOnClose={() => setZtteamToast(null)}
      />
    </div>
  );
}
