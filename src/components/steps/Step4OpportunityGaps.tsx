import React, { useState } from 'react';
import { OpportunityGap10X, RoadmapTask10X } from '../../types';
import { CopyButton } from '../CopyButton';
import { RefreshCw, PlusCircle, CheckCircle2, TrendingUp, AlertCircle, Clock, Users, Target, ShieldCheck, Zap } from 'lucide-react';

interface Step4OpportunityGapsProps {
  opportunities: any[];
  onRegenerate: () => void;
  isRegenerating: boolean;
  onAddToRoadmap: (task: RoadmapTask10X) => void;
  onShowToast: (msg: string) => void;
}

export const Step4OpportunityGaps: React.FC<Step4OpportunityGapsProps> = ({
  opportunities,
  onRegenerate,
  isRegenerating,
  onAddToRoadmap,
  onShowToast,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const oppList = opportunities || [];
  const filtered = oppList.filter((opp) => {
    if (filterType === 'all') return true;
    if (filterType === 'urgent' && (opp.badgeType === 'urgent' || opp.priority === 'immediate')) return true;
    if (filterType === 'improve' && (opp.badgeType === 'improve' || opp.priority === 'next')) return true;
    if (filterType === 'new' && (opp.badgeType === 'new' || opp.priority === 'research')) return true;
    return false;
  });

  const handleAdd = (opp: any, idx: number) => {
    const isUrgent = opp.badgeType === 'urgent' || opp.priority === 'immediate';
    const isImprove = opp.badgeType === 'improve' || opp.priority === 'next';

    const newTask: RoadmapTask10X = {
      id: `task-opp-${opp.id || idx}-${Date.now()}`,
      phaseId: isUrgent ? 1 : isImprove ? 2 : 3,
      phaseTitle: isUrgent
        ? 'Giai đoạn 1: Sửa lỗi và việc tác động nhanh'
        : isImprove
        ? 'Giai đoạn 2: Chiếm khoảng trống cơ hội & Tối ưu chuyển đổi'
        : 'Giai đoạn 3: Xây dựng chiều sâu nội dung & Thống trị thị trường',
      phaseTimeline: isUrgent ? 'Ngày 1 - Ngày 14' : isImprove ? 'Ngày 15 - Ngày 45' : 'Ngày 46 - Ngày 90',
      phaseGoal: isUrgent
        ? 'Khắc phục ngay rào cản chuyển đổi'
        : isImprove
        ? 'Tạo ưu thế cạnh tranh khác biệt'
        : 'Mở rộng thị phần bền vững',
      taskName: opp.title,
      gapResolved: opp.title,
      department: opp.department || 'Marketing / Kỹ thuật',
      metricToTrack: opp.measureMetric || 'Tỷ lệ chuyển đổi & tương tác người dùng',
      status: 'not_started',
    };

    onAddToRoadmap(newTask);
    setAddedIds((prev) => ({ ...prev, [opp.id || idx]: true }));
    onShowToast(`Đã thêm "${opp.title}" vào Lộ trình triển khai!`);
  };

  const formatOppForCopy = (opp: any) => {
    return `[CƠ HỘI ĐỘT PHÁ #${opp.orderNumber || ''}: ${opp.title}]
- Trạng thái phân loại: ${opp.badge || opp.typeName || 'Khoảng trống cơ hội'}
- Vấn đề phát hiện: ${opp.description || opp.observedIssue}
- Vì sao đáng quan tâm: ${opp.whyOpportunity || opp.whyCare}
- Việc cần thực hiện: ${opp.actionNeeded}
- Tầng phễu: ${opp.funnelStage || 'Toàn trang'}
- Thời gian ước tính: ${opp.estimatedTimeline || '1-2 tuần'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Khoảng trống cơ hội đột phá (10X Opportunity Gaps - {opportunities.length} mục)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dựa trên điểm yếu của đối thủ, mâu thuẫn dữ liệu cần sửa và các tính năng chưa ai khai thác trên thị trường.
          </p>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Tạo lại cơ hội</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Lọc theo nhóm:</span>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Tất cả ({opportunities.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('urgent')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'urgent'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
          }`}
        >
          Cần hoàn thiện so với đối thủ
        </button>
        <button
          type="button"
          onClick={() => setFilterType('improve')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'improve'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
          }`}
        >
          Có dấu vết, còn cơ hội cải thiện
        </button>
        <button
          type="button"
          onClick={() => setFilterType('new')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'new'
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
          }`}
        >
          Chưa thấy trên các mẫu đã đọc
        </button>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((opp, idx) => {
          const key = opp.id || idx;
          const isAdded = addedIds[key];
          const isUrgent = opp.badgeType === 'urgent' || opp.priority === 'immediate';
          const isImprove = opp.badgeType === 'improve' || opp.priority === 'next';

          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                {/* Badge & Order */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isUrgent
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : isImprove
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                    }`}
                  >
                    {opp.badge || (isUrgent ? 'CẦN HOÀN THIỆN' : isImprove ? 'CƠ HỘI CẢI THIỆN' : 'CHƯA THẤY ĐỐI THỦ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{opp.orderNumber || String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {opp.title}
                </h4>

                {/* Description & Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400">Vấn đề quan sát: </strong>
                    <span className="text-slate-800 dark:text-slate-200">{opp.description || opp.observedIssue}</span>
                  </div>
                  <div>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Vì sao là cơ hội: </strong>
                    <span className="text-slate-700 dark:text-slate-300">{opp.whyOpportunity || opp.whyCare}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white font-semibold flex items-center gap-1 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Việc cần làm:
                    </strong>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{opp.actionNeeded}</span>
                  </div>
                </div>

                {/* Funnel & Timeline */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    {opp.funnelStage || 'Toàn trang'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {opp.estimatedTimeline || '1-2 tuần'}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <CopyButton
                  textToCopy={formatOppForCopy(opp)}
                  label="Sao chép"
                  onCopied={() => onShowToast(`Đã sao chép cơ hội "${opp.title}"`)}
                />
                <button
                  type="button"
                  onClick={() => handleAdd(opp, idx)}
                  disabled={isAdded}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã thêm vào lộ trình</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Thêm vào lộ trình</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
