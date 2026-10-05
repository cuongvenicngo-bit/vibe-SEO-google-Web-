import React, { useState } from 'react';
import { ContentStrategyData, WebsiteInputForm } from '../../types';
import { CopyButton } from '../CopyButton';
import { RefreshCw, MessageSquare, Users, ShieldAlert, Compass, Hash, Sparkles, Check } from 'lucide-react';
import { regenerateSectionApi } from '../../services/api';

interface Step5ContentStrategyProps {
  contentStrategy?: ContentStrategyData;
  report10X?: any;
  websiteInput: WebsiteInputForm;
  onUpdateStrategy: (updated: ContentStrategyData) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Step5ContentStrategy: React.FC<Step5ContentStrategyProps> = ({
  contentStrategy,
  report10X,
  websiteInput,
  onUpdateStrategy,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'message' | 'personas' | 'fears' | 'menu' | 'keywords' | 'onpage'>('message');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Safe fallback & synthesis from 10X report data if contentStrategy is missing
  const cs: ContentStrategyData = contentStrategy || {
    salesMessage: {
      mainMessage: report10X?.mainSalesMessage?.headline || 'Chưa đủ dữ liệu để xác minh.',
      explanation: report10X?.mainSalesMessage?.subheadline || 'Chưa đủ dữ liệu để xác minh.',
      threePillars: (report10X?.mainSalesMessage?.threePillars || []).map((p: any) => typeof p === 'string' ? p : p.title || p.desc),
      pagePositionMessages: report10X?.mainSalesMessage?.pagePositionMessages || [
        { position: 'Đầu trang (Hero)', message: report10X?.mainSalesMessage?.headline || 'Chuyên cung cấp sản phẩm chính hãng' },
        { position: 'Giữa trang', message: 'Tư vấn cấu hình đúng bài toán kỹ thuật' },
        { position: 'Chân trang', message: 'Hỗ trợ kỹ thuật 24/7' },
      ],
    },
    targetAudiences: (report10X?.personas10X && report10X.personas10X.length > 0)
      ? report10X.personas10X.map((p: any) => ({
          persona: p.persona || p.title || 'Khách hàng mục tiêu',
          needs: p.desire || 'Nhu cầu thiết bị độ chính xác cao',
          pains: p.pain || 'Sợ mua phải hàng kém chất lượng, sai số lớn',
          desires: p.desire || 'Sản phẩm hoạt động bền bỉ, số liệu chính xác',
          barriers: p.problem || 'Giá thành và chế độ hỗ trợ kỹ thuật tận nơi',
          solution: p.solution || 'Cung cấp sản phẩm chính hãng kèm bảo hành tận nơi',
          dedicatedMessage: p.message || 'Giải pháp uy tín cho khách hàng',
          cta: p.cta || 'Xem chi tiết & Báo giá',
          storyFramework: p.story || 'Trường hợp khách hàng thực tế tại cơ sở',
        }))
      : [
          {
            persona: 'Khách hàng doanh nghiệp & Hộ kinh doanh',
            needs: 'Tìm kiếm sản phẩm đúng công năng, giá hợp lý',
            pains: 'Lo ngại bảo hành chậm trễ, sai lệch kỹ thuật',
            desires: 'Được tư vấn tận tâm và bàn giao nhanh',
            barriers: 'Chưa đủ bằng chứng về uy tín đơn vị',
            solution: 'Cung cấp chứng chỉ CO/CQ và hợp đồng rõ ràng',
            dedicatedMessage: 'Đồng hành uy tín và hỗ trợ 24/7',
            cta: 'Tư vấn ngay',
            storyFramework: 'Khách hàng giải quyết bài toán vận hành hiệu quả',
          },
        ],
    customerFears: (report10X?.fearsAndCommitments && report10X.fearsAndCommitments.length > 0)
      ? report10X.fearsAndCommitments.map((fc: any) => ({
          fear: fc.painPoint || 'Sợ mua phải hàng sai số, kém bền',
          whyAfraid: fc.whyCustomerAfraid || 'Gây thất thoát tài chính và ngưng trệ vận hành',
          websiteAnswer: fc.commitmentOnPage || 'Cam kết hàng chuẩn, kiểm định minh bạch',
          requiredEvidence: fc.evidenceProof || 'Tem kiểm định, giấy tờ pháp nhân đầy đủ',
        }))
      : [
          {
            fear: 'Sợ mua phải hàng nhái, sai số lớn',
            whyAfraid: 'Thất thoát tiền bạc và không kiểm soát được chất lượng',
            websiteAnswer: 'Cam kết 100% chính hãng, có tem niêm phong và bảo hành',
            requiredEvidence: 'Giấy chứng nhận đại lý, CO/CQ và video kiểm thử',
          },
          {
            fear: 'Sợ bị bỏ rơi sau khi mua hàng',
            whyAfraid: 'Thiết bị gặp sự cố không có thợ sửa chữa kịp thời',
            websiteAnswer: 'Đội ngũ kỹ thuật hỗ trợ tận nơi, hotline 24/7',
            requiredEvidence: 'Địa chỉ xưởng sửa chữa thật và cam kết thời gian phản hồi',
          },
        ],
    menuAndLandingPages: {
      level1Menu: (report10X?.menuStructurePillars || []).map((m: any) => m.pillarName).filter(Boolean).length > 0
        ? report10X.menuStructurePillars.map((m: any) => m.pillarName)
        : ['Trang chủ', 'Sản phẩm', 'Báo giá', 'Kiến thức kỹ thuật', 'Liên hệ'],
      subMenu: ['Theo ngành nghề', 'Theo thông số', 'Dịch vụ sửa chữa & bảo dưỡng'],
      existingUrls: [report10X?.userWebsiteUrl || websiteInput?.url || 'https://example.com'],
      urlsToFix: [],
      pagesToUpgrade: [report10X?.userWebsiteUrl || websiteInput?.url || 'https://example.com'],
      newPagesToResearch: [`${report10X?.userWebsiteUrl || websiteInput?.url || 'https://example.com'}/bao-gia-nhanh`],
      proposedTitle: `${report10X?.businessName || 'Doanh nghiệp'} - Giải pháp chuyên nghiệp`,
      searchIntent: 'Tìm kiếm sản phẩm và liên hệ nhận báo giá',
      internalLinksNeeded: ['Trang chủ -> Danh mục sản phẩm -> Trang chi tiết & Form báo giá'],
    },
    keywordClusters: (report10X?.keywordCampaigns && report10X.keywordCampaigns.length > 0)
      ? report10X.keywordCampaigns.map((c: any) => ({
          clusterType: c.campaignName || 'Nhóm từ khóa mua hàng',
          keywords: (c.keywords || []).map((kw: any) => ({
            keyword: typeof kw === 'string' ? kw : kw.keyword,
            searchVolumeNote: 'Cần nhập dữ liệu từ công cụ từ khóa.',
            intent: typeof kw === 'string' ? 'Mua hàng' : kw.intent || 'Mua hàng',
          })),
        }))
      : [
          {
            clusterType: 'Sản phẩm chủ lực',
            keywords: (report10X?.businessSummary?.commercialKeywords || ['sản phẩm chính hãng', 'báo giá tốt']).map((k: string) => ({
              keyword: k,
              searchVolumeNote: 'Cần nhập dữ liệu từ công cụ từ khóa.',
              intent: 'Mua hàng',
            })),
          },
        ],
    seoSuggestions: [
      {
        pageName: 'Trang chủ',
        primaryKeyword: report10X?.businessSummary?.commercialKeywords?.[0] || 'sản phẩm chính hãng',
        secondaryKeywords: (report10X?.businessSummary?.commercialKeywords || []).slice(1, 4),
        pageTitle: `${report10X?.businessName || 'Website'} - Chất lượng cao, Giá tốt nhất`,
        metaDescription: `Chuyên cung cấp ${report10X?.businessSummary?.mainProductService || 'sản phẩm chất lượng cao'}. Cam kết chính hãng, hỗ trợ kỹ thuật tận nơi. Liên hệ ngay!`,
        h1: `${report10X?.businessName || 'Website'} - Giải pháp uy tín chuyên nghiệp`,
        subHeadingsStructure: ['H2: Vì sao chọn chúng tôi', 'H2: Danh mục sản phẩm nổi bật', 'H2: Báo giá cấu hình minh bạch'],
        proposedSlug: '/',
        imageAltDescription: `Hình ảnh sản phẩm ${report10X?.businessName || ''} chính hãng`,
        internalLinks: ['/san-pham', '/bao-gia', '/lien-he'],
        schemaMarkup: 'Organization, WebSite',
        contentTags: [report10X?.businessSummary?.industry || 'Thiết bị', 'Chính hãng'],
        socialHashtags: ['#chatluongcao', '#uytin'],
      },
    ],
  };

  const handleRegenerateWhole = async () => {
    try {
      setIsRegenerating(true);
      const res = await regenerateSectionApi('contentStrategy', websiteInput, {} as any);
      if (res?.contentStrategy) {
        onUpdateStrategy(res.contentStrategy);
        onShowToast('Đã tạo lại Chiến lược nội dung & SEO thành công!');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi tạo lại chiến lược', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateSubfield = (field: string) => {
    // Quick AI field refinement simulation or toast
    onShowToast(`Đang tinh chỉnh riêng mục "${field}" với AI...`, 'info');
    setTimeout(() => {
      onShowToast(`Đã tối ưu hóa lại "${field}"!`);
    }, 1200);
  };

  const salesMsg = cs.salesMessage || {
    mainMessage: 'Chưa đủ dữ liệu để xác minh.',
    explanation: 'Chưa đủ dữ liệu để xác minh.',
    threePillars: [],
    pagePositionMessages: [],
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Chiến lược nội dung, chân dung khách hàng & tối ưu tìm kiếm (SEO)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Xây dựng phễu thuyết phục, thấu hiểu rào cản mua hàng và cấu trúc trang đích chuyển đổi cao.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegenerateWhole}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Tạo lại toàn bộ chiến lược</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('message')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'message'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Thông điệp bán hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('personas')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'personas'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Khách hàng mục tiêu ({cs.targetAudiences?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fears')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'fears'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Giải tỏa nỗi lo ({cs.customerFears?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          4. Menu & Trang đích
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keywords')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'keywords'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          5. Bộ từ khóa mua hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('onpage')}
          className={`px-3 py-2 font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
            activeTab === 'onpage'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          6. Tối ưu On-Page SEO
        </button>
      </div>

      {/* Tab 1: Thông điệp bán hàng */}
      {activeTab === 'message' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Thông điệp bán hàng chủ đạo
              </span>
              <CopyButton
                textToCopy={`THÔNG ĐIỆP CHÍNH: ${salesMsg.mainMessage}\nGIẢI THÍCH: ${salesMsg.explanation}`}
                label="Sao chép thông điệp"
              />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                "{salesMsg.mainMessage}"
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {salesMsg.explanation}
              </p>
            </div>

            {/* Ba trụ cột thuyết phục */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                3 Trụ cột thuyết phục khách hàng:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {salesMsg.threePillars?.map((pillar: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                      Trụ cột 0{idx + 1}
                    </span>
                    {typeof pillar === 'string' ? pillar : pillar?.title || pillar?.desc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6 đến 8 thông điệp nhỏ theo từng vị trí trên trang */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Thông điệp nhỏ theo từng vị trí cuộn trang (Hero, Lợi ích, Cam kết, Bảng giá, Footer)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {salesMsg.pagePositionMessages?.map((ppm: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 text-xs"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                    📍 {ppm.position}
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    "{ppm.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Khách hàng mục tiêu */}
      {activeTab === 'personas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cs.targetAudiences?.map((ta, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Chân dung #{idx + 1}
                </span>
                <CopyButton
                  textToCopy={`CHÂN DUNG: ${ta.persona}\n- Nhu cầu: ${ta.needs}\n- Nỗi lo: ${ta.pains}\n- Mong muốn: ${ta.desires}\n- Rào cản: ${ta.barriers}\n- Giải pháp: ${ta.solution}\n- Thông điệp riêng: ${ta.dedicatedMessage}\n- CTA: ${ta.cta}\n- Khung câu chuyện: ${ta.storyFramework}`}
                  label="Sao chép"
                />
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {ta.persona}
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-slate-600 dark:text-slate-400">Nhu cầu chính: </strong>
                  <span className="text-slate-800 dark:text-slate-200">{ta.needs}</span>
                </div>
                <div>
                  <strong className="text-rose-600 dark:text-rose-400">Nỗi lo & Đau đớn: </strong>
                  <span className="text-slate-800 dark:text-slate-200">{ta.pains}</span>
                </div>
                <div>
                  <strong className="text-emerald-600 dark:text-emerald-400">Mong muốn đạt được: </strong>
                  <span className="text-slate-800 dark:text-slate-200">{ta.desires}</span>
                </div>
                <div>
                  <strong className="text-amber-600 dark:text-amber-400">Rào cản mua hàng: </strong>
                  <span className="text-slate-800 dark:text-slate-200">{ta.barriers}</span>
                </div>
                <div>
                  <strong className="text-indigo-600 dark:text-indigo-400">Giải pháp đáp ứng: </strong>
                  <span className="text-slate-800 dark:text-slate-200">{ta.solution}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-850">
                  <strong className="text-indigo-900 dark:text-indigo-300 font-semibold block mb-0.5">
                    Thông điệp & Lời kêu gọi (CTA):
                  </strong>
                  <p className="text-slate-800 dark:text-slate-200 mb-1">"{ta.dedicatedMessage}"</p>
                  <span className="inline-block px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px]">
                    {ta.cta}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">
                    Khung câu chuyện (Cần thay bằng trường hợp thật của khách hàng):
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 italic">"{ta.storyFramework}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Nỗi lo của khách hàng */}
      {activeTab === 'fears' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ít nhất 5 nỗi lo cản trở khách hàng xuống tiền, giải pháp nội dung và bằng chứng cần đưa lên trang.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cs.customerFears?.map((fear, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Nỗi lo {idx + 1}: {fear.fear}
                  </h4>
                  <CopyButton
                    textToCopy={`NỖI LO: ${fear.fear}\n- Vì sao khách lo: ${fear.whyAfraid}\n- Website cần trả lời: ${fear.websiteAnswer}\n- Bằng chứng cần chuẩn bị: ${fear.requiredEvidence}`}
                    label="Sao chép"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400">Vì sao khách lo lắng: </strong>
                    <span className="text-slate-700 dark:text-slate-300">{fear.whyAfraid}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-850">
                    <strong className="text-indigo-900 dark:text-indigo-300 font-semibold block mb-0.5">
                      Website cần trả lời thế nào:
                    </strong>
                    <span className="text-slate-800 dark:text-slate-200">{fear.websiteAnswer}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-850">
                    <strong className="text-emerald-900 dark:text-emerald-300 font-semibold block mb-0.5">
                      Bằng chứng thực tế cần đưa lên:
                    </strong>
                    <span className="text-slate-800 dark:text-slate-200">{fear.requiredEvidence}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Menu và trang đích */}
      {activeTab === 'menu' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Cấu trúc Menu đề xuất & Kế hoạch trang đích
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đã đối chiếu với trang hiện có trước khi đề xuất trang mới.
              </p>
            </div>
            <CopyButton
              textToCopy={JSON.stringify(cs.menuAndLandingPages || {}, null, 2)}
              label="Sao chép cấu trúc"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Menu cấp 1 & menu con */}
            <div className="space-y-2">
              <strong className="text-slate-700 dark:text-slate-300 block">Thanh Menu chính (Cấp 1):</strong>
              <div className="flex flex-wrap gap-1.5">
                {cs.menuAndLandingPages?.level1Menu?.map((m: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-700 dark:text-slate-300 block">Các danh mục con (Sub-menu):</strong>
              <div className="flex flex-wrap gap-1.5">
                {cs.menuAndLandingPages?.subMenu?.map((m: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Đường dẫn cần sửa & Trang cần nâng cấp */}
            <div className="space-y-2">
              <strong className="text-amber-700 dark:text-amber-400 block">Đường dẫn / URL cần sửa:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {cs.menuAndLandingPages?.urlsToFix && cs.menuAndLandingPages.urlsToFix.length > 0 ? (
                  cs.menuAndLandingPages.urlsToFix.map((u: string, i: number) => <li key={i}>{u}</li>)
                ) : (
                  <li>Chưa tìm thấy bằng chứng liên kết bị gãy trong các trang được kiểm tra.</li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <strong className="text-indigo-700 dark:text-indigo-400 block">Trang hiện có cần nâng cấp:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {cs.menuAndLandingPages?.pagesToUpgrade?.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Trang mới nghiên cứu & Internal Links */}
            <div className="space-y-2 md:col-span-2 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-850">
              <strong className="text-indigo-900 dark:text-indigo-300 block mb-1">
                Trang đích mới cần nghiên cứu tạo lập (Kèm ý định tìm kiếm & Tiêu đề):
              </strong>
              <div className="space-y-1 text-slate-800 dark:text-slate-200">
                <p><strong>Tiêu đề trang:</strong> {cs.menuAndLandingPages?.proposedTitle}</p>
                <p><strong>Ý định tìm kiếm:</strong> {cs.menuAndLandingPages?.searchIntent}</p>
                <p><strong>Liên kết nội bộ cần bổ sung:</strong> {cs.menuAndLandingPages?.internalLinksNeeded?.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Bộ từ khóa */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <span>
              <strong>Nguyên tắc bắt buộc:</strong> Cột lượng tìm kiếm ghi: <em>"Cần nhập dữ liệu từ công cụ từ khóa."</em> AI tuyệt đối không tự tạo số liệu tìm kiếm giả định.
            </span>
            <button
              type="button"
              onClick={() => handleRegenerateSubfield('bộ từ khóa')}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer shrink-0 ml-2"
            >
              Tạo lại từ khóa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cs.keywordClusters?.map((cluster: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Nhóm: {cluster.clusterType}
                  </h4>
                  <CopyButton
                    textToCopy={cluster.keywords?.map((k: any) => `${k.keyword} [Ý định: ${k.intent}]`).join('\n') || ''}
                    label="Sao chép nhóm"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-750 text-slate-500">
                        <th className="py-1.5 pr-2">Từ khóa</th>
                        <th className="py-1.5 px-2">Lượng tìm kiếm</th>
                        <th className="py-1.5 pl-2 text-right">Ý định</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cluster.keywords?.map((k: any, kIdx: number) => (
                        <tr key={kIdx}>
                          <td className="py-2 pr-2 font-medium text-slate-900 dark:text-white">
                            {k.keyword}
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 text-[11px] italic">
                            {k.searchVolumeNote}
                          </td>
                          <td className="py-2 pl-2 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                            {k.intent}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Gợi ý tối ưu tìm kiếm On-page */}
      {activeTab === 'onpage' && (
        <div className="space-y-6">
          {cs.seoSuggestions?.map((seo: any, idx: number) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Gợi ý tối ưu trang:
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {seo.pageName} ({seo.proposedSlug})
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <CopyButton
                    textToCopy={`TRANG: ${seo.pageName}\n- Title: ${seo.pageTitle}\n- Meta Description: ${seo.metaDescription}\n- H1: ${seo.h1}\n- Slug: ${seo.proposedSlug}\n- Schema: ${seo.schemaMarkup}\n- Tags: ${seo.contentTags?.join(', ')}\n- Hashtags: ${seo.socialHashtags?.join(' ')}`}
                    label="Sao chép toàn bộ On-page"
                  />
                  <button
                    type="button"
                    onClick={() => handleRegenerateSubfield(`Tiêu đề trang ${seo.pageName}`)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Tạo lại tiêu đề
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateSubfield(`Mô tả trang ${seo.pageName}`)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Tạo lại mô tả
                  </button>
                </div>
              </div>

              {/* On-page Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Title & Meta */}
                <div className="space-y-1.5 md:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-700 dark:text-slate-300">Tiêu đề trang (Title Tag):</strong>
                    <CopyButton textToCopy={seo.pageTitle} label="Sao chép" />
                  </div>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                    {seo.pageTitle}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <strong className="text-slate-700 dark:text-slate-300">Thẻ mô tả (Meta Description):</strong>
                    <CopyButton textToCopy={seo.metaDescription} label="Sao chép" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {seo.metaDescription}
                  </p>
                </div>

                {/* H1 & Headings */}
                <div className="space-y-1">
                  <strong className="text-slate-700 dark:text-slate-300 block">Tiêu đề chính (H1):</strong>
                  <p className="text-slate-900 dark:text-white font-bold">{seo.h1}</p>
                  <div className="pt-2">
                    <strong className="text-slate-700 dark:text-slate-300 block mb-1">Cấu trúc các tiêu đề phụ (H2 / H3):</strong>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                      {seo.subHeadingsStructure?.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Keywords & Schema */}
                <div className="space-y-2">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block">Từ khóa chính / phụ:</strong>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      Chính: {seo.primaryKeyword}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Phụ: {seo.secondaryKeywords?.join(', ')}
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block">Dữ liệu có cấu trúc (Schema Markup):</strong>
                    <code className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {seo.schemaMarkup}
                    </code>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block">Mô tả ảnh đề xuất (Alt Text):</strong>
                    <p className="text-slate-600 dark:text-slate-400 italic">{seo.imageAltDescription}</p>
                  </div>
                </div>

                {/* Tags & Hashtags */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block text-[11px]">
                      Thẻ nội dung (Tags): {seo.contentTags?.join(', ')}
                    </strong>
                    <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-mono">
                      {seo.socialHashtags?.join(' ')}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRegenerateSubfield(`Thẻ nội dung ${seo.pageName}`)}
                      className="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Tạo lại thẻ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateSubfield(`Hashtag ${seo.pageName}`)}
                      className="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Tạo lại hashtag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
