import React, { useState } from 'react';
import { CompetitorProfile, CompetitorFound, ActionableFinding } from '../../types';
import { ExternalLink, RefreshCw, CheckCircle, AlertTriangle, Lightbulb, Swords, BookOpen, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { CopyButton } from '../CopyButton';

interface Step2CompetitorProfilesProps {
  competitorProfiles: CompetitorProfile[];
  competitorsFound: CompetitorFound[];
  actionableFindings?: ActionableFinding[];
  onRegenerate: () => void;
  isRegenerating: boolean;
  onShowToast: (msg: string) => void;
}

export const Step2CompetitorProfiles: React.FC<Step2CompetitorProfilesProps> = ({
  competitorProfiles,
  competitorsFound,
  actionableFindings = [],
  onRegenerate,
  isRegenerating,
  onShowToast,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!competitorProfiles || competitorProfiles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Chưa có hồ sơ đối thủ. Vui lòng hoàn thành Bước 1.
      </div>
    );
  }

  const activeProfile = competitorProfiles[selectedIdx] || competitorProfiles[0];

  const formatProfileForCopy = (p: CompetitorProfile) => {
    return `HỒ SƠ: ${p.name || ''} (${p.url || ''})
- Loại: ${p.isUserSite ? 'Website mục tiêu của bạn' : 'Đối thủ cạnh tranh'}
- Định vị quan sát được: ${p.positioning || 'Chưa đủ dữ liệu để xác minh.'}
- Sản phẩm/Dịch vụ chính: ${p.mainProducts?.join(', ') || 'Chưa đủ dữ liệu để xác minh.'}
- Nhóm khách hàng: ${p.targetAudience?.join(', ') || 'Chưa đủ dữ liệu để xác minh.'}
- Tổ chức menu: ${p.menuOrganization || 'Chưa đủ dữ liệu để xác minh.'}
- Trình bày sản phẩm: ${p.productPresentation || 'Chưa đủ dữ liệu để xác minh.'}
- Thông điệp chính: ${p.keyMessage || 'Chưa đủ dữ liệu để xác minh.'}
- Cam kết đang công bố: ${p.commitments || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}
- Chính sách bán hàng: ${p.salesPolicy || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}
- Kênh liên hệ: ${p.contactChannels?.join(', ') || 'Chưa đủ dữ liệu để xác minh.'}
- Điểm làm tốt: ${p.strengths?.join(' | ') || 'Chưa đủ dữ liệu để xác minh.'}
- Điểm còn hạn chế: ${p.weaknesses?.join(' | ') || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}
${!p.isUserSite ? `- Điều có thể học hỏi: ${p.learningsForUser?.join(' | ') || 'Chưa đủ dữ liệu để xác minh.'}\n- Chiến lược cạnh tranh: ${p.competitionStrategy || 'Chưa đủ dữ liệu để xác minh.'}` : ''}
- Nguồn đã kiểm tra: ${p.verifiedSources?.join(', ') || 'Mẫu kết quả tìm kiếm tự nhiên'}`;
  };

  return (
    <div className="space-y-6">
      {/* Competitor Discovery Transparency Header */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              5 đối thủ nổi bật trong mẫu kết quả tìm kiếm được kiểm tra tại thời điểm phân tích
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Được chọn lọc theo từ khóa có ý định thương mại cao; loại trừ mạng xã hội, báo chí và sàn TMĐT tổng hợp.
            </p>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 rounded-lg border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Tạo lại hồ sơ</span>
          </button>
        </div>

        {/* Discovery Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-3 font-semibold">Tên đối thủ</th>
                <th className="py-2 px-3 font-semibold">Địa chỉ Website</th>
                <th className="py-2 px-3 font-semibold">Truy vấn phát hiện</th>
                <th className="py-2 px-3 font-semibold">Lý do chọn</th>
                <th className="py-2 pl-3 font-semibold text-right">Liên quan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {competitorsFound.map((comp, idx) => (
                <tr key={idx} className="hover:bg-white/60 dark:hover:bg-slate-800/40">
                  <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                    {comp.name}
                  </td>
                  <td className="py-2 px-3">
                    <a
                      href={comp.url.startsWith('http') ? comp.url : `https://${comp.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                    >
                      {comp.url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                    {comp.queryFound}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-[220px]">
                    {comp.reason}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        comp.relevance === 'cao'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : comp.relevance === 'trung bình'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {comp.relevance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Website Tabs Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {competitorProfiles.map((p, idx) => (
          <button
            key={p.id || idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
              selectedIdx === idx
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {p.isUserSite ? `★ Bạn: ${p.name}` : `${idx}. ${p.name}`}
          </button>
        ))}
      </div>

      {/* Active Profile Card */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-xs">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  activeProfile.isUserSite
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {activeProfile.isUserSite ? 'Website của bạn' : `Đối thủ cạnh tranh #${selectedIdx}`}
              </span>
              <a
                href={activeProfile.url.startsWith('http') ? activeProfile.url : `https://${activeProfile.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                Mở website nguồn
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {activeProfile.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeProfile.url}</p>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              textToCopy={formatProfileForCopy(activeProfile)}
              label="Sao chép hồ sơ"
              onCopied={() => onShowToast(`Đã sao chép hồ sơ của ${activeProfile.name}`)}
            />
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
          {/* Định vị */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Định vị quan sát được</span>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {activeProfile.positioning || 'Chưa đủ dữ liệu để xác minh.'}
            </p>
          </div>

          {/* Thông điệp chính */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông điệp chính trên trang</span>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {activeProfile.keyMessage || 'Chưa đủ dữ liệu để xác minh.'}
            </p>
          </div>

          {/* Sản phẩm / dịch vụ chính */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sản phẩm & Dịch vụ chính</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {activeProfile.mainProducts?.length > 0 ? (
                activeProfile.mainProducts.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Chưa đủ dữ liệu để xác minh.</span>
              )}
            </div>
          </div>

          {/* Nhóm khách hàng */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhóm khách hàng hướng tới</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {activeProfile.targetAudience?.length > 0 ? (
                activeProfile.targetAudience.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Chưa đủ dữ liệu để xác minh.</span>
              )}
            </div>
          </div>

          {/* Menu & Trình bày */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cách tổ chức Menu</span>
            <p className="text-slate-700 dark:text-slate-300">{activeProfile.menuOrganization || 'Chưa đủ dữ liệu để xác minh.'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cách trình bày sản phẩm</span>
            <p className="text-slate-700 dark:text-slate-300">{activeProfile.productPresentation || 'Chưa đủ dữ liệu để xác minh.'}</p>
          </div>

          {/* Cam kết & Chính sách */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cam kết đang công bố</span>
            <p className="text-slate-700 dark:text-slate-300">{activeProfile.commitments || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chính sách bán hàng</span>
            <p className="text-slate-700 dark:text-slate-300">{activeProfile.salesPolicy || 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.'}</p>
          </div>

          {/* Kênh liên hệ */}
          <div className="space-y-1 md:col-span-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kênh liên hệ quan sát được</span>
            <p className="text-slate-700 dark:text-slate-300">{activeProfile.contactChannels?.join(', ') || 'Chưa đủ dữ liệu để xác minh.'}</p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Điểm làm tốt */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Điểm làm tốt (Quan sát được)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
              {activeProfile.strengths?.length > 0 ? (
                activeProfile.strengths.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li>Chưa đủ dữ liệu để xác minh.</li>
              )}
            </ul>
          </div>

          {/* Điểm còn hạn chế */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Điểm còn hạn chế (Quan sát được)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
              {activeProfile.weaknesses?.length > 0 ? (
                activeProfile.weaknesses.map((w, i) => <li key={i}>{w}</li>)
              ) : (
                <li>Chưa tìm thấy bằng chứng trong các trang được kiểm tra.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Learnings & Strategy for User Site (Only shown if competitor) */}
        {!activeProfile.isUserSite && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/70 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-brand-300 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Điều website của bạn có thể học hỏi
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                {activeProfile.learningsForUser?.length > 0 ? (
                  activeProfile.learningsForUser.map((l, i) => <li key={i}>{l}</li>)
                ) : (
                  <li>Chưa đủ dữ liệu để xác minh.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/70 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-brand-300 mb-2 flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Cách website của bạn nên cạnh tranh
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeProfile.competitionStrategy || 'Tập trung vào điểm yếu của đối thủ và nâng cao tính minh bạch, hỗ trợ tư vấn tức thì.'}
              </p>
            </div>
          </div>
        )}

        {/* Verified Sources */}
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Nguồn đã kiểm tra:</span>
          <span className="font-mono text-[11px] truncate">{activeProfile.verifiedSources?.join(', ') || activeProfile.url}</span>
        </div>
      </div>

      {/* Actionable Findings Section (Phát hiện thực tế có thể hành động ngay) */}
      {actionableFindings && actionableFindings.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Phát hiện thực tế có thể hành động ngay ({actionableFindings.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các vấn đề cụ thể được phát hiện trên từng trang chi tiết kèm đường dẫn đối chiếu thực tế.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {actionableFindings.map((finding: ActionableFinding) => (
              <div
                key={finding.id}
                className={`accent-card p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between ${
                  finding.category === 'Ưu tiên sửa'
                    ? 'border-t-rose-400 dark:border-t-rose-500/80'
                    : finding.category === 'Nên giữ và nâng cấp'
                    ? 'border-t-emerald-400 dark:border-t-emerald-500/80'
                    : 'border-t-brand-500 dark:border-t-brand-400/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        finding.category === 'Ưu tiên sửa'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : finding.category === 'Nên giữ và nâng cấp'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-900'
                      }`}
                    >
                      {finding.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {finding.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
                    {finding.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 mb-2">
                    <strong className="text-slate-900 dark:text-white">Việc cần làm: </strong>
                    {finding.actionNeeded}
                  </div>
                  {finding.tags && finding.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {finding.tags.map((tag: any, tIdx: number) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag.url ? (
                            <a
                              href={tag.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
                            >
                              {tag.label}
                            </a>
                          ) : (
                            tag.label
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
