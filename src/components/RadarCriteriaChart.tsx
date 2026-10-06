import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { CriteriaComparisonData, CompetitorProfile } from '../types';
import { CRITERIA_LIST, CRITERIA_GROUPS, CriteriaGroupMeta } from '../constants/criteria';
import { D3RadarChart } from './D3RadarChart';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Layers,
  Sparkles,
  Filter,
  Users,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RadarCriteriaChartProps {
  data: CriteriaComparisonData;
  competitors: CompetitorProfile[];
  userWebsiteUrl: string;
}

export interface RadarItem {
  key: string;
  subject: string;
  fullName: string;
  userScore: number;
  competitorAvg: number;
  difference: number;
  id?: number;
  groupName?: string;
  groupKey?: string;
  userStatus?: string;
  [key: string]: any;
}

// Convert status to objective observable completion score (0 - 100)
function statusToScore(status?: string): number {
  switch (status) {
    case 'good':
      return 100;
    case 'partial':
      return 50;
    case 'no_evidence':
      return 0;
    case 'insufficient_data':
      return 0;
    default:
      return 0;
  }
}

// Signature colors for individual competitors
const COMPETITOR_COLORS = [
  '#10b981', // Emerald
  '#0284c7', // Sky Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ea580c', // Orange
  '#14b8a6', // Teal
];

export const RadarCriteriaChart: React.FC<RadarCriteriaChartProps> = ({
  data,
  competitors,
  userWebsiteUrl,
}) => {
  // View mode: 'groups' (Pillars) vs 'criteria' (Individual Criteria)
  const [viewMode, setViewMode] = useState<'groups' | 'criteria'>('groups');

  // Filter actual competitors (exclude user site if it's in competitors list)
  const actualCompetitors = useMemo(() => {
    return (competitors || []).filter((c) => !c.isUserSite && c.url !== userWebsiteUrl);
  }, [competitors, userWebsiteUrl]);

  // Selected competitors state (defaults to all competitors)
  const [selectedCompetitorUrls, setSelectedCompetitorUrls] = useState<string[]>(() =>
    actualCompetitors.map((c) => c.url)
  );

  // Selected criteria groups state (defaults to all 7 groups)
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>(() =>
    CRITERIA_GROUPS.map((g) => g.key)
  );

  // Display options
  const [showCompetitorAvg, setShowCompetitorAvg] = useState<boolean>(true);
  const [showIndividualCompetitors, setShowIndividualCompetitors] = useState<boolean>(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(true);

  // Competitor specific series visibility in the chart
  const [visibleCompetitorSeries, setVisibleCompetitorSeries] = useState<string[]>(() =>
    actualCompetitors.map((c) => c.url)
  );
  const [showUserSeries, setShowUserSeries] = useState<boolean>(true);
  const [showAvgSeries, setShowAvgSeries] = useState<boolean>(true);

  // Synchronize selected competitors and series if competitors prop changes
  React.useEffect(() => {
    if (actualCompetitors.length > 0 && selectedCompetitorUrls.length === 0) {
      setSelectedCompetitorUrls(actualCompetitors.map((c) => c.url));
      setVisibleCompetitorSeries(actualCompetitors.map((c) => c.url));
    }
  }, [actualCompetitors]);

  // Active competitors based on selection
  const activeCompetitors = useMemo(() => {
    return actualCompetitors.filter((c) => selectedCompetitorUrls.includes(c.url));
  }, [actualCompetitors, selectedCompetitorUrls]);

  // Active criteria groups based on selection
  const activeGroups = useMemo(() => {
    return CRITERIA_GROUPS.filter((g) => selectedGroupKeys.includes(g.key));
  }, [selectedGroupKeys]);

  // Active criteria list based on selected groups
  const activeCriteriaList = useMemo(() => {
    return CRITERIA_LIST.filter((c) => selectedGroupKeys.includes(c.group));
  }, [selectedGroupKeys]);

  // Toggle competitor series handler (for the interactive legend above chart)
  const toggleCompetitorSeries = (url: string) => {
    setVisibleCompetitorSeries((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
    // Keep in sync with selectedCompetitorUrls for consistent average & metrics
    setSelectedCompetitorUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const showAllSeries = () => {
    const allUrls = actualCompetitors.map((c) => c.url);
    setVisibleCompetitorSeries(allUrls);
    setSelectedCompetitorUrls(allUrls);
    setShowUserSeries(true);
    setShowAvgSeries(true);
  };

  const hideAllCompetitorSeries = () => {
    setVisibleCompetitorSeries([]);
  };

  const showOnlyUserSeries = () => {
    setVisibleCompetitorSeries([]);
    setShowAvgSeries(false);
    setShowUserSeries(true);
  };

  // Toggle competitor handler
  const toggleCompetitor = (url: string) => {
    setSelectedCompetitorUrls((prev) => {
      const next = prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url];
      setVisibleCompetitorSeries(next);
      return next;
    });
  };

  const selectAllCompetitors = () => {
    const allUrls = actualCompetitors.map((c) => c.url);
    setSelectedCompetitorUrls(allUrls);
    setVisibleCompetitorSeries(allUrls);
  };

  const deselectAllCompetitors = () => {
    setSelectedCompetitorUrls([]);
    setVisibleCompetitorSeries([]);
  };

  // Toggle criteria group handler
  const toggleGroup = (key: string) => {
    setSelectedGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllGroups = () => {
    setSelectedGroupKeys(CRITERIA_GROUPS.map((g) => g.key));
  };

  const deselectAllGroups = () => {
    setSelectedGroupKeys([]);
  };

  // Quick preset: Conversion-focused groups
  const selectConversionPreset = () => {
    setSelectedGroupKeys(['tincay', 'chotdon', 'tuongtac']);
    setViewMode('criteria');
  };

  // Quick preset: Structure & Technical
  const selectTechnicalPreset = () => {
    setSelectedGroupKeys(['dieuhuong', 'noidung', 'kythuat']);
    setViewMode('criteria');
  };

  // Quick preset: 1-on-1 vs Top 1 competitor
  const selectTop1CompetitorPreset = () => {
    if (actualCompetitors.length > 0) {
      setSelectedCompetitorUrls([actualCompetitors[0].url]);
      setVisibleCompetitorSeries([actualCompetitors[0].url]);
      setShowAvgSeries(false);
      setShowUserSeries(true);
    }
  };

  // Quick preset: View user site only without competitors
  const selectUserSiteOnlyPreset = () => {
    setSelectedCompetitorUrls([]);
    setVisibleCompetitorSeries([]);
    setShowAvgSeries(false);
    setShowUserSeries(true);
  };

  // Reset all filters to default
  const resetAllFilters = () => {
    const allUrls = actualCompetitors.map((c) => c.url);
    setSelectedCompetitorUrls(allUrls);
    setVisibleCompetitorSeries(allUrls);
    setSelectedGroupKeys(CRITERIA_GROUPS.map((g) => g.key));
    setShowCompetitorAvg(true);
    setShowAvgSeries(true);
    setShowUserSeries(true);
    setShowIndividualCompetitors(true);
    setViewMode('groups');
  };

  // 1. Group Radar Data (Pillars)
  const groupRadarData: RadarItem[] = useMemo(() => {
    return activeGroups.map((grp) => {
      const criteriaInGroup = CRITERIA_LIST.filter((c) => c.group === grp.key);
      const totalCriteria = criteriaInGroup.length || 1;

      // User score for this group
      let userTotal = 0;
      criteriaInGroup.forEach((crit) => {
        const ev = data?.evaluations?.[crit.id]?.[userWebsiteUrl];
        userTotal += statusToScore(ev?.status);
      });
      const userAvg = Math.round(userTotal / totalCriteria);

      // Active competitors average score for this group
      let compSum = 0;
      let compCount = 0;
      criteriaInGroup.forEach((crit) => {
        activeCompetitors.forEach((comp) => {
          const ev = data?.evaluations?.[crit.id]?.[comp.url];
          compSum += statusToScore(ev?.status);
          compCount++;
        });
      });
      const compAvg = compCount > 0 ? Math.round(compSum / compCount) : 0;

      const item: RadarItem = {
        key: grp.key,
        subject: grp.name,
        fullName: `${grp.name} (${criteriaInGroup.length} tiêu chí)`,
        userScore: userAvg,
        competitorAvg: compAvg,
        difference: userAvg - compAvg,
        groupKey: grp.key,
      };

      // Calculate score for each individual competitor in actualCompetitors
      actualCompetitors.forEach((comp, idx) => {
        let singleCompSum = 0;
        criteriaInGroup.forEach((crit) => {
          const ev = data?.evaluations?.[crit.id]?.[comp.url];
          singleCompSum += statusToScore(ev?.status);
        });
        item[`comp_${idx}`] = Math.round(singleCompSum / totalCriteria);
      });

      return item;
    });
  }, [data, activeGroups, activeCompetitors, userWebsiteUrl]);

  // 2. Criteria Radar Data (Individual Criteria from selected groups)
  const criteriaRadarData: RadarItem[] = useMemo(() => {
    return activeCriteriaList.map((crit) => {
      const userEval = data?.evaluations?.[crit.id]?.[userWebsiteUrl];
      const userScore = statusToScore(userEval?.status);

      let compSum = 0;
      activeCompetitors.forEach((comp) => {
        const ev = data?.evaluations?.[crit.id]?.[comp.url];
        compSum += statusToScore(ev?.status);
      });
      const compAvg = activeCompetitors.length > 0 ? Math.round(compSum / activeCompetitors.length) : 0;

      // Shorten label for radar axis
      const shortLabel = `TC ${crit.id < 10 ? '0' + crit.id : crit.id}`;

      const item: RadarItem = {
        key: `crit-${crit.id}`,
        id: crit.id,
        subject: shortLabel,
        fullName: crit.name,
        groupName: crit.groupName,
        groupKey: crit.group,
        userScore,
        competitorAvg: compAvg,
        difference: userScore - compAvg,
        userStatus: userEval?.status,
      };

      // Add individual competitor score
      actualCompetitors.forEach((comp, idx) => {
        const ev = data?.evaluations?.[crit.id]?.[comp.url];
        item[`comp_${idx}`] = statusToScore(ev?.status);
      });

      return item;
    });
  }, [data, activeCriteriaList, activeCompetitors, userWebsiteUrl]);

  // Determine current active dataset
  const activeDataset: RadarItem[] = useMemo(() => {
    return viewMode === 'groups' ? groupRadarData : criteriaRadarData;
  }, [viewMode, groupRadarData, criteriaRadarData]);

  // Overall comparison stats based on currently selected groups & competitors
  const stats = useMemo(() => {
    if (activeCriteriaList.length === 0) {
      return {
        avgUser: 0,
        avgComp: 0,
        netDiff: 0,
        bestPillar: null,
        worstPillar: null,
        leadsCount: 0,
        lagsCount: 0,
        equalCount: 0,
      };
    }

    // Average user score across active criteria
    let totalUser = 0;
    activeCriteriaList.forEach((crit) => {
      const ev = data?.evaluations?.[crit.id]?.[userWebsiteUrl];
      totalUser += statusToScore(ev?.status);
    });
    const avgUser = Math.round(totalUser / activeCriteriaList.length);

    // Average competitor score across active criteria & active competitors
    let totalComp = 0;
    let compCount = 0;
    activeCriteriaList.forEach((crit) => {
      activeCompetitors.forEach((comp) => {
        const ev = data?.evaluations?.[crit.id]?.[comp.url];
        totalComp += statusToScore(ev?.status);
        compCount++;
      });
    });
    const avgComp = compCount > 0 ? Math.round(totalComp / compCount) : 0;

    // Best and worst pillars among active groups
    const sortedGroupDiff = [...groupRadarData].sort((a, b) => b.difference - a.difference);
    const bestPillar = sortedGroupDiff.length > 0 ? sortedGroupDiff[0] : null;
    const worstPillar = sortedGroupDiff.length > 0 ? sortedGroupDiff[sortedGroupDiff.length - 1] : null;

    // Count criteria where user leads vs lags among active criteria
    let leadsCount = 0;
    let lagsCount = 0;
    let equalCount = 0;
    criteriaRadarData.forEach((item) => {
      if (item.userScore > item.competitorAvg) leadsCount++;
      else if (item.userScore < item.competitorAvg) lagsCount++;
      else equalCount++;
    });

    return {
      avgUser,
      avgComp,
      netDiff: avgUser - avgComp,
      bestPillar,
      worstPillar,
      leadsCount,
      lagsCount,
      equalCount,
    };
  }, [data, activeCriteriaList, activeCompetitors, userWebsiteUrl, groupRadarData, criteriaRadarData]);

  // Custom Tooltip for Radar Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload as RadarItem;
      const userVal = itemData.userScore;
      const compVal = itemData.competitorAvg;
      const diff = userVal - compVal;

      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-xl border border-slate-700/80 shadow-2xl max-w-sm text-xs space-y-2.5 backdrop-blur-md z-50">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-sm text-slate-100">
                {itemData.fullName || itemData.subject}
              </span>
              {itemData.groupName && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-medium">
                  {itemData.groupName}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {/* User Website */}
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block shadow-xs shadow-brand-500/50"></span>
                Website của bạn:
              </span>
              <span className="font-bold text-white text-sm">{userVal}%</span>
            </div>

            {/* Competitors Average */}
            {showCompetitorAvg && activeCompetitors.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs shadow-amber-500/50"></span>
                  Trung bình {activeCompetitors.length} đối thủ đã chọn:
                </span>
                <span className="font-bold text-white text-sm">{compVal}%</span>
              </div>
            )}

            {/* Individual active competitors if enabled */}
            {showIndividualCompetitors && activeCompetitors.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Chi tiết từng đối thủ:
                </span>
                {activeCompetitors.map((comp, idx) => {
                  const compScore = itemData[`comp_${idx}`];
                  const color = COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length];
                  return (
                    <div key={comp.url} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="truncate">{comp.name || comp.url.replace(/^https?:\/\//, '')}</span>
                      </span>
                      <span className="font-semibold text-slate-200">{compScore}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Difference Summary */}
          {activeCompetitors.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Chênh lệch so với TB:</span>
              <span
                className={`font-bold ${
                  diff > 0
                    ? 'text-emerald-400'
                    : diff < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {diff > 0 ? `+${diff}% (Vượt trội)` : diff < 0 ? `${diff}% (Cần cải thiện)` : 'Ngang bằng'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-xs">
      {/* 1. Header Bar with Mode Switcher & Toggle Panel Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
                Biểu đồ Radar 360°: So sánh mức đáp ứng 35 tiêu chí
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300">
                  Dữ liệu quan sát thực tế
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bật/tắt linh hoạt từng đối thủ hoặc nhóm tiêu chí để so sánh chuyên sâu (Thang chuẩn hóa 0 - 100%)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Toggle */}
        <div className="flex items-center flex-wrap gap-2 self-start lg:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('groups')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'groups'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Theo nhóm trụ cột ({activeGroups.length}/7)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('criteria')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'criteria'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Chi tiết tiêu chí ({activeCriteriaList.length}/35)
            </button>
          </div>

          {/* Toggle Filter Panel Button */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isFilterPanelOpen
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tùy chỉnh đối thủ & nhóm</span>
            {isFilterPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Focus Controls: Toggle Competitors & Criteria Groups */}
      {isFilterPanelOpen && (
        <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-4 text-xs transition-all">
          {/* Quick Presets Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Bộ lọc nhanh 1 chạm:</span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Tức thì &bull; Không tải lại trang
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-400 font-semibold cursor-pointer shadow-2xs transition-all"
              >
                🌟 Tất cả (Mặc định)
              </button>
              <button
                type="button"
                onClick={selectConversionPreset}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-semibold cursor-pointer transition-all"
              >
                ⚡ Chốt đơn & Niềm tin
              </button>
              <button
                type="button"
                onClick={selectTechnicalPreset}
                className="px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 hover:bg-brand-200 font-semibold cursor-pointer transition-all"
              >
                🛠️ Cấu trúc & Kỹ thuật
              </button>
              <button
                type="button"
                onClick={selectTop1CompetitorPreset}
                className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200 font-semibold cursor-pointer transition-all"
              >
                🏆 Đối đầu Top 1
              </button>
              <button
                type="button"
                onClick={selectUserSiteOnlyPreset}
                className="px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 hover:bg-brand-200 font-semibold cursor-pointer transition-all"
              >
                🎯 Chỉ xem website của bạn
              </button>
            </div>
          </div>

          {/* Section A: Competitors Toggle Bar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Ẩn/Hiện từng đối thủ:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {activeCompetitors.length} / {actualCompetitors.length} đang hiển thị
                </span>
              </div>

              {/* Competitor Actions & Display Mode Switches */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllCompetitors}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                >
                  Hiện tất cả đối thủ
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={deselectAllCompetitors}
                  className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Ẩn tất cả đối thủ
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showCompetitorAvg}
                    onChange={(e) => setShowCompetitorAvg(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span>Đường TB đối thủ</span>
                </label>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showIndividualCompetitors}
                    onChange={(e) => setShowIndividualCompetitors(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <span>Đường riêng từng đối thủ</span>
                </label>
              </div>
            </div>

            {/* Competitor Toggle Chips with Eye / EyeOff */}
            <div className="flex flex-wrap gap-2 pt-1">
              {actualCompetitors.map((comp, idx) => {
                const isSelected = selectedCompetitorUrls.includes(comp.url);
                const color = COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length];
                const hostname = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

                return (
                  <button
                    key={comp.url}
                    type="button"
                    onClick={() => toggleCompetitor(comp.url)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium text-xs select-none ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-650 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? color : '#94a3b8' }}
                    ></span>
                    <span className="font-semibold truncate max-w-[160px]">
                      {comp.name || hostname}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      ({hostname})
                    </span>
                    {isSelected ? (
                      <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
            {/* Section B: Criteria Groups Toggle Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Ẩn/Hiện nhóm tiêu chí:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {selectedGroupKeys.length} / 7 nhóm ({activeCriteriaList.length} tiêu chí)
                </span>
              </div>

              {/* Presets and Actions */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllGroups}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                >
                  Bật cả 7 nhóm
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={deselectAllGroups}
                  className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Tắt tất cả nhóm
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer font-medium"
                  title="Khôi phục trạng thái ban đầu"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục mặc định</span>
                </button>
              </div>
            </div>

            {/* Criteria Group Toggle Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {CRITERIA_GROUPS.map((grp) => {
                const isSelected = selectedGroupKeys.includes(grp.key);
                const count = CRITERIA_LIST.filter((c) => c.group === grp.key).length;

                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => toggleGroup(grp.key)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-brand-300 dark:border-brand-700 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="font-semibold block truncate text-xs">{grp.name}</span>
                      <span className="text-[10px] text-slate-400 block">{count} tiêu chí</span>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Chart & Insights Area */}
      {activeGroups.length === 0 ? (
        /* Empty State: No groups selected */
        <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <Filter className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có nhóm tiêu chí nào được chọn
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Vui lòng bật ít nhất 1 nhóm tiêu chí ở thanh điều khiển phía trên để hiển thị biểu đồ radar so sánh.
          </p>
          <button
            type="button"
            onClick={selectAllGroups}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 cursor-pointer shadow-sm transition-all"
          >
            Bật lại cả 7 nhóm tiêu chí
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart Display */}
          <div className="lg:col-span-7 xl:col-span-8 w-full flex flex-col justify-center relative space-y-3">
            {/* Clear, Interactive Legend directly above the Radar Chart */}
            <div className="w-full bg-slate-50/90 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Chú thích tương tác & Chuỗi dữ liệu (Interactive Legend):
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    ({visibleCompetitorSeries.length}/{actualCompetitors.length} đối thủ hiển thị)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={showAllSeries}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                  >
                    Hiện tất cả
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={hideAllCompetitorSeries}
                    className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    Ẩn tất cả đối thủ
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={showOnlyUserSeries}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                  >
                    Chỉ bạn
                  </button>
                </div>
              </div>

              {/* Toggleable Series Items */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Website của bạn */}
                <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-850 border-brand-200 dark:border-brand-800/80 shadow-2xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showUserSeries}
                    onChange={(e) => setShowUserSeries(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="w-4 h-1.5 rounded-full bg-brand-500 shrink-0 inline-block shadow-xs shadow-brand-500/50"></span>
                  <span className="font-bold text-brand-700 dark:text-brand-300 text-xs">
                    Website của bạn
                  </span>
                </label>

                {/* 2. Đường TB đối thủ */}
                <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-850 border-amber-200 dark:border-amber-800/80 shadow-2xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAvgSeries}
                    onChange={(e) => setShowAvgSeries(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className="w-4 h-1.5 rounded-full bg-amber-500 shrink-0 inline-block shadow-xs shadow-amber-500/50"></span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300 text-xs">
                    Đường TB đối thủ
                  </span>
                </label>

                {/* 3. Each specific competitor series with toggleable checkbox */}
                {actualCompetitors.map((comp, idx) => {
                  const isVisible = visibleCompetitorSeries.includes(comp.url);
                  const color = COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length];
                  const hostname = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

                  return (
                    <label
                      key={comp.url}
                      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                        isVisible
                          ? 'bg-white dark:bg-slate-850 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs font-semibold'
                          : 'bg-slate-100/70 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-750 text-slate-400 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleCompetitorSeries(comp.url)}
                        className="w-3.5 h-3.5 rounded cursor-pointer"
                        style={{ accentColor: color }}
                      />
                      <span
                        className="w-4 h-1.5 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="truncate max-w-[130px]" title={comp.name || hostname}>
                        {comp.name || hostname}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (#{idx + 1})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* D3 Radar Canvas with Smooth Entry and Exit Transitions */}
            <div className="h-[390px] sm:h-[450px] w-full flex flex-col items-center justify-center relative">
              <D3RadarChart
                data={activeDataset}
                actualCompetitors={actualCompetitors}
                visibleCompetitorSeries={visibleCompetitorSeries}
                showUserSeries={showUserSeries}
                showAvgSeries={showAvgSeries}
                viewMode={viewMode}
                competitorColors={COMPETITOR_COLORS}
              />

              {/* Quick helper tag under radar */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xs text-[10px] text-slate-500 font-medium border border-slate-200/60 dark:border-slate-700/60">
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>
                  {viewMode === 'groups'
                    ? `D3 Hiệu ứng chuyển cảnh • ${activeGroups.length} nhóm trụ cột`
                    : `D3 Hiệu ứng chuyển cảnh • ${activeCriteriaList.length} tiêu chí`}
                </span>
              </div>
            </div>
          </div>

          {/* Analytical Scorecard & Focused Insights */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Quick Score Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-850">
                <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 block uppercase tracking-wider">
                  Mức đáp ứng của bạn
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                    {stats.avgUser}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ({activeCriteriaList.length} TC)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block uppercase tracking-wider">
                  Mức TB đối thủ
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {activeCompetitors.length > 0 ? `${stats.avgComp}%` : 'Chưa chọn'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ({activeCompetitors.length} web)
                  </span>
                </div>
              </div>
            </div>

            {/* Comparative Status Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>So sánh phạm vi đang lọc:</span>
                {activeCompetitors.length > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      stats.netDiff >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {stats.netDiff >= 0 ? `Chênh lệch +${stats.netDiff}%` : `Chênh lệch ${stats.netDiff}%`}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Tiêu chí bạn làm tốt hơn đối thủ:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.leadsCount} / {activeCriteriaList.length} tiêu chí
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    Tiêu chí đối thủ đang dẫn trước:
                  </span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {stats.lagsCount} / {activeCriteriaList.length} tiêu chí
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Tiêu chí tương đương / hòa:
                  </span>
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {stats.equalCount} / {activeCriteriaList.length} tiêu chí
                  </span>
                </div>
              </div>
            </div>

            {/* Pillars Highlights */}
            {stats.bestPillar && stats.worstPillar && (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 dark:text-emerald-300 block">
                      Trụ cột ưu thế: {stats.bestPillar.subject}
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Bạn đạt {stats.bestPillar.userScore}%, vượt mức trung bình đối thủ ({stats.bestPillar.competitorAvg}%). Hãy đưa các bằng chứng này làm tiêu điểm trên trang chủ.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 dark:text-amber-300 block">
                      Trụ cột rào cản lớn nhất: {stats.worstPillar.subject}
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Đối thủ đạt {stats.worstPillar.competitorAvg}%, trong khi bạn ở mức {stats.worstPillar.userScore}%. Đây là rào cản chuyển đổi trực tiếp được ưu tiên khắc phục ở Bước 4.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Note on Verification Principle */}
            <div className="text-[11px] text-slate-400 dark:text-slate-400 italic flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Điểm số phản ánh trực tiếp bằng chứng từ URL kiểm tra, tự động tái tính toán theo bộ lọc.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
