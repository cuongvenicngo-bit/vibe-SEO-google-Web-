import React, { useState } from 'react';
import { AnalysisReport10X } from '../../types';
import { downloadReportTxt, generateReportTxt, printReportHtml } from '../../utils/txtExporter';
import { copyToClipboard } from '../../utils/clipboard';
import { FileText, Copy, RefreshCw, Trash2, ExternalLink, ShieldCheck, Check, Info, Printer, Activity, Compass, BookOpen } from 'lucide-react';

interface Step8ExportAndActionsProps {
  report: AnalysisReport10X;
  onRegenerateAll: () => void;
  onClearData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Step8ExportAndActions: React.FC<Step8ExportAndActionsProps> = ({
  report,
  onRegenerateAll,
  onClearData,
  onShowToast,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleCopyAll = async () => {
    const text = generateReportTxt(report);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedAll(true);
      onShowToast('Đã sao chép toàn bộ báo cáo phân tích vào clipboard!', 'success');
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleDownload = () => {
    downloadReportTxt(report);
    onShowToast('Đã tải xuống file báo cáo TXT 10X (UTF-8 tiếng Việt)', 'success');
  };

  const handlePrint = () => {
    printReportHtml(report);
    onShowToast('Đang mở bản in báo cáo & xuất PDF cho khách hàng...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50/90 via-white to-brand-50/90 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Sao chép & Xuất báo cáo chuyên nghiệp (10X Agency Edition)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Xuất file TXT chuẩn tiếng Việt UTF-8 hoặc in báo cáo / xuất PDF sẵn sàng trình bày trước đối tác & khách hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* In / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>In báo cáo / Lưu PDF</span>
            </button>

            {/* Tải báo cáo TXT */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Tải file TXT (UTF-8)</span>
            </button>

            {/* Sao chép toàn bộ báo cáo */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-xs"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedAll ? 'Đã sao chép!' : 'Sao chép toàn bộ'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Actions: Regenerate & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRegenerateAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tạo lại toàn bộ phân tích</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa dữ liệu tạm</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Dữ liệu tự động đồng bộ và lưu trữ an toàn trong trình duyệt
          </span>
        </div>
      </div>

      {/* Verification Events Table (Sự kiện đo lường chuyển đổi) */}
      {report.verificationEvents && report.verificationEvents.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Các sự kiện theo dõi chuyển đổi cần thiết lập (Tracking Events)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-750 text-slate-500">
                  <th className="py-2 pr-3">Tên sự kiện</th>
                  <th className="py-2 px-3">Ý nghĩa quản trị</th>
                  <th className="py-2 px-3">Công cụ cài đặt</th>
                  <th className="py-2 pl-3">Bộ phận phụ trách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {report.verificationEvents.map((evt, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pr-3 font-bold text-slate-800 dark:text-slate-200">
                      {evt.event}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {evt.meaning}
                    </td>
                    <td className="py-2.5 px-3 text-brand-600 dark:text-brand-400 font-mono text-[11px]">
                      {evt.verificationMethod}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400">
                      {evt.owner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audited URLs Table */}
      {report.auditedUrls && report.auditedUrls.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Danh mục các trang đã quét mẫu & Phương pháp đọc (Audited Pages)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-750 text-slate-500">
                  <th className="py-2 pr-3">Website</th>
                  <th className="py-2 px-3">Loại trang</th>
                  <th className="py-2 px-3">Địa chỉ URL</th>
                  <th className="py-2 pl-3">Phương pháp đọc dữ liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {report.auditedUrls.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pr-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.website}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {item.pageType}
                    </td>
                    <td className="py-2.5 px-3">
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px] truncate max-w-xs block"
                      >
                        {item.url}
                      </a>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.readingMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources & Compliance Verification Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Danh sách nguồn đối chiếu & Giới hạn dữ liệu (Grounding Sources)
          </h4>
          <span className="text-xs text-slate-400">
            {report.verifiedSourcesList?.length || 1} nguồn công khai
          </span>
        </div>

        {/* Note on insufficient data */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <strong>Cam kết không tự tạo số liệu:</strong> Mọi đánh giá được kiểm chứng trên các trang công khai. Các chỉ số về lượng tìm kiếm được chú thích <em>"Cần nhập dữ liệu từ công cụ từ khóa"</em> và ô giá được ghi <em>"Cần điền giá thật"</em>.
            </p>
            <p className="text-[11px] text-slate-500">
              Đối với những tính năng không hiển thị trong các trang được quét mẫu, hệ thống hiển thị: <em>"Chưa tìm thấy bằng chứng trong các trang được kiểm tra."</em>
            </p>
          </div>
        </div>

        {/* Source links list */}
        <div className="space-y-1.5 text-xs">
          {(report.verifiedSourcesList || []).map((sourceUrl: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 truncate max-w-xl">
                <span className="w-5 text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                <span className="truncate text-slate-700 dark:text-slate-300">{sourceUrl}</span>
              </div>
              <a
                href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0 text-[11px] ml-2"
              >
                Mở liên kết
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Xác nhận xóa dữ liệu tạm?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Hành động này sẽ làm mới báo cáo hiện tại và giải phóng bộ nhớ tạm trong trình duyệt của bạn.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
