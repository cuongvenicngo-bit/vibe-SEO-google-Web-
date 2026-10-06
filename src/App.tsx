import React, { useState, useEffect } from 'react';
import { AnalysisReport10X, WebsiteInputForm, RoadmapTask10X, TaskStatus, StepStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useToast } from './hooks/useToast';
import { analyzeWebsiteApi, regenerateSectionApi, getSavedGeminiApiKey } from './services/api';
import { checkSubscriptionStatusApi } from './services/subscriptionApi';
import { CustomerSubscriptionStatus } from './types/subscription';
import { AppHeader } from './components/AppHeader';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { TrialModal } from './components/TrialModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { StepWrapper } from './components/StepWrapper';
import { Step1WebsiteInput } from './components/steps/Step1WebsiteInput';
import { Step2CompetitorProfiles } from './components/steps/Step2CompetitorProfiles';
import { Step3CriteriaComparison } from './components/steps/Step3CriteriaComparison';
import { Step4OpportunityGaps } from './components/steps/Step4OpportunityGaps';
import { Step5ContentStrategy } from './components/steps/Step5ContentStrategy';
import { Step6ProductionPlan } from './components/steps/Step6ProductionPlan';
import { Step7ImplementationRoadmap } from './components/steps/Step7ImplementationRoadmap';
import { Step8ExportAndActions } from './components/steps/Step8ExportAndActions';
import { ToastNotification } from './components/ToastNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DarkSakuraPetals } from './components/DarkSakuraPetals';
import { Globe, ShieldCheck, Sparkles, CheckCircle2, TrendingUp, Layers, Rocket } from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('web360_theme', 'light');
  // Language state for global commercial edition
  const [language, setLanguage] = useLocalStorage<'vi' | 'en'>('web360_lang', 'vi');

  // Input state
  const [inputData, setInputData] = useLocalStorage<WebsiteInputForm>('web360_input_v1', {
    url: '',
    productService: '',
    location: '',
    mainKeyword: '',
    manualCompetitors: [],
    pastedContent: '',
  });

  // Report state
  const [report, setReport, clearReport] = useLocalStorage<AnalysisReport10X | null>('web360_report_v1', null);

  // Loading & progress states
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Section regenerating states
  const [isRegeneratingCompetitors, setIsRegeneratingCompetitors] = useState(false);
  const [isRegeneratingCriteria, setIsRegeneratingCriteria] = useState(false);
  const [isRegeneratingOpportunities, setIsRegeneratingOpportunities] = useState(false);

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Gemini API Key Modal State
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState<boolean>(() => !!getSavedGeminiApiKey());

  // Subscription & SePay Modal States
  const [subscriptionStatus, setSubscriptionStatus] = useState<CustomerSubscriptionStatus | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Load and refresh subscription status
  const refreshSubscriptionStatus = async () => {
    try {
      const status = await checkSubscriptionStatusApi();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Failed to load subscription status:', err);
    }
  };

  useEffect(() => {
    refreshSubscriptionStatus();
  }, []);

  // Apply dark mode class to html document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Simulate smooth progress stages during analysis
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setProgressStage(0);
      interval = setInterval(() => {
        setProgressStage((prev) => (prev < 5 ? prev + 1 : prev));
      }, 3000);
    } else {
      setProgressStage(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-normalize older reports cached in localStorage that may lack contentStrategy
  useEffect(() => {
    if (report && !report.contentStrategy) {
      const salesHeadline = report.mainSalesMessage?.headline || report.businessSummary?.mainProductService || 'Giải pháp uy tín & chất lượng';
      const salesSub = report.mainSalesMessage?.subheadline || 'Tư vấn cấu hình chuẩn xác, cam kết hàng chính hãng';
      setReport({
        ...report,
        contentStrategy: {
          salesMessage: {
            mainMessage: salesHeadline,
            explanation: salesSub,
            threePillars: (report.mainSalesMessage?.threePillars || []).map((p: any) => (typeof p === 'string' ? p : p.title || p.desc)),
            pagePositionMessages: (report.mainSalesMessage as any)?.pagePositionMessages || [
              { position: 'Đầu trang (Hero)', message: salesHeadline },
              { position: 'Giữa trang', message: 'Tư vấn giải pháp và cấu hình tối ưu' },
              { position: 'Chân trang', message: 'Hỗ trợ kỹ thuật và bảo hành 24/7' },
            ],
          },
          targetAudiences: (report.personas10X || []).map((p: any) => ({
            persona: p.persona || p.title || 'Khách hàng mục tiêu',
            needs: p.desire || 'Nhu cầu thiết bị độ chính xác cao',
            pains: p.pain || 'Sợ mua phải hàng kém chất lượng',
            desires: p.desire || 'Sản phẩm hoạt động bền bỉ chính xác',
            barriers: p.problem || 'Giá thành và bảo hành',
            solution: p.solution || 'Cung cấp sản phẩm chính hãng có bảo hành',
            dedicatedMessage: p.message || 'Giải pháp tin cậy cho bạn',
            cta: p.cta || 'Xem chi tiết & Báo giá',
            storyFramework: p.story || 'Khách hàng thực tế tại cơ sở',
          })),
          customerFears: (report.fearsAndCommitments || []).map((fc: any) => ({
            fear: fc.painPoint || 'Sợ mua phải hàng sai số, kém bền',
            whyAfraid: fc.whyCustomerAfraid || 'Gây thất thoát tài chính',
            websiteAnswer: fc.commitmentOnPage || 'Cam kết hàng chuẩn, kiểm định',
            requiredEvidence: fc.evidenceProof || 'Tem kiểm định CO/CQ',
          })),
          menuAndLandingPages: {
            level1Menu: report.menuStructurePillars?.map((m: any) => m.pillarName) || ['Trang chủ', 'Sản phẩm', 'Báo giá', 'Liên hệ'],
            subMenu: ['Theo ngành nghề', 'Theo thông số'],
            existingUrls: [report.userWebsiteUrl],
            urlsToFix: [],
            pagesToUpgrade: [report.userWebsiteUrl],
            newPagesToResearch: [`${report.userWebsiteUrl}/bao-gia-nhanh`],
            proposedTitle: `${report.businessName} - Giải pháp chuyên nghiệp`,
            searchIntent: 'Mua hàng và tìm kiếm giải pháp kỹ thuật',
            internalLinksNeeded: ['Trang chủ -> Sản phẩm -> Báo giá'],
          },
          keywordClusters: [
            {
              clusterType: 'Từ khóa thương mại',
              keywords: (report.businessSummary?.commercialKeywords || ['sản phẩm chính hãng']).map((k: string) => ({
                keyword: k,
                searchVolumeNote: 'Cần nhập dữ liệu từ công cụ từ khóa.',
                intent: 'Mua hàng',
              })),
            },
          ],
          seoSuggestions: [
            {
              pageName: 'Trang chủ',
              primaryKeyword: report.businessSummary?.commercialKeywords?.[0] || 'sản phẩm chính hãng',
              secondaryKeywords: (report.businessSummary?.commercialKeywords || []).slice(1, 4),
              pageTitle: `${report.businessName} - Chính Hãng Giá Tốt`,
              metaDescription: `Chuyên cung cấp ${report.businessSummary?.mainProductService}. Cam kết chính hãng.`,
              h1: `${report.businessName} - Giải pháp uy tín chuyên nghiệp`,
              subHeadingsStructure: ['H2: Vì sao chọn chúng tôi', 'H2: Danh mục nổi bật', 'H2: Báo giá minh bạch'],
              proposedSlug: '/',
              imageAltDescription: `Hình ảnh sản phẩm ${report.businessName}`,
              internalLinks: ['/san-pham', '/bao-gia', '/lien-he'],
              schemaMarkup: 'Organization, WebSite',
              contentTags: [report.businessSummary?.industry || 'Thiết bị', 'Chính hãng'],
              socialHashtags: ['#chatluong', '#uytin'],
            },
          ],
        },
      });
    }
  }, [report, setReport]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
    showToast(language === 'vi' ? 'Switched to English interface' : 'Đã chuyển sang giao diện Tiếng Việt');
  };

  const handleClearAllData = () => {
    clearReport();
    setInputData({
      url: '',
      productService: '',
      location: '',
      mainKeyword: '',
      manualCompetitors: [],
      pastedContent: '',
    });
    setErrorMessage(null);
    showToast('Đã xóa sạch dữ liệu và đặt lại ứng dụng.');
  };

  const handleStartAnalysis = async () => {
    if (!inputData.url.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      showToast('Đang phân tích website mục tiêu và tìm kiếm đối thủ 10X...', 'info');
      const result = await analyzeWebsiteApi(inputData);
      setReport(result);
      showToast('Phân tích website 360 hoàn tất thành công!', 'success');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const msg = err.message || 'Không thể hoàn thành phân tích. Vui lòng kiểm tra lại URL hoặc thử lại.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Regeneration helpers for individual steps
  const handleRegenerateCompetitors = async () => {
    if (!report) return;
    try {
      setIsRegeneratingCompetitors(true);
      const res = await regenerateSectionApi('competitors', inputData, report);
      if (res?.competitorsFound && res?.competitorProfiles) {
        setReport({
          ...report,
          competitorsFound: res.competitorsFound,
          competitorProfiles: res.competitorProfiles,
        });
        showToast('Đã tạo lại danh sách hồ sơ đối thủ thành công!');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo lại hồ sơ đối thủ', 'error');
    } finally {
      setIsRegeneratingCompetitors(false);
    }
  };

  const handleRegenerateCriteria = async () => {
    if (!report) return;
    try {
      setIsRegeneratingCriteria(true);
      const res = await regenerateSectionApi('criteria', inputData, report);
      if (res?.criteriaComparison) {
        setReport({
          ...report,
          criteriaComparison: res.criteriaComparison,
        });
        showToast('Đã tạo lại bảng 29-35 tiêu chí so sánh!');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo lại tiêu chí', 'error');
    } finally {
      setIsRegeneratingCriteria(false);
    }
  };

  const handleRegenerateOpportunities = async () => {
    if (!report) return;
    try {
      setIsRegeneratingOpportunities(true);
      const res = await regenerateSectionApi('opportunities', inputData, report);
      if (res?.opportunityGaps) {
        setReport({
          ...report,
          opportunityGaps10X: res.opportunityGaps,
          opportunityGaps: res.opportunityGaps,
        });
        showToast('Đã tạo lại danh sách khoảng trống cơ hội!');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo lại cơ hội', 'error');
    } finally {
      setIsRegeneratingOpportunities(false);
    }
  };

  // Add opportunity to roadmap
  const handleAddToRoadmap = (newTask: RoadmapTask10X) => {
    if (!report) return;
    const currentTasks = report.roadmapTasks10X || [];
    setReport({
      ...report,
      roadmapTasks10X: [newTask, ...currentTasks],
    });
  };

  // Update task status in roadmap
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!report) return;
    const updatedTasks = (report.roadmapTasks10X || []).map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setReport({
      ...report,
      roadmapTasks10X: updatedTasks,
    });
  };

  // Determine status for each step
  const getStepStatus = (stepNumber: number): StepStatus => {
    if (isLoading) return 'in_progress';
    if (errorMessage && stepNumber === 1) return 'error';
    if (!report) return stepNumber === 1 ? 'not_started' : 'not_started';
    return 'completed';
  };

  return (
    <ErrorBoundary>
      <div className="app-shell min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <DarkSakuraPetals />
        {/* Application Header */}
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          report={report}
          onClearData={handleClearAllData}
          onShowToast={showToast}
          language={language}
          onToggleLanguage={toggleLanguage}
          onOpenApiModal={() => setIsApiModalOpen(true)}
          hasCustomApiKey={hasCustomApiKey}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          onOpenTrialModal={() => setIsTrialModalOpen(true)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          subscriptionStatus={subscriptionStatus}
        />

        {/* Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Banner when no report exists */}
          {!report && !isLoading && (
            <div className="mb-10 text-center max-w-4xl mx-auto py-8 animate-in fade-in duration-300 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Phiên bản thương mại 10X Toàn Cầu · Báo cáo chuẩn xác thực dữ liệu
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Đánh giá toàn diện website <br />
                <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  từ nội dung đến chuyển đổi 10X
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Nền tảng kiểm định website chuyên nghiệp: Tự động phân tích ngành nghề, tìm 5 đối thủ tự nhiên, so sánh ma trận 35 tiêu chí, khai phá 10X cơ hội thị trường và xây dựng lộ trình 90 ngày.
              </p>

              {/* 3 Key Highlights Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 max-w-2xl mx-auto text-xs text-left">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Không bịa đặt số liệu</strong>
                    <span className="text-slate-500">Quan sát thực tế & đối chiếu công khai</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Tìm 5 đối thủ tự nhiên</strong>
                    <span className="text-slate-500">Lọc bỏ mạng xã hội & sàn TMĐT</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Lộ trình 90 ngày 10X</strong>
                    <span className="text-slate-500">Kịch bản video, banner & biểu mẫu</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8 Steps Vertical Workflow */}
          <div className="space-y-4">
            {/* BƯỚC 1: Nhập website và tìm đối thủ */}
            <StepWrapper
              stepNumber={1}
              title="Bước 1: Nhập website và tìm đối thủ"
              subtitle="Cung cấp URL trang web mục tiêu, thiết lập thông số ngành và tìm kiếm 5 đối thủ tương xứng"
              status={getStepStatus(1)}
              defaultExpanded={true}
            >
              <Step1WebsiteInput
                inputData={inputData}
                onChangeInput={setInputData}
                onSubmit={handleStartAnalysis}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onRetry={handleStartAnalysis}
                activeProgressStage={progressStage}
                subscriptionStatus={subscriptionStatus}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                onOpenTrialModal={() => setIsTrialModalOpen(true)}
              />
            </StepWrapper>

            {/* BƯỚC 2: Hồ sơ đối thủ */}
            <StepWrapper
              stepNumber={2}
              title="Bước 2: Hồ sơ đối thủ & Phát hiện có thể hành động ngay"
              subtitle="Phân tích định vị, sản phẩm, thông điệp, cam kết và các phát hiện thực tế cần sửa trên 6 website"
              status={getStepStatus(2)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step2CompetitorProfiles
                  competitorProfiles={report.competitorProfiles || []}
                  competitorsFound={report.competitorsFound || []}
                  actionableFindings={report.actionableFindings || []}
                  onRegenerate={handleRegenerateCompetitors}
                  isRegenerating={isRegeneratingCompetitors}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Vui lòng nhập website ở Bước 1 và bấm "Phân tích website" để AI xây dựng hồ sơ đối thủ.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 3: Đánh giá website theo 35 tiêu chí */}
            <StepWrapper
              stepNumber={3}
              title="Bước 3: Đánh giá so sánh website theo ma trận tiêu chí"
              subtitle="So sánh 6 website qua các nhóm tiêu chí (Điều hướng, Tin cậy, Nội dung, Tương tác, Chốt đơn, Kỹ thuật, Đặc thù ngành)"
              status={getStepStatus(3)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step3CriteriaComparison
                  data={report.criteriaComparison}
                  competitors={report.competitorProfiles || []}
                  userWebsiteUrl={report.userWebsiteUrl}
                  onRegenerate={handleRegenerateCriteria}
                  isRegenerating={isRegeneratingCriteria}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Bảng ma trận tiêu chí sẽ xuất hiện sau khi AI quét và xác thực dữ liệu các website.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 4: Khoảng trống cơ hội */}
            <StepWrapper
              stepNumber={4}
              title="Bước 4: Khoảng trống cơ hội đột phá (10X Opportunity Gaps)"
              subtitle="Xác định các cơ hội tăng trưởng: đối thủ làm tốt, điểm yếu chung và khoảng trống chưa ai khai thác"
              status={getStepStatus(4)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step4OpportunityGaps
                  opportunities={report.opportunityGaps10X || report.opportunityGaps || []}
                  onRegenerate={handleRegenerateOpportunities}
                  isRegenerating={isRegeneratingOpportunities}
                  onAddToRoadmap={handleAddToRoadmap}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Khoảng trống cơ hội sẽ được tự động tổng hợp sau khi hoàn tất so sánh tiêu chí.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 5: Chiến lược nội dung và tối ưu tìm kiếm */}
            <StepWrapper
              stepNumber={5}
              title="Bước 5: Chiến lược nội dung, chân dung khách hàng & SEO On-page"
              subtitle="Thông điệp bán hàng chủ đạo, 3 chân dung khách hàng 10X, giải tỏa nỗi lo, cấu trúc menu & bộ từ khóa mua hàng"
              status={getStepStatus(5)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step5ContentStrategy
                  contentStrategy={report.contentStrategy}
                  report10X={report}
                  websiteInput={inputData}
                  onUpdateStrategy={(updated) => setReport({ ...report, contentStrategy: updated })}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chiến lược nội dung và On-page SEO sẽ hiển thị tại đây sau khi phân tích.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 6: Kế hoạch sản xuất */}
            <StepWrapper
              stepNumber={6}
              title="Bước 6: Kế hoạch sản xuất Design, Media & Biểu mẫu (10X Studio)"
              subtitle="5 Banner đồ họa, danh sách ảnh chụp chi tiết, 4 kịch bản video từng mốc giây, bảng giá minh bạch và biểu mẫu chuyển đổi"
              status={getStepStatus(6)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step6ProductionPlan
                  productionPlan={report.productionPlan}
                  websiteInput={inputData}
                  report10X={report}
                  onUpdatePlan={(updated) => setReport({ ...report, productionPlan: updated })}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Kế hoạch sản xuất bàn giao cho đội ngũ thực thi sẽ hiển thị sau khi hoàn tất phân tích.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 7: Lộ trình triển khai */}
            <StepWrapper
              stepNumber={7}
              title="Bước 7: Lộ trình triển khai 90 ngày (Roadmap 10X - 3 Giai đoạn)"
              subtitle="Lộ trình hành động chi tiết kèm thứ tự ưu tiên, phân công bộ phận, KPI theo dõi và lưu trữ trạng thái công việc"
              status={getStepStatus(7)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step7ImplementationRoadmap
                  roadmap={report.roadmap}
                  tasks10X={report.roadmapTasks10X}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Lộ trình triển khai 3 giai đoạn sẽ xuất hiện sau khi phân tích hoàn tất.
                </div>
              )}
            </StepWrapper>

            {/* BƯỚC 8: Sao chép và xuất báo cáo */}
            <StepWrapper
              stepNumber={8}
              title="Bước 8: Xuất báo cáo chuyên nghiệp & Thuyết trình khách hàng"
              subtitle="Tải file TXT chuẩn tiếng Việt UTF-8, in báo cáo / PDF, sao chép từng phân đoạn và kiểm tra danh mục nguồn đối chiếu"
              status={getStepStatus(8)}
              defaultExpanded={!!report}
            >
              {report ? (
                <Step8ExportAndActions
                  report={report}
                  onRegenerateAll={handleStartAnalysis}
                  onClearData={handleClearAllData}
                  onShowToast={showToast}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Báo cáo tổng kết và tính năng xuất file TXT/PDF sẽ khả dụng sau khi hoàn thành các bước trên.
                </div>
              )}
            </StepWrapper>
          </div>
        </main>

        {/* Gemini API Key Configuration Modal */}
        <ApiKeyModal
          isOpen={isApiModalOpen}
          onClose={() => setIsApiModalOpen(false)}
          onShowToast={showToast}
          onApiKeyChanged={(hasKey) => setHasCustomApiKey(hasKey)}
        />

        {/* Subscription & SePay Payment Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onSuccess={() => refreshSubscriptionStatus()}
          onShowToast={showToast}
        />

        {/* Free Trial Registration Modal */}
        <TrialModal
          isOpen={isTrialModalOpen}
          onClose={() => setIsTrialModalOpen(false)}
          onSuccess={() => refreshSubscriptionStatus()}
          onShowToast={showToast}
        />

        {/* Admin Management Dashboard Modal */}
        <AdminDashboardModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onShowToast={showToast}
          onDataChanged={() => refreshSubscriptionStatus()}
        />

        {/* Global Toast Notification */}
        <ToastNotification toasts={toasts} onDismiss={removeToast} />
      </div>
    </ErrorBoundary>
  );
}
