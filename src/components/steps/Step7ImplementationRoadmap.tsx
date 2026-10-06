import React, { useState } from 'react';
import { RoadmapData, RoadmapTask10X, TaskStatus } from '../../types';
import { CopyButton } from '../CopyButton';
import { CheckCircle2, Clock, Circle, Flag, Users, Target, Calendar, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface Step7ImplementationRoadmapProps {
  roadmap: any;
  tasks10X?: RoadmapTask10X[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onShowToast: (msg: string) => void;
}

export const Step7ImplementationRoadmap: React.FC<Step7ImplementationRoadmapProps> = ({
  roadmap,
  tasks10X,
  onUpdateTaskStatus,
  onShowToast,
}) => {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Support both 10X flat tasks array and legacy phase tasks
  const allTasks: any[] = tasks10X && tasks10X.length > 0
    ? tasks10X
    : [
        ...(roadmap?.phase1Tasks || []),
        ...(roadmap?.phase2Tasks || []),
        ...(roadmap?.phase3Tasks || []),
      ];

  const filteredTasks = allTasks.filter((t) => {
    const p = t.phaseId || t.phase || 1;
    if (activePhase !== 'all' && p !== activePhase) return false;
    if (departmentFilter !== 'all' && !(t.department || t.owner || '').toLowerCase().includes(departmentFilter.toLowerCase())) return false;
    return true;
  });

  const completedCount = allTasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'in_progress').length;
  const progressPercent = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  const cycleStatus = (task: any) => {
    let next: TaskStatus = 'in_progress';
    if (task.status === 'not_started') next = 'in_progress';
    else if (task.status === 'in_progress') next = 'completed';
    else next = 'not_started';

    onUpdateTaskStatus(task.id, next);
    const label = next === 'completed' ? 'Đã hoàn thành' : next === 'in_progress' ? 'Đang triển khai' : 'Chưa làm';
    onShowToast(`Đã chuyển trạng thái: ${label}`);
  };

  const formatTaskForCopy = (t: any) => {
    const st = t.status === 'completed' ? 'Đã xong' : t.status === 'in_progress' ? 'Đang làm' : 'Chưa làm';
    return `NHIỆM VỤ: ${t.taskName} [Giai đoạn ${t.phaseId || t.phase}] - Trạng thái: ${st}
- Thời gian: ${t.phaseTimeline || t.suggestedTime}
- Vấn đề giải quyết: ${t.gapResolved || t.problem}
- Bộ phận: ${t.department || t.owner}
- Chỉ số theo dõi: ${t.metricToTrack}`;
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Overview & Progress Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Lộ trình triển khai 90 ngày (Roadmap 10X - 3 Giai đoạn)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân chia theo thứ tự ưu tiên: Sửa lỗi tác động nhanh → Chiếm khoảng trống cơ hội → Xây dựng chiều sâu nội dung.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tiến độ tổng thể:</span>
            <div className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
              {progressPercent}% <span className="text-xs text-slate-400 font-normal">({completedCount}/{allTasks.length} việc)</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-750 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 via-brand-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Phase Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div
            onClick={() => setActivePhase(1)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activePhase === 1
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300 mb-1">
              <span>Giai đoạn 1: Sửa lỗi & Tác động nhanh</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                Ngày 1 - 14
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Sửa mâu thuẫn dữ liệu sản phẩm, trang chính sách pháp lý và liên kết bị lỗi.
            </p>
          </div>

          <div
            onClick={() => setActivePhase(2)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activePhase === 2
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300 mb-1">
              <span>Giai đoạn 2: Chiếm khoảng trống cơ hội</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                Ngày 15 - 45
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Báo giá minh bạch, sản xuất video thực tế và bộ câu hỏi trắc nghiệm tự chọn cấu hình.
            </p>
          </div>

          <div
            onClick={() => setActivePhase(3)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activePhase === 3
                ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-brand-700 dark:text-brand-300 mb-1">
              <span>Giai đoạn 3: Xây dựng chiều sâu</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200">
                Ngày 46 - 90
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Cụm bài viết FAQ chuyên môn, theo dõi khách hàng đủ điều kiện (Qualified Leads).
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 text-xs mr-1">Lọc giai đoạn:</span>
          {(['all', 1, 2, 3] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePhase(p)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activePhase === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {p === 'all' ? 'Tất cả 3 giai đoạn' : `Giai đoạn ${p}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Bộ phận:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden"
          >
            <option value="all">Tất cả bộ phận</option>
            <option value="Kỹ thuật">Kỹ thuật</option>
            <option value="Nội dung">Nội dung / SEO</option>
            <option value="Marketing">Marketing / Media</option>
            <option value="Bán hàng">Bán hàng / Pháp chế</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((t, idx) => {
          const isDone = t.status === 'completed';
          const isInProgress = t.status === 'in_progress';
          const phaseNum = t.phaseId || t.phase || 1;

          return (
            <div
              key={t.id || idx}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80'
                  : isInProgress
                  ? 'bg-white dark:bg-slate-850 border-brand-300 dark:border-brand-800/80 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Task Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      phaseNum === 1
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                        : phaseNum === 2
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300'
                    }`}
                  >
                    GĐ {phaseNum} · {t.phaseTimeline || t.suggestedTime}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Phụ trách: {t.department || t.owner}
                  </span>
                </div>

                <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {t.taskName}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Giải quyết vấn đề: </span>
                    <strong className="text-slate-700 dark:text-slate-300">{t.gapResolved || t.problem}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Chỉ số theo dõi: </span>
                    <span className="text-brand-600 dark:text-brand-400 font-semibold">{t.metricToTrack}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => cycleStatus(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : isInProgress
                      ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã xong</span>
                    </>
                  ) : isInProgress ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                      <span>Đang làm</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chưa làm</span>
                    </>
                  )}
                </button>

                <CopyButton
                  textToCopy={formatTaskForCopy(t)}
                  label="Sao chép"
                  onCopied={() => onShowToast(`Đã sao chép nhiệm vụ "${t.taskName}"`)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
