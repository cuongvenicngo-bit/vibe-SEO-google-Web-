import React from 'react';
import { X, ExternalLink, ShieldAlert, Sparkles, BookOpen, CheckCircle, Info } from 'lucide-react';
import { CellEvaluation } from '../types';
import { STATUS_META } from '../constants/criteria';
import { CopyButton } from './CopyButton';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  criterionName: string;
  criterionId: number;
  criterionGroup: string;
  siteName: string;
  siteUrl: string;
  evaluation: CellEvaluation | null;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  criterionName,
  criterionId,
  criterionGroup,
  siteName,
  siteUrl,
  evaluation,
}) => {
  if (!isOpen || !evaluation) return null;

  const statusInfo = STATUS_META[evaluation.status] || {
    label: evaluation.status,
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  const copyableContent = `[Tiêu chí ${criterionId}] ${criterionName} (${criterionGroup})
Website: ${siteName} (${siteUrl})
Trạng thái: ${statusInfo.label}
- Bằng chứng quan sát được: ${evaluation.evidence}
- Trang nguồn: ${evaluation.sourceUrl}
- Lý do đánh giá: ${evaluation.reason}
- Giới hạn của nhận định: ${evaluation.limitation}
- Đề xuất cho website: ${evaluation.userRecommendation}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/60 dark:bg-slate-850/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Tiêu chí {criterionId} · {criterionGroup}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {criterionName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Website đối chiếu:</span>
              <strong className="text-slate-700 dark:text-slate-200">{siteName}</strong>
              <span className="text-slate-400">({siteUrl})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Bằng chứng quan sát được */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Bằng chứng quan sát được (Trực tiếp)
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {evaluation.evidence || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}
            </p>
            {evaluation.sourceUrl && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-750 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Trang nguồn:</span>
                <a
                  href={evaluation.sourceUrl.startsWith('http') ? evaluation.sourceUrl : `https://${evaluation.sourceUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 truncate max-w-xs"
                >
                  {evaluation.sourceUrl}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Lý do đánh giá */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              <Info className="w-4 h-4 text-indigo-500" />
              Lý do đánh giá & Phân tích
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
              {evaluation.reason || 'Dựa trên cấu trúc trang và nội dung thực tế kiểm tra được.'}
            </p>
          </div>

          {/* Giới hạn của nhận định */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Giới hạn của nhận định (Nguyên tắc minh bạch)
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed pl-6">
              {evaluation.limitation || 'Nhận định dựa trên mẫu các trang công khai được quét tại thời điểm phân tích. Không kết luận tính năng hoàn toàn không tồn tại nếu nằm ở khu vực nội bộ/sau đăng nhập.'}
            </p>
          </div>

          {/* Đề xuất cho website của người dùng */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-850">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Đề xuất hành động cho Website của bạn
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {evaluation.userRecommendation || 'Tham khảo cách đối thủ triển khai và tối ưu cho phù hợp với ngành hàng.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
          <CopyButton textToCopy={copyableContent} label="Sao chép chi tiết tiêu chí" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
