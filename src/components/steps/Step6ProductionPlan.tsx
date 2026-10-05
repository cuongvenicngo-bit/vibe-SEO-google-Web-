import React, { useState } from 'react';
import { ProductionPlanData, WebsiteInputForm } from '../../types';
import { CopyButton } from '../CopyButton';
import { RefreshCw, Image, Camera, Video, DollarSign, PhoneCall, FormInput, ShieldCheck, Gift, Check, Sparkles } from 'lucide-react';
import { regenerateSectionApi } from '../../services/api';

interface Step6ProductionPlanProps {
  productionPlan: any;
  websiteInput: WebsiteInputForm;
  report10X?: any;
  onUpdatePlan: (updated: ProductionPlanData) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Step6ProductionPlan: React.FC<Step6ProductionPlanProps> = ({
  productionPlan,
  websiteInput,
  report10X,
  onUpdatePlan,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'photos' | 'videos' | 'pricing' | 'buttons' | 'forms' | 'credibility'>('banners');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 10X data unification
  const banners = report10X?.bannerProduction || productionPlan?.banners || [];
  const photos = report10X?.photoShotlists10X || productionPlan?.photoShotlist || [];
  const videos = report10X?.videoScripts10X || productionPlan?.videoScripts || [];
  const pricing = report10X?.pricingPackages10X || productionPlan?.pricingTable || [];
  const buttons = report10X?.scrollCtaButtons || productionPlan?.contactButtons || [];
  const forms = report10X?.forms10X || productionPlan?.forms || [];
  const credibility = report10X?.credibilityChecklist || [];
  const gifts = report10X?.funnelGifts || [];

  const handleRegenerateWhole = async () => {
    try {
      setIsRegenerating(true);
      const res = await regenerateSectionApi('productionPlan', websiteInput, {} as any);
      if (res?.productionPlan) {
        onUpdatePlan(res.productionPlan);
        onShowToast('Đã tạo lại Kế hoạch sản xuất thành công!', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi tạo lại kế hoạch sản xuất', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Kế hoạch sản xuất Design, Media & Biểu mẫu chuyển đổi (10X Studio)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bàn giao đầy đủ cho thiết kế, media quay chụp, kinh doanh và kỹ thuật lập trình website.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegenerateWhole}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Tạo lại kế hoạch</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-medium border border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'banners'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>5 Banner quảng cáo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Danh sách ảnh cần chụp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'videos'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>4 Kịch bản video</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Bảng giá minh bạch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buttons')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'buttons'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Vị trí nút CTA cuộn trang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FormInput className="w-3.5 h-3.5" />
          <span>3 Biểu mẫu chuyển đổi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credibility')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'credibility'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Checklist uy tín & Quà phễu</span>
        </button>
      </div>

      {/* Tab 1: Banners */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b: any, idx: number) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Banner #{idx + 1} · {b.position}
                  </span>
                  <CopyButton
                    textToCopy={`BANNER ${b.position}\n- Tiêu đề: ${b.title}\n- Phụ đề: ${b.subtitle}\n- Yêu cầu ảnh: ${b.imageNeeded || b.imageSpec}\n- Nút: ${b.buttonText}`}
                    label="Sao chép"
                  />
                </div>

                {/* Banner Mockup Card Preview */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-inner space-y-2">
                  <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider block">
                    [Mô phỏng hiển thị trên Website]
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {b.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {b.subtitle}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-bold text-xs shadow-xs">
                      {b.buttonText} →
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                    <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Hình ảnh cần sử dụng:</strong>
                    <span className="text-slate-600 dark:text-slate-400">{b.imageNeeded || b.imageSpec}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Danh sách ảnh cần chụp */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Các nhóm hình ảnh thực tế bắt buộc để chứng minh năng lực và phá vỡ hoài nghi của người mua.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((group: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Nhóm #{idx + 1}: {group.category || group.purpose}
                  </h4>
                  <CopyButton
                    textToCopy={`NHÓM ẢNH: ${group.category || group.purpose}\n- Mục đích: ${group.purpose}\n- Danh sách ảnh: ${group.shots?.join('; ')}`}
                    label="Sao chép"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  {group.purpose && (
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Mục tiêu thể hiện:</strong> {group.purpose}
                    </p>
                  )}
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-1">Danh sách từng ảnh cần chụp:</strong>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                      {group.shots?.map((s: string, sIdx: number) => (
                        <li key={sIdx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {group.cameraAngle && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 block">Góc chụp:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{group.cameraAngle}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 block">Vị trí đặt:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{group.placement}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Kịch bản video */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {videos.map((v: any, idx: number) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {v.videoNumber || `Video #${idx + 1}`} · {v.context || v.duration}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {v.title}
                  </h4>
                  {v.goal && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Mục tiêu: {v.goal} | Vị trí: {v.placement || v.placementNote}
                    </p>
                  )}
                </div>
                <CopyButton
                  textToCopy={`KỊCH BẢN: ${v.title}\n${(v.timeline || v.timelineScenes)?.map((s: any) => `[${s.timestamp}] ${s.description || s.visual}`).join('\n')}`}
                  label="Sao chép kịch bản"
                />
              </div>

              {/* Timeline Scenes */}
              <div className="space-y-2 text-xs">
                <strong className="text-slate-700 dark:text-slate-300 block">
                  Phân cảnh chi tiết theo mốc thời gian:
                </strong>
                <div className="space-y-2">
                  {(v.timeline || v.timelineScenes)?.map((sc: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex flex-col sm:flex-row items-start gap-3"
                    >
                      <span className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs shrink-0">
                        {sc.timestamp}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-slate-800 dark:text-slate-200">
                          {sc.description || sc.visual}
                        </p>
                        {sc.audioScript && (
                          <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                            <strong className="text-slate-500">Lời thoại: </strong> "{sc.audioScript}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Bảng giá */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
            <strong>Nguyên tắc bắt buộc:</strong> Không tự điền giá giả định. Ô giá bắt buộc ghi: <em>"Cần điền giá thật."</em> để bảo đảm tính chuẩn xác.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricing.map((pkg: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Gói #{idx + 1}
                    </span>
                    <CopyButton
                      textToCopy={`GÓI: ${pkg.packageConfig || pkg.package}\n- Giá: ${pkg.price}\n- Bao gồm: ${Array.isArray(pkg.included) ? pkg.included.join(', ') : pkg.included}\n- Chưa bao gồm: ${Array.isArray(pkg.notIncluded) ? pkg.notIncluded.join(', ') : pkg.notIncluded}`}
                      label="Sao chép"
                    />
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {pkg.packageConfig || pkg.package}
                  </h4>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {pkg.price}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400 block mb-0.5">✓ Đã bao gồm:</strong>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {Array.isArray(pkg.included) ? pkg.included.join('; ') : pkg.included}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-500 block mb-0.5">✕ Chưa bao gồm:</strong>
                      <p className="text-slate-500 text-xs">
                        {Array.isArray(pkg.notIncluded) ? pkg.notIncluded.join('; ') : pkg.notIncluded}
                      </p>
                    </div>

                    {pkg.dataToVerify && (
                      <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400">
                        <strong>Dữ liệu cần xác minh:</strong> {pkg.dataToVerify}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  {pkg.ctaText || 'Nhận báo giá chi tiết'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Nút liên hệ */}
      {activeTab === 'buttons' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Vị trí nút liên hệ dọc hành trình đọc trang (Scroll CTA Buttons)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bố trí xuất hiện đúng lúc người dùng có thắc mắc hoặc sẵn sàng chuyển đổi.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-750 text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Vị trí cuộn trang</th>
                  <th className="py-2.5 px-3 font-semibold">Tâm lý khách hàng</th>
                  <th className="py-2.5 px-3 font-semibold">Nội dung nút (Label)</th>
                  <th className="py-2.5 pl-3 font-semibold">Hành động kích hoạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {buttons.map((btn: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-bold text-slate-800 dark:text-slate-200">
                      📍 {btn.position || btn.scrollPosition}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {btn.customerMindset || 'Tìm hiểu thông tin'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]">
                        {btn.buttonText || btn.label}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-700 dark:text-slate-300">
                      {btn.buttonType || btn.ctaAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Biểu mẫu */}
      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {forms.map((form: any, idx: number) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Biểu mẫu #{idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {form.position || 'Trang đích'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {form.title || form.name}
                </h4>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 block">Các trường thu thập:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {typeof form.fields === 'string' ? form.fields : form.fields?.map((f: any) => f.label).join(' | ')}
                  </p>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p><strong>Nút bấm:</strong> {form.submitButtonText}</p>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    <strong>Cam kết:</strong> {form.commitment || form.postSubmitCommitment}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onShowToast(`Mô phỏng kích hoạt: ${form.title || form.name}`)}
                className="w-full py-2 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 cursor-pointer transition-colors"
              >
                Xem trước biểu mẫu
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Checklist uy tín & Quà phễu */}
      {activeTab === 'credibility' && (
        <div className="space-y-6">
          {/* Credibility items */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Checklist xây dựng uy tín & Bằng chứng pháp lý (Credibility Checklist)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-750 text-slate-500">
                    <th className="py-2 pr-3">Hạng mục uy tín</th>
                    <th className="py-2 px-3">Ảnh cần chụp</th>
                    <th className="py-2 px-3">Video cần quay</th>
                    <th className="py-2 pl-3">Vị trí gắn trên web</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {credibility.map((c: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3 font-bold text-slate-800 dark:text-slate-200">
                        {c.item}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {c.photoToTake}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {c.videoToShoot}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-500 font-mono text-[11px]">
                        {c.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Funnel Gifts */}
          {gifts.length > 0 && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                Quà tặng dẫn dắt theo phễu (Lead Magnets & Conversion Gifts)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {gifts.map((g: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      Tầng phễu: {g.stage}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white pt-1">{g.gift}</h5>
                    <p className="text-slate-600 dark:text-slate-300">Khách hàng để lại: <strong>{g.customerExchanges}</strong></p>
                    <p className="text-[11px] text-slate-500">{g.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
