import { Info } from 'lucide-react';

/** Tells the reader that a step shows generic guidance, not results measured on their website. */
export function TemplateNotice() {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <p>
        <strong>Khung gợi ý mẫu theo ngành.</strong> Nội dung phần này chưa phải kết quả AI đánh giá trực tiếp trên website của bạn —
        hãy dùng như danh sách kiểm tra và tự xác minh trước khi ra quyết định.
      </p>
    </div>
  );
}
