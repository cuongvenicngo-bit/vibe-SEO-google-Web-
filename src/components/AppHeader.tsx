import React, { useEffect, useRef, useState } from 'react';
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
  MoreHorizontal,
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

const toolButton =
  'p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer';
const menuItem =
  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 cursor-pointer';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the overflow menu on outside click or Escape.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

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

  const runFromMenu = (action?: () => void) => () => {
    setIsMenuOpen(false);
    action?.();
  };

  const showTrialButton =
    (!subscriptionStatus || (!subscriptionStatus.has_access && !subscriptionStatus.is_expired)) && !!onOpenTrialModal;
  const languageLabel = language === 'vi' ? 'VI' : 'EN';

  return (
    <>
      <header className="app-header sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-2.5 sm:gap-3 min-w-0" aria-label="PHÂN TÍCH WEB 360 - về đầu trang">
            <div className="bg-aurora w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 font-black text-sm tracking-tight shrink-0">
              360°
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  <span className="sm:hidden">WEB 360</span>
                  <span className="hidden sm:inline">PHÂN TÍCH WEB 360</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-200 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  10X Commercial
                </span>
              </div>
              <p className="hidden lg:block text-xs text-slate-500 dark:text-slate-400 truncate">
                {language === 'vi'
                  ? 'Đánh giá toàn diện website từ nội dung đến chuyển đổi · Thanh toán tự động SePay'
                  : 'Comprehensive 360° Website Audit · Automated SePay Payments'}
              </p>
            </div>
          </a>

          {/* Action Tools */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Subscription Status Badge */}
            {subscriptionStatus && (
              <>
                {subscriptionStatus.has_access ? (
                  subscriptionStatus.is_paid ? (
                    <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Gói đang hoạt động, còn {subscriptionStatus.remaining_days} ngày</span>
                    </div>
                  ) : (
                    <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-50 dark:bg-ocean-950/70 border border-ocean-300 dark:border-ocean-800 text-ocean-700 dark:text-ocean-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-ocean-500" />
                      <span>Dùng thử • Còn {subscriptionStatus.remaining_hours}h</span>
                    </div>
                  )
                ) : subscriptionStatus.is_expired ? (
                  <button
                    type="button"
                    onClick={onOpenSubscriptionModal}
                    className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                    title="Gói sử dụng đã hết hạn - Bấm để gia hạn"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hết hạn</span>
                  </button>
                ) : null}
              </>
            )}

            {/* Trial Button */}
            {showTrialButton && (
              <button
                type="button"
                onClick={onOpenTrialModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap text-brand-700 dark:text-brand-200 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 rounded-xl cursor-pointer transition-all"
                title="Đăng ký dùng thử 24 giờ miễn phí"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dùng thử</span>
              </button>
            )}

            {/* Buy / Upgrade Plan Button */}
            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="bg-aurora inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white rounded-xl shadow-lg shadow-brand-500/30 hover:brightness-110 hover:-translate-y-px transition-all cursor-pointer"
                title="Xem bảng giá và thanh toán tự động qua SePay"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{subscriptionStatus?.has_access ? 'Nâng cấp' : subscriptionStatus?.is_expired ? 'Gia hạn' : 'Mua gói'}</span>
              </button>
            )}

            {/* Desktop-only tools; on smaller screens they live in the "more" menu */}
            {onOpenApiModal && (
              <button
                type="button"
                onClick={onOpenApiModal}
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                  hasCustomApiKey
                    ? 'bg-ocean-50 dark:bg-ocean-950/80 text-ocean-700 dark:text-ocean-300 border-ocean-300 dark:border-ocean-700 hover:bg-ocean-100'
                    : 'bg-white/70 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                title={hasCustomApiKey ? 'Đã kết nối API riêng - Bấm để quản lý' : 'Cấu hình Gemini API Key riêng'}
              >
                <Key className="w-3.5 h-3.5" />
                <span>API</span>
                {hasCustomApiKey && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </button>
            )}

            {report && (
              <>
                <button type="button" onClick={handlePrint} className={`hidden lg:inline-flex ${toolButton}`} title="In báo cáo hoặc lưu dưới dạng PDF">
                  <Printer className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleDownloadTxt} className={`hidden lg:inline-flex ${toolButton}`} title="Xuất báo cáo TXT">
                  <FileText className="w-4 h-4" />
                </button>
              </>
            )}

            {onToggleLanguage && (
              <button
                type="button"
                onClick={onToggleLanguage}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Chuyển đổi ngôn ngữ hiển thị"
              >
                <Globe className="w-3.5 h-3.5 text-brand-500" />
                <span>{languageLabel}</span>
              </button>
            )}

            {onOpenAdminModal && (
              <button type="button" onClick={onOpenAdminModal} className={`hidden lg:inline-flex hover:text-brand-600 dark:hover:text-brand-300 ${toolButton}`} title="Quản trị SePay & Đơn hàng">
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className={`hidden lg:inline-flex hover:text-rose-600 dark:hover:text-rose-400 ${toolButton}`}
              title="Đặt lại / Xóa dữ liệu đã lưu"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Theme Toggle (always visible) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 hover:scale-105 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-brand-600" />}
            </button>

            {/* "More" menu for small and medium screens */}
            <div className="relative lg:hidden" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 cursor-pointer"
                aria-label="Thêm tùy chọn"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 w-64 p-1.5 rounded-2xl glass-panel bg-white dark:bg-slate-900 shadow-2xl animate-in z-50"
                >
                  {showTrialButton && (
                    <button type="button" role="menuitem" onClick={runFromMenu(onOpenTrialModal)} className={`sm:hidden ${menuItem}`}>
                      <Sparkles className="w-4 h-4 text-brand-500" /> Dùng thử miễn phí
                    </button>
                  )}
                  {onOpenApiModal && (
                    <button type="button" role="menuitem" onClick={runFromMenu(onOpenApiModal)} className={menuItem}>
                      <Key className="w-4 h-4 text-ocean-500" /> Gemini API Key
                      {hasCustomApiKey && <span className="ml-auto text-[10px] font-bold text-emerald-600">ĐÃ KẾT NỐI</span>}
                    </button>
                  )}
                  {report && (
                    <>
                      <button type="button" role="menuitem" onClick={runFromMenu(handlePrint)} className={menuItem}>
                        <Printer className="w-4 h-4 text-slate-500" /> In / Lưu PDF
                      </button>
                      <button type="button" role="menuitem" onClick={runFromMenu(handleDownloadTxt)} className={menuItem}>
                        <FileText className="w-4 h-4 text-slate-500" /> Xuất báo cáo TXT
                      </button>
                    </>
                  )}
                  {onToggleLanguage && (
                    <button type="button" role="menuitem" onClick={runFromMenu(onToggleLanguage)} className={menuItem}>
                      <Globe className="w-4 h-4 text-brand-500" /> Ngôn ngữ
                      <span className="ml-auto text-xs font-bold text-slate-400">{languageLabel}</span>
                    </button>
                  )}
                  {onOpenAdminModal && (
                    <button type="button" role="menuitem" onClick={runFromMenu(onOpenAdminModal)} className={menuItem}>
                      <Lock className="w-4 h-4 text-slate-500" /> Quản trị SePay & Đơn hàng
                    </button>
                  )}
                  <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={runFromMenu(() => setShowConfirmClear(true))}
                    className={`${menuItem} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
                  >
                    <Trash2 className="w-4 h-4" /> Đặt lại / Xóa dữ liệu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Clearing Data */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in">
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
