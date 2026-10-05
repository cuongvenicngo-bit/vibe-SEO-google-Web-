import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Trash2,
  FileText,
  Printer,
  Globe,
  ShieldCheck,
  Sparkles,
  Key,
  CreditCard,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { AnalysisReport10X } from '../types';
import { CustomerSubscriptionStatus } from '../types/subscription';
import { downloadReportTxt, printReportHtml } from '../utils/txtExporter';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  report: AnalysisReport10X | null;
  onClearData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  language?: 'vi' | 'en';
  onToggleLanguage?: () => void;
  onOpenApiModal?: () => void;
  hasCustomApiKey?: boolean;
  onOpenSubscriptionModal?: () => void;
  onOpenTrialModal?: () => void;
  onOpenAdminModal?: () => void;
  subscriptionStatus?: CustomerSubscriptionStatus | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  onToggleTheme,
  report,
  onClearData,
  onShowToast,
  language = 'vi',
  onToggleLanguage,
  onOpenApiModal,
  hasCustomApiKey = false,
  onOpenSubscriptionModal,
  onOpenTrialModal,
  onOpenAdminModal,
  subscriptionStatus,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleDownloadTxt = () => {
    if (!report) return;
    downloadReportTxt(report);
    onShowToast('Đang tải file báo cáo TXT 10X (chuẩn UTF-8 tiếng Việt)...', 'success');
  };

  const handlePrint = () => {
    if (!report) return;
    printReportHtml(report);
    onShowToast('Đang mở bản xem trước in ấn & xuất PDF...', 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-sm tracking-tight">
              360°
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  PHÂN TÍCH WEB 360
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  10X Commercial
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Đánh giá toàn diện website từ nội dung đến chuyển đổi · Thanh toán tự động SePay'
                  : 'Comprehensive 360° Website Audit · Automated SePay Payments'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Subscription Status Badge */}
            {subscriptionStatus && (
              <>
                {subscriptionStatus.has_access ? (
                  subscriptionStatus.is_paid ? (
                    <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Gói đang hoạt động, còn {subscriptionStatus.remaining_days} ngày</span>
                    </div>
                  ) : (
                    <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Dùng thử • Còn {subscriptionStatus.remaining_hours}h</span>
                    </div>
                  )
                ) : subscriptionStatus.is_expired ? (
                  <button
                    type="button"
                    onClick={onOpenSubscriptionModal}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-2xs hover:bg-rose-100 cursor-pointer"
                    title="Gói sử dụng đã hết hạn - Bấm để gia hạn"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Gia hạn gói</span>
                  </button>
                ) : null}
              </>
            )}

            {/* Trial Button (if no active subscription and not expired) */}
            {(!subscriptionStatus || (!subscriptionStatus.has_access && !subscriptionStatus.is_expired)) && onOpenTrialModal && (
              <button
                type="button"
                onClick={onOpenTrialModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer transition-all shadow-2xs"
                title="Đăng ký dùng thử 24 giờ miễn phí"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Dùng thử</span>
              </button>
            )}

            {/* Buy / Upgrade Plan Button */}
            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
                title="Xem bảng giá và thanh toán tự động qua SePay"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{subscriptionStatus?.has_access ? 'Nâng cấp' : (subscriptionStatus?.is_expired ? 'Gia hạn gói' : 'Mua gói')}</span>
              </button>
            )}

            {/* Custom Gemini API Key Button (Retained as requested) */}
            {onOpenApiModal && (
              <button
                type="button"
                onClick={onOpenApiModal}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                  hasCustomApiKey
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
                title={hasCustomApiKey ? 'Đã kết nối API riêng - Bấm để quản lý' : 'Cấu hình Gemini API Key riêng'}
              >
                <Key className="w-3.5 h-3.5" />
                <span>API</span>
                {hasCustomApiKey && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Đã kết nối API riêng" />
                )}
              </button>
            )}

            {/* Print & Export buttons when report exists */}
            {report && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="In báo cáo hoặc lưu dưới dạng PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xuất TXT</span>
                </button>
              </>
            )}

            {/* Language Toggle */}
            {onToggleLanguage && (
              <button
                type="button"
                onClick={onToggleLanguage}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Chuyển đổi ngôn ngữ hiển thị"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'vi' ? '🇻🇳' : '🌐'}</span>
              </button>
            )}

            {/* Admin Dashboard Button */}
            {onOpenAdminModal && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Quản trị SePay & Đơn hàng"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Clear Data Button */}
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại / Xóa dữ liệu đã lưu"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Clearing Data */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Đặt lại dữ liệu phân tích?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hành động này sẽ xóa toàn bộ báo cáo và thông tin nhập.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClear(false);
                  onClearData();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
