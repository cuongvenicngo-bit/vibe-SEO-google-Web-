export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_data' | 'error';

export type CriterionStatus = 'good' | 'partial' | 'no_evidence' | 'insufficient_data';

export interface WebsiteInputForm {
  url: string;
  productService?: string;
  location?: string;
  mainKeyword?: string;
  manualCompetitors?: string[];
  pastedContent?: string;
}

export interface CompetitorFound {
  name: string;
  url: string;
  queryFound: string;
  reason: string;
  relevance: 'cao' | 'trung bình' | 'thấp';
  source: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  url: string;
  isUserSite: boolean;
  positioning: string;
  mainProducts: string[];
  targetAudience: string[];
  menuOrganization: string;
  productPresentation: string;
  keyMessage: string;
  commitments: string;
  salesPolicy: string;
  contactChannels: string[];
  strengths: string[];
  weaknesses: string[];
  learningsForUser: string[];
  competitionStrategy: string;
  verifiedSources: string[];
}

export type CriteriaGroupKey = 'dieuhuong' | 'tincay' | 'noidung' | 'tuongtac' | 'chotdon' | 'kythuat' | 'dacthunganh';

export interface CriterionDefinition {
  id: number;
  name: string;
  group: CriteriaGroupKey;
  groupName: string;
  funnelStage: 'Đầu phễu' | 'Giữa phễu' | 'Cuối phễu' | 'Toàn trang' | 'Giữa – Cuối phễu' | 'Đầu – Giữa phễu';
  defaultPriority: 'Cao' | 'Đã có' | 'Khoảng trống' | 'Trung bình' | 'Thấp' | 'Cần xác minh';
  explanation?: string;
}

export interface CellEvaluation {
  status: CriterionStatus;
  evidence: string;
  sourceUrl: string;
  reason: string;
  limitation: string;
  userRecommendation: string;
}

export interface SiteRanking {
  siteUrl: string;
  siteName: string;
  isUserSite: boolean;
  overallRank: string;
  groupRanks: Record<string, string>;
}

export interface CriteriaComparisonData {
  evaluations: Record<number, Record<string, CellEvaluation>>;
  rankings: SiteRanking[];
}

export interface ActionableFinding {
  id: string;
  title: string;
  category: 'Ưu tiên sửa' | 'Nên giữ và nâng cấp' | 'Cơ hội thử nghiệm';
  description: string;
  actionNeeded: string;
  tags: { label: string; url?: string }[];
}

export interface OpportunityGap10X {
  id: string;
  orderNumber: string; // '01', '02', ...
  title: string;
  badge: 'CẦN HOÀN THIỆN SO VỚI MẪU ĐỐI THỦ' | 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN' | 'CHƯA THẤY TRÊN CÁC MẪU ĐÃ ĐỌC';
  badgeType: 'urgent' | 'improve' | 'new';
  description: string;
  whyOpportunity: string;
  actionNeeded: string;
  funnelStage: string;
  estimatedTimeline: string;
}

export interface KeywordCampaignItem {
  id: string;
  clusterName: string;
  searchVolumeNote: string;
  priorityNote: string;
  customerContext: string;
  suggestedKeywords: string;
  landingPage: string;
  groupingMethod: string;
}

export interface NegativeKeywordRule {
  cluster: string;
  whenToApply: string;
}

export interface KeywordLinkItem {
  id: string;
  keywordGroup: string;
  monthlySearches: string;
  currentLink: string;
  status: 'Tối ưu trang hiện có' | 'Có trang: cần bổ sung' | 'Cần sửa gấp' | 'Chưa xác minh trang riêng' | 'Cần xác nhận danh mục' | 'Đã có';
  statusColor: 'emerald' | 'amber' | 'rose' | 'slate' | 'sky';
  proposedLink: string;
  proposedTitle: string;
  notesAndSources: string;
  sourceTags: { label: string; url?: string }[];
}

export interface MenuStructurePillar {
  title: string;
  description: string;
  items: {
    name: string;
    subtext?: string;
    status?: string;
  }[];
}

export interface PagePositionMessage {
  message: string;
  position: string;
  requiredEvidence: string;
}

export interface FearAndCommitment {
  painPoint: string;
  whyCustomerAfraid: string;
  commitmentOnPage: string;
}

export interface Persona10X {
  id: string;
  groupNumber: string; // 'NHÓM 01'
  title: string;
  persona: string;
  pain: string;
  desire: string;
  problem: string;
  solution: string;
  story: string;
  message: string;
  cta: string;
}

export interface WhyChooseUsReason {
  reason: string;
  customerBenefit: string;
  evidenceAttached: string;
}

export interface LandingPageWireframeBlock {
  blockName: string;
  contentToWrite: string;
  evidenceRequired: string;
}

export interface TechnicalFaq {
  question: string;
  proposedAnswer: string;
}

export interface BannerProductionItem {
  position: string;
  title: string;
  subtitle: string;
  imageNeeded: string;
  buttonText: string;
}

export interface PhotoShotlistGroup10X {
  category: string;
  purpose: string;
  shots: string[];
}

export interface VideoTimelineItem {
  timestamp: string;
  description: string;
}

export interface VideoScript10X {
  id: string;
  videoNumber: string; // 'VIDEO 01'
  context: string;
  title: string;
  timeline: VideoTimelineItem[];
  placementNote?: string;
}

export interface CredibilityItem {
  item: string;
  photoToTake: string;
  videoToShoot: string;
  notes: string;
}

export interface PricingPackage10X {
  packageConfig: string;
  price: string;
  included: string;
  notIncluded: string;
  dataToVerify: string;
}

export interface FunnelGiftItem {
  stage: string;
  gift: string;
  customerExchanges: string;
  notes: string;
}

export interface ScrollCtaButton {
  position: string;
  customerMindset: string;
  buttonText: string;
  buttonType: string;
}

export interface FormSpec10X {
  position: string;
  title: string;
  fields: string;
  submitButtonText: string;
  commitment: string;
  notes: string;
}

export interface RoadmapTask10X {
  id: string;
  phaseId: 1 | 2 | 3;
  phaseTitle: string;
  phaseTimeline: string;
  phaseGoal: string;
  taskName: string;
  gapResolved: string;
  department: string;
  metricToTrack: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface AuditedUrlItem {
  website: string;
  pageType: string;
  url: string;
  readingMethod: string;
}

export interface VerificationEvent {
  event: string;
  meaning: string;
  verificationMethod: string;
  owner: string;
}

export interface AnalysisReport10X {
  version: string;
  analyzedAt: string;
  userWebsiteUrl: string;
  businessName: string;
  businessSummary: {
    name: string;
    industry: string;
    mainProductService: string;
    location: string;
    targetAudience: string;
    commercialKeywords: string[];
  };
  competitorsFound: CompetitorFound[];
  competitorProfiles: CompetitorProfile[];
  actionableFindings: ActionableFinding[];
  criteriaComparison: CriteriaComparisonData;
  opportunityGaps10X: OpportunityGap10X[];
  keywordCampaigns: KeywordCampaignItem[];
  negativeKeywords: NegativeKeywordRule[];
  budgetGuidance: string;
  keywordLinks: KeywordLinkItem[];
  menuStructurePillars: MenuStructurePillar[];
  siteBuildingRules: string[];
  mainSalesMessage: {
    headline: string;
    subheadline: string;
    threePillars: { title: string; desc: string }[];
  };
  pagePositionMessages: PagePositionMessage[];
  fearsAndCommitments: FearAndCommitment[];
  personas10X: Persona10X[];
  whyChooseUsReasons: WhyChooseUsReason[];
  landingPageWireframeBlocks: LandingPageWireframeBlock[];
  technicalFaqs: TechnicalFaq[];
  bannerProduction: BannerProductionItem[];
  photoShotlists10X: PhotoShotlistGroup10X[];
  videoScripts10X: VideoScript10X[];
  credibilityChecklist: CredibilityItem[];
  pricingPackages10X: PricingPackage10X[];
  funnelGifts: FunnelGiftItem[];
  scrollCtaButtons: ScrollCtaButton[];
  forms10X: FormSpec10X[];
  roadmapTasks10X: RoadmapTask10X[];
  auditingPrinciples: string[];
  verificationEvents: VerificationEvent[];
  auditedUrls: AuditedUrlItem[];
  methodologyNotes: string[];
  verifiedSourcesList: string[];
  // Backwards compatibility fields
  opportunityGaps?: OpportunityGap10X[];
  contentStrategy?: any;
  productionPlan?: any;
  roadmap?: any;
}

export type AnalysisReport = AnalysisReport10X;
export type OpportunityGap = OpportunityGap10X;
export type RoadmapTask = RoadmapTask10X;
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface RoadmapData {
  phase1Tasks?: RoadmapTask10X[];
  phase2Tasks?: RoadmapTask10X[];
  phase3Tasks?: RoadmapTask10X[];
  [key: string]: any;
}

export interface ProductionPlanData {
  banners?: any[];
  photoShotlist?: any[];
  videoScripts?: any[];
  pricingTable?: any[];
  contactButtons?: any[];
  forms?: any[];
  [key: string]: any;
}

export interface ContentStrategyData {
  salesMessage?: any;
  targetAudiences?: any[];
  customerFears?: any[];
  menuAndLandingPages?: any;
  keywordClusters?: any[];
  seoSuggestions?: any[];
  [key: string]: any;
}

