import React, { useState } from 'react';
import { WebsiteInputForm } from '../../types';
import { CustomerSubscriptionStatus } from '../../types/subscription';
import { Globe, Plus, Trash2, Sparkles, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp, MapPin, Tag, Briefcase, Lock, CreditCard } from 'lucide-react';

interface Step1WebsiteInputProps {
  inputData: WebsiteInputForm;
  onChangeInput: (data: WebsiteInputForm) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  activeProgressStage: number; // 0 to 6
  subscriptionStatus?: CustomerSubscriptionStatus | null;
  onOpenSubscriptionModal?: () => void;
  onOpenTrialModal?: () => void;
}

const PROGRESS_STAGES = [
  'Đang đọc website',
  'Đang xác định ngành nghề',
  'Đang tìm từ khóa thương mại',
  'Đang tìm đối thủ',
  'Đang đọc các trang quan trọng',
  'Đang xây dựng báo cáo',
];

export const Step1WebsiteInput: React.FC<Step1WebsiteInputProps> = ({
  inputData,
  onChangeInput,
  onSubmit,
  isLoading,
  errorMessage,
  onRetry,
  activeProgressStage,
  subscriptionStatus,
  onOpenSubscriptionModal,
  onOpenTrialModal,
}) => {
  const [competitorInput, setCompetitorInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    let clean = (url || '').trim().replace(/^["']+|["']+$/g, '');
    if (!clean) {
      setUrlError('Vui lòng nhập địa chỉ website.');
      return false;
    }
    try {
      if (!/^https?:\/\//i.test(clean)) {
        clean = `https://${clean}`;
      }
      const parsed = new URL(clean);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.endsWith('.local')
      ) {
        setUrlError('Chỉ chấp nhận địa chỉ website HTTP hoặc HTTPS công khai (không chấp nhận localhost/mạng nội bộ).');
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Địa chỉ website không hợp lệ. Ví dụ: https://candientu.net hoặc candientu.net');
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check subscription access
    if (subscriptionStatus && !subscriptionStatus.has_access) {
      if (onOpenSubscriptionModal) {
        onOpenSubscriptionModal();
      }
      return;
    }

    let clean = (inputData.url || '').trim().replace(/^["']+|["']+$/g, '');
    if (!validateUrl(clean)) {
      return;
    }
    onChangeInput({ ...inputData, url: clean });
    onSubmit();
  };

  const handleAddManualCompetitor = () => {
    if (!competitorInput.trim()) return;
    const comps = inputData.manualCompetitors || [];
    if (comps.length >= 5) {
      alert('Tối đa 5 đối thủ bổ sung.');
      return;
    }
    onChangeInput({
      ...inputData,
      manualCompetitors: [...comps, competitorInput.trim()],
    });
    setCompetitorInput('');
  };

  const handleRemoveCompetitor = (index: number) => {
    const comps = inputData.manualCompetitors || [];
    onChangeInput({
      ...inputData,
      manualCompetitors: comps.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Demo Presets for Instant 10X Test */}
      <div className="p-3.5 bg-gradient-to-r from-brand-50/80 via-brand-50/60 to-brand-50/60 dark:from-brand-950/50 dark:via-brand-950/30 dark:to-brand-950/40 rounded-2xl border border-brand-100 dark:border-brand-900/60 text-xs shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              ★
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Dùng thử nhanh bản mẫu 10X:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChangeInput({
                  url: 'https://candientu.net',
                  productService: 'Cung cấp, sửa chữa, bảo dưỡng cân điện tử các loại (cân bàn, cân sàn, cân xe tải, cân mini)',
                  location: 'Việt Nam (Toàn quốc)',
                  mainKeyword: 'cân điện tử',
                  manualCompetitors: [
                    'https://candientuhoanggia.com/',
                    'https://tbeshop.vn/',
                    'https://canvananphat.com/',
                  ],
                });
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 border border-brand-200 dark:border-brand-800 rounded-lg font-semibold text-brand-700 dark:text-brand-300 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>⚖️ Cân Điện Tử Gia Phát (Benchmark 10X Thực Tế)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeInput({
                  url: 'https://base.vn',
                  productService: 'Nền tảng quản trị công việc và doanh nghiệp B2B SaaS',
                  location: 'Việt Nam & Đông Nam Á',
                  mainKeyword: 'phần mềm quản trị doanh nghiệp',
                });
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs transition-colors"
            >
              <span>🚀 B2B SaaS Tech</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeInput({
                  url: 'https://yame.vn',
                  productService: 'Thời trang bán lẻ & phụ kiện nam nữ',
                  location: 'Việt Nam',
                  mainKeyword: 'thời trang nam',
                });
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs transition-colors"
            >
              <span>🛍️ E-Commerce Thời Trang</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main URL input */}
        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Địa chỉ website cần phân tích <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              disabled={isLoading}
              placeholder="https://example.com hoặc domain.vn"
              value={inputData.url}
              onChange={(e) => {
                onChangeInput({ ...inputData, url: e.target.value });
                if (urlError) validateUrl(e.target.value);
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all outline-hidden ${
                urlError
                  ? 'border-rose-400 bg-rose-50/30 text-rose-900 dark:text-rose-200 dark:border-rose-800'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            />
          </div>
          {urlError ? (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {urlError}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Chỉ chấp nhận URL công khai. Hệ thống sẽ quét thông tin và tìm kiếm 5 đối thủ tương xứng.
            </p>
          )}
        </div>

        {/* Optional quick hints */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Sản phẩm / dịch vụ chính (tùy chọn)
            </label>
            <input
              type="text"
              disabled={isLoading}
              placeholder="Ví dụ: Thiết kế nội thất căn hộ..."
              value={inputData.productService || ''}
              onChange={(e) => onChangeInput({ ...inputData, productService: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Khu vực kinh doanh (tùy chọn)
            </label>
            <input
              type="text"
              disabled={isLoading}
              placeholder="Ví dụ: TP.HCM, Hà Nội, Toàn quốc..."
              value={inputData.location || ''}
              onChange={(e) => onChangeInput({ ...inputData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Từ khóa chính mong muốn (tùy chọn)
            </label>
            <input
              type="text"
              disabled={isLoading}
              placeholder="Ví dụ: thi công nội thất trọn gói..."
              value={inputData.mainKeyword || ''}
              onChange={(e) => onChangeInput({ ...inputData, mainKeyword: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden"
            />
          </div>
        </div>

        {/* Collapsible Advanced: Manual Competitors & Pasted Content */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors cursor-pointer"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Tùy chọn nâng cao: Thêm URL đối thủ thủ công & Dán nội dung trang</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-4">
              {/* Manual Competitors */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL đối thủ muốn chỉ định (Tối đa 5 đối thủ):
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    disabled={isLoading}
                    placeholder="https://doithu.vn"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualCompetitor();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:border-brand-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualCompetitor}
                    className="px-3 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm
                  </button>
                </div>

                {inputData.manualCompetitors && inputData.manualCompetitors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {inputData.manualCompetitors.map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate max-w-[180px]">{comp}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompetitor(idx)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pasted Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Dán nội dung hoặc ghi chú trang (nếu trang web có nội dung bảo vệ hoặc đang phát triển):
                </label>
                <textarea
                  rows={3}
                  disabled={isLoading}
                  placeholder="Dán tiêu đề, nội dung trang chủ, danh sách sản phẩm hoặc thông điệp của bạn tại đây..."
                  value={inputData.pastedContent || ''}
                  onChange={(e) => onChangeInput({ ...inputData, pastedContent: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:border-brand-500 outline-hidden resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Subscription Lock Notice if no access */}
        {(!subscriptionStatus || !subscriptionStatus.has_access) && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {subscriptionStatus?.is_expired
                  ? 'Gói sử dụng đã hết hạn, vui lòng gia hạn để tiếp tục.'
                  : 'Bạn cần mua gói để sử dụng công cụ này.'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Mở khóa không giới hạn phân tích website 10X, kịch bản chốt đơn và bản đồ đối thủ radar D3 chuyên sâu.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onOpenSubscriptionModal && (
                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{subscriptionStatus?.is_expired ? 'Gia hạn gói' : 'Mua gói'}</span>
                </button>
              )}
              {(!subscriptionStatus || !subscriptionStatus.is_expired) && onOpenTrialModal && (
                <button
                  type="button"
                  onClick={onOpenTrialModal}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Dùng thử miễn phí 24h</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          {(!subscriptionStatus || !subscriptionStatus.has_access) ? (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-accent-600 hover:bg-accent-700 shadow-md inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>
                {subscriptionStatus?.is_expired
                  ? 'Gia hạn gói'
                  : 'Bạn cần mua gói để sử dụng công cụ này'}
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !inputData.url.trim()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-accent-600 hover:bg-accent-700 active:bg-accent-800 shadow-md shadow-accent-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang xử lý dữ liệu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Phân tích website</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Loading Progress Stepper */}
      {isLoading && (
        <div className="p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 mb-3 text-brand-950 dark:text-brand-200 font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
            <span>AI đang xử lý dữ liệu...</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PROGRESS_STAGES.map((stage, idx) => {
              const isPast = idx < activeProgressStage;
              const isCurrent = idx === activeProgressStage;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isPast
                      ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60'
                      : isCurrent
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-brand-300 dark:border-brand-700 font-semibold'
                      : 'bg-slate-100/60 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error State */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Phân tích không thành công</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};
