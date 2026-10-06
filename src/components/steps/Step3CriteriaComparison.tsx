import React, { useState, useMemo } from 'react';
import { CriteriaComparisonData, CompetitorProfile, CellEvaluation, CriteriaGroupKey } from '../../types';
import { CRITERIA_LIST, CRITERIA_GROUPS, STATUS_META } from '../../constants/criteria';
import { EvidenceModal } from '../EvidenceModal';
import { CopyButton } from '../CopyButton';
import { RadarCriteriaChart } from '../RadarCriteriaChart';
import { Search, Filter, RefreshCw, Trophy, ChevronRight, HelpCircle } from 'lucide-react';

interface Step3CriteriaComparisonProps {
  data: CriteriaComparisonData;
  competitors: CompetitorProfile[];
  userWebsiteUrl: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onShowToast: (msg: string) => void;
}

export const Step3CriteriaComparison: React.FC<Step3CriteriaComparisonProps> = ({
  data,
  competitors,
  userWebsiteUrl,
  onRegenerate,
  isRegenerating,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [activeModalData, setActiveModalData] = useState<{
    criterionId: number;
    criterionName: string;
    criterionGroup: string;
    siteName: string;
    siteUrl: string;
    evaluation: CellEvaluation;
  } | null>(null);

  // Filtered criteria list
  const filteredCriteria = useMemo(() => {
    return CRITERIA_LIST.filter((crit) => {
      // Group filter
      if (selectedGroup !== 'all' && crit.group !== selectedGroup) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = crit.name.toLowerCase().includes(q);
        const matchGroup = crit.groupName.toLowerCase().includes(q);
        if (!matchName && !matchGroup) return false;
      }

      // Status filter (checks if user site or any site has this status)
      if (selectedStatus !== 'all') {
        const userEval = data?.evaluations?.[crit.id]?.[userWebsiteUrl];
        if (!userEval || userEval.status !== selectedStatus) {
          // If status filter is set, check if at least one site has it
          const anySiteMatches = (competitors || []).some((c) => {
            const ev = data?.evaluations?.[crit.id]?.[c.url];
            return ev && ev.status === selectedStatus;
          });
          if (!anySiteMatches) return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedGroup, selectedStatus, data, userWebsiteUrl, competitors]);

  const handleCellClick = (
    critId: number,
    critName: string,
    critGroup: string,
    siteName: string,
    siteUrl: string,
    evalData?: CellEvaluation
  ) => {
    const finalEval: CellEvaluation = evalData || {
      status: 'insufficient_data',
      evidence: 'Chưa tìm thấy bằng chứng trong các trang được kiểm tra.',
      sourceUrl: siteUrl,
      reason: 'Dữ liệu trang chưa đủ mẫu đối chiếu.',
      limitation: 'Chỉ kiểm tra các trang công khai tại thời điểm phân tích.',
      userRecommendation: 'Cần bổ sung nội dung hoặc tính năng này để tăng tỷ lệ chuyển đổi.',
    };

    setActiveModalData({
      criterionId: critId,
      criterionName: critName,
      criterionGroup: critGroup,
      siteName,
      siteUrl,
      evaluation: finalEval,
    });
  };

  const copyableSummary = useMemo(() => {
    let out = 'BẢNG XẾP HẠNG TỔNG QUAN (KHÔNG DÙNG ĐIỂM SỐ GIẢ ĐỊNH):\n';
    (data?.rankings || []).forEach((r) => {
      out += `* ${r.siteName} (${r.siteUrl}): ${r.overallRank}\n`;
      if (r.groupRanks) {
        out += `  - Điều hướng: ${r.groupRanks.dieuhuong || '—'} | Tin cậy: ${r.groupRanks.tincay || '—'} | Nội dung: ${r.groupRanks.noidung || '—'}\n`;
        out += `  - Tương tác: ${r.groupRanks.tuongtac || '—'} | Chốt đơn: ${r.groupRanks.chotdon || '—'} | Kỹ thuật: ${r.groupRanks.kythuat || '—'}\n`;
      }
    });
    return out;
  }, [data]);

  return (
    <div className="step-3-container space-y-6">
      {/* Top Rankings Summary Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/80 via-white to-brand-50/80 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-slate-200/90 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bảng xếp hạng tổng quan & theo từng nhóm tiêu chí
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thứ hạng được xác lập dựa trên bằng chứng quan sát thực tế (Tuyệt đối không dùng điểm số giả định).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton
              textToCopy={copyableSummary}
              label="Sao chép thứ hạng"
              onCopied={() => onShowToast('Đã sao chép bảng thứ hạng')}
            />
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 rounded-lg border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Tạo lại đánh giá</span>
            </button>
          </div>
        </div>

        {/* Rankings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {data.rankings?.map((r, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs ${
                r.isUserSite
                  ? 'bg-brand-600 text-white border-brand-700 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold truncate text-[11px]">
                  {r.isUserSite ? '★ Bạn' : r.siteName}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    r.isUserSite ? 'bg-brand-800/70 text-white ring-1 ring-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r.overallRank}
                </span>
              </div>
              <div className="space-y-0.5 text-[10px] opacity-90">
                <div className="flex justify-between">
                  <span>Điều hướng:</span>
                  <span className="font-semibold">{r.groupRanks?.dieuhuong || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tin cậy:</span>
                  <span className="font-semibold">{r.groupRanks?.tincay || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nội dung:</span>
                  <span className="font-semibold">{r.groupRanks?.noidung || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tương tác:</span>
                  <span className="font-semibold">{r.groupRanks?.tuongtac || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chốt đơn:</span>
                  <span className="font-semibold">{r.groupRanks?.chotdon || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kỹ thuật:</span>
                  <span className="font-semibold">{r.groupRanks?.kythuat || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 360° Visual Radar Chart */}
      <RadarCriteriaChart
        data={data}
        competitors={competitors}
        userWebsiteUrl={userWebsiteUrl}
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm trong 35 tiêu chí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-brand-500"
          />
        </div>

        {/* Group Selector & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Nhóm:
            </span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="all">Tất cả 6 nhóm</option>
              {CRITERIA_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="good">Đáp ứng tốt</option>
              <option value="partial">Có nhưng chưa đầy đủ</option>
              <option value="no_evidence">Chưa tìm thấy bằng chứng</option>
              <option value="insufficient_data">Chưa đủ dữ liệu để xác minh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Criteria Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Quy ước 4 trạng thái (Click ô để xem bằng chứng & đề xuất):
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          ● Đáp ứng tốt
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          ● Có nhưng chưa đầy đủ
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          ● Chưa tìm thấy bằng chứng
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          ● Chưa đủ dữ liệu để xác minh
        </span>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <th className="py-3 px-3 font-bold w-12 text-center">STT</th>
              <th className="py-3 px-3 font-bold min-w-[200px]">Tiêu chí đánh giá</th>
              <th className="py-3 px-3 font-bold min-w-[100px]">Nhóm</th>

              {/* Columns for user site + competitors */}
              {competitors.map((c, i) => (
                <th
                  key={c.id || i}
                  className={`py-3 px-2 font-bold min-w-[130px] text-center ${
                    c.isUserSite ? 'bg-brand-50/80 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300' : ''
                  }`}
                >
                  <div className="truncate max-w-[130px]" title={c.name}>
                    {c.isUserSite ? '★ Bạn (Website)' : c.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
            {filteredCriteria.map((crit) => (
              <tr key={crit.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                  {crit.id}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                  {crit.name}
                </td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {crit.groupName}
                </td>

                {/* Website evaluations */}
                {competitors.map((comp) => {
                  const evalData = data.evaluations?.[crit.id]?.[comp.url];
                  const statusKey = evalData?.status || 'insufficient_data';
                  const meta = STATUS_META[statusKey] || STATUS_META.insufficient_data;

                  return (
                    <td
                      key={comp.id}
                      onClick={() =>
                        handleCellClick(
                          crit.id,
                          crit.name,
                          crit.groupName,
                          comp.name,
                          comp.url,
                          evalData
                        )
                      }
                      className={`py-2 px-2 text-center cursor-pointer transition-all hover:ring-2 hover:ring-brand-400 ${
                        comp.isUserSite ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                      title="Bấm để xem bằng chứng, nguồn và đề xuất"
                    >
                      <span
                        className={`inline-block px-2 py-1 rounded text-[11px] font-medium transition-transform hover:scale-105 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Evidence on cell click */}
      {activeModalData && (
        <EvidenceModal
          isOpen={!!activeModalData}
          onClose={() => setActiveModalData(null)}
          criterionId={activeModalData.criterionId}
          criterionName={activeModalData.criterionName}
          criterionGroup={activeModalData.criterionGroup}
          siteName={activeModalData.siteName}
          siteUrl={activeModalData.siteUrl}
          evaluation={activeModalData.evaluation}
        />
      )}
    </div>
  );
};
