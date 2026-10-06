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
import { HeroIllustration } from './components/HeroIllustration';
import { StepEmptyState } from './components/StepEmptyState';
import { TemplateNotice } from './components/TemplateNotice';
import { STEP_ICONS } from './components/stepThemes';
import { Sparkles, CheckCircle2, TrendingUp, Layers, Rocket, Globe } from 'lucide-react';

const STEP_NAV_LABELS: Record<number, string> = {
  1: 'Nhập website',
  2: 'Đối thủ',
  3: 'Ma trận tiêu chí',
  4: 'Cơ hội 10X',
  5: 'Nội dung & SEO',
  6: 'Sản xuất media',
  7: 'Lộ trình 90 ngày',
  8: 'Xuất báo cáo',
};

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

  const runAnalysis = async (input: WebsiteInputForm) => {
    if (!input.url.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      showToast('Đang phân tích website mục tiêu và tìm kiếm đối thủ 10X...', 'info');
      const result = await analyzeWebsiteApi(input);
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

  // Called from buttons that pass click events, so it takes no arguments.
  const handleStartAnalysis = () => runAnalysis(inputData);

  // Hero URL bar: fill Step 1 and start right away, or ask for a trial/plan first.
  const [heroUrl, setHeroUrl] = useState('');
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = heroUrl.trim();
    if (!url) {
      document.getElementById('hero-url')?.focus();
      return;
    }
    const next = { ...inputData, url };
    setInputData(next);
    document.getElementById('buoc-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (subscriptionStatus?.has_access) {
      runAnalysis(next);
    } else if (subscriptionStatus?.is_expired) {
      setIsSubscriptionModalOpen(true);
    } else {
      setIsTrialModalOpen(true);
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
      <div className="app-shell min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
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

        {/* Hero band: shown until the first report exists */}
        {!report && !isLoading && (
          <section className="hero-band relative overflow-hidden text-white">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 sm:pt-14 sm:pb-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center animate-in">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 ring-1 ring-white/20 text-brand-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Công cụ AI kiểm định website cho doanh nghiệp Việt
                </span>

                <h2 className="mt-5 text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem] font-black tracking-tight">
                  Biết ngay website của bạn{' '}
                  <span className="text-brand-300">thua đối thủ ở đâu</span>
                </h2>

                <p className="mt-5 text-sm sm:text-lg text-brand-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Nhập địa chỉ website — AI tìm 5 đối thủ thật, chấm 35 tiêu chí từ nội dung đến chuyển đổi và lập lộ trình 90 ngày để bạn bán được nhiều hơn.
                </p>

                {/* Focal point: start an analysis right from the hero */}
                <form
                  onSubmit={handleHeroSubmit}
                  className="mt-7 max-w-xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-white shadow-2xl shadow-brand-950/40"
                >
                  <label htmlFor="hero-url" className="sr-only">Địa chỉ website cần phân tích</label>
                  <div className="flex-1 flex items-center gap-2.5 px-3">
                    <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      id="hero-url"
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={heroUrl}
                      onChange={(e) => setHeroUrl(e.target.value)}
                      placeholder="Nhập website, vd: tenmien.vn"
                      className="w-full py-3 bg-transparent text-slate-900 placeholder:text-slate-400 text-base outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Phân tích ngay
                  </button>
                </form>

                <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm text-brand-100/90">
                  {['Không bịa đặt số liệu', 'Đối thủ thật từ Google', 'Dùng thử miễn phí 24 giờ'].map((t) => (
                    <li key={t} className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {t}
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white cursor-pointer"
                    >
                      Xem bảng giá →
                    </button>
                  </li>
                </ul>
              </div>

              <div className="relative max-w-md lg:max-w-none w-full mx-auto">
                <div className="absolute inset-6 rounded-full bg-brand-400/30 blur-3xl" aria-hidden="true" />
                <HeroIllustration className="relative w-full h-auto drop-shadow-2xl" />
              </div>
            </div>
          </section>
        )}

        {/* Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Key numbers, overlapping the hero band */}
          {!report && !isLoading && (
            <section className="-mt-20 sm:-mt-24 mb-10 relative z-10 surface-card rounded-2xl p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:divide-x divide-slate-100 dark:divide-slate-800">
              {[
                { icon: Layers, value: '8 bước', label: 'Quy trình phân tích trọn vẹn' },
                { icon: CheckCircle2, value: '35 tiêu chí', label: 'Nội dung, tin cậy, chuyển đổi' },
                { icon: TrendingUp, value: '5 đối thủ', label: 'Tìm từ kết quả Google thật' },
                { icon: Rocket, value: '90 ngày', label: 'Lộ trình hành động cụ thể' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={value} className="flex items-center gap-3 sm:justify-center sm:px-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">{value}</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{label}</div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Quick navigation across the 8 steps */}
          <nav aria-label="Các bước phân tích" className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            <ol className="flex gap-2 min-w-max pb-1">
              {Object.entries(STEP_ICONS).map(([num, Icon]) => (
                <li key={num}>
                  <a
                    href={`#buoc-${num}`}
                    className="surface-card inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {STEP_NAV_LABELS[Number(num)]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* 8 Steps Vertical Workflow */}
          <div>
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
                <>
                  {report.templatedSteps?.includes(2) && <TemplateNotice />}
                  <Step2CompetitorProfiles
                  competitorProfiles={report.competitorProfiles || []}
                  competitorsFound={report.competitorsFound || []}
                  actionableFindings={report.actionableFindings || []}
                  onRegenerate={handleRegenerateCompetitors}
                  isRegenerating={isRegeneratingCompetitors}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={2} message="Vui lòng nhập website ở Bước 1 và bấm “Phân tích website” để AI xây dựng hồ sơ đối thủ." />
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
                <>
                  {report.templatedSteps?.includes(3) && <TemplateNotice />}
                  <Step3CriteriaComparison
                  data={report.criteriaComparison}
                  competitors={report.competitorProfiles || []}
                  userWebsiteUrl={report.userWebsiteUrl}
                  onRegenerate={handleRegenerateCriteria}
                  isRegenerating={isRegeneratingCriteria}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={3} message="Bảng ma trận tiêu chí sẽ xuất hiện sau khi AI quét và xác thực dữ liệu các website." />
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
                <>
                  {report.templatedSteps?.includes(4) && <TemplateNotice />}
                  <Step4OpportunityGaps
                  opportunities={report.opportunityGaps10X || report.opportunityGaps || []}
                  onRegenerate={handleRegenerateOpportunities}
                  isRegenerating={isRegeneratingOpportunities}
                  onAddToRoadmap={handleAddToRoadmap}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={4} message="Khoảng trống cơ hội sẽ được tự động tổng hợp sau khi hoàn tất so sánh tiêu chí." />
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
                <>
                  {report.templatedSteps?.includes(5) && <TemplateNotice />}
                  <Step5ContentStrategy
                  contentStrategy={report.contentStrategy}
                  report10X={report}
                  websiteInput={inputData}
                  onUpdateStrategy={(updated) => setReport({ ...report, contentStrategy: updated })}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={5} message="Chiến lược nội dung và On-page SEO sẽ hiển thị tại đây sau khi phân tích." />
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
                <>
                  {report.templatedSteps?.includes(6) && <TemplateNotice />}
                  <Step6ProductionPlan
                  productionPlan={report.productionPlan}
                  websiteInput={inputData}
                  report10X={report}
                  onUpdatePlan={(updated) => setReport({ ...report, productionPlan: updated })}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={6} message="Kế hoạch sản xuất bàn giao cho đội ngũ thực thi sẽ hiển thị sau khi hoàn tất phân tích." />
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
                <>
                  {report.templatedSteps?.includes(7) && <TemplateNotice />}
                  <Step7ImplementationRoadmap
                  roadmap={report.roadmap}
                  tasks10X={report.roadmapTasks10X}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={7} message="Lộ trình triển khai 3 giai đoạn sẽ xuất hiện sau khi phân tích hoàn tất." />
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
                <>
                  {report.templatedSteps?.includes(8) && <TemplateNotice />}
                  <Step8ExportAndActions
                  report={report}
                  onRegenerateAll={handleStartAnalysis}
                  onClearData={handleClearAllData}
                  onShowToast={showToast}
                />
              </>
              ) : (
                <StepEmptyState stepNumber={8} message="Báo cáo tổng kết và tính năng xuất file TXT/PDF sẽ khả dụng sau khi hoàn thành các bước trên." />
              )}
            </StepWrapper>
          </div>
        </main>

        <footer className="relative z-[1] border-t border-slate-200/70 dark:border-slate-800/70 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-brand-600 dark:text-brand-400">PHÂN TÍCH WEB 360</span> · Đánh giá website từ nội dung đến chuyển đổi · Thanh toán tự động SePay
        </footer>

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
