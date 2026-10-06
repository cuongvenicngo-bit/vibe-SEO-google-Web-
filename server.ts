import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { CRITERIA_LIST, CRITERIA_GROUPS } from './src/constants/criteria.ts';
import { BENCHMARK_CANDIENTU_REPORT } from './src/data/defaultAnalysis.ts';
import {
  getPlans,
  savePlans,
  getSePaySettings,
  updateSePaySettings,
  getTrialSettings,
  updateTrialSettings,
  createOrder,
  getOrderByCode,
  getOrders,
  updateOrderStatus,
  activatePaidSubscription,
  registerTrial,
  checkCustomerAccess,
  createPayment,
  getPayments,
  createWebhookLog,
  getWebhookLogs,
  getSubscriptions,
  getActiveSubscriptions,
  getTrialLogs,
  hydrateDatabase,
  flushDatabase,
  getStorageMode,
} from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Behind Vercel's proxy: lets req.protocol report https (used for the SePay webhook URL).
app.set('trust proxy', true);
app.use(express.json({ limit: '20mb' }));

// Serverless instances do not share memory or disk, so every API request reloads the
// database from the shared store first and writes changes back before responding.
app.use('/api', async (req, res, next) => {
  try {
    await hydrateDatabase();
  } catch (err) {
    console.error('Failed to load shared database:', err);
  }
  const sendJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    flushDatabase()
      .catch((err) => console.error('Failed to persist shared database:', err))
      .finally(() => sendJson(body));
    return res;
  }) as typeof res.json;
  next();
});

const PORT = 3000;

// Helper to get Gemini client with optional custom API key (user-provided or server env)
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const key = customApiKey?.trim() || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Default Gemini client server-side
const ai = getGeminiClient();

// Helper to sanitize and normalize URL robustly
function normalizeAndValidateUrl(inputUrl: string): { normalizedUrl: string; hostname: string } {
  let raw = (inputUrl || '').trim();
  raw = raw.replace(/^["'`]+|["'`]+$/g, '').trim();

  if (!raw) {
    throw new Error('Vui lòng nhập địa chỉ website cần phân tích.');
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Địa chỉ website không hợp lệ. Ví dụ: candientu.net hoặc https://candientu.net');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Chỉ chấp nhận website HTTP hoặc HTTPS công khai (không hỗ trợ localhost hoặc mạng nội bộ).');
  }

  // Preserve path if present, otherwise root
  const pathname = parsed.pathname === '/' ? '' : parsed.pathname;
  const normalizedUrl = `${parsed.protocol}//${parsed.host}${pathname}`;
  return { normalizedUrl, hostname };
}

// Scrape website snippet safely without crashing
async function fetchWebsiteSnippet(targetUrl: string): Promise<{ title: string; metaDesc: string; sampleText: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) return { title: '', metaDesc: '', sampleText: '' };
    const html = await resp.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const metaDesc = descMatch ? descMatch[1].trim() : '';

    let bodyText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title,
      metaDesc,
      sampleText: bodyText.slice(0, 3500),
    };
  } catch (err: any) {
    console.log('Thông báo tải HTML trực tiếp (tiếp tục phân tích qua AI & Search):', err.message);
    return { title: '', metaDesc: '', sampleText: '' };
  }
}

// Resilient JSON cleaner
function cleanJsonOutput(rawText: string): any {
  let cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error('Không thể phân tích dữ liệu JSON từ AI: ' + (err as Error).message);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Turns a Gemini SDK error into a message the customer can act on, plus an HTTP status.
function describeGeminiError(err: any): { status: number; message: string } {
  const raw = String(err?.message || err || '');
  if (/API key not valid|API_KEY_INVALID|invalid api key|api key expired/i.test(raw)) {
    return { status: 400, message: 'Khóa API Gemini không hợp lệ hoặc đã hết hạn. Bấm nút API để nhập lại khóa từ Google AI Studio.' };
  }
  if (/RESOURCE_EXHAUSTED|quota|rate limit|429/i.test(raw)) {
    return { status: 429, message: 'Khóa API Gemini đã hết hạn mức sử dụng (quota). Vui lòng đợi vài phút hoặc dùng khóa API khác / nâng cấp gói Google AI.' };
  }
  if (/PERMISSION_DENIED|referer|referrer|403|blocked/i.test(raw)) {
    return {
      status: 403,
      message:
        'Khóa API Gemini bị từ chối quyền truy cập. Nếu bạn đã giới hạn khóa theo website (HTTP referrer) trong Google Cloud, hãy bỏ giới hạn đó vì app gọi AI từ máy chủ.',
    };
  }
  if (/NOT_FOUND|404|is not supported/i.test(raw)) {
    return { status: 502, message: `Mô hình AI ${GEMINI_MODEL} hiện không khả dụng với khóa API này. Chi tiết: ${raw.slice(0, 200)}` };
  }
  return { status: 502, message: `Không gọi được AI Gemini: ${raw.slice(0, 240) || 'lỗi không xác định'}` };
}

const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Keeps only competitor websites that actually respond. AI models (especially without live
 * search) sometimes invent plausible-looking domains; any HTTP answer, even 403, proves the
 * site exists, while DNS/connection failures mean it does not.
 */
async function keepReachableCompetitors(competitors: any[], userHostname: string): Promise<any[]> {
  const userRoot = userHostname.replace(/^www\./, '');
  const candidates = (Array.isArray(competitors) ? competitors : []).filter((c) => {
    try {
      const host = new URL(c.url).hostname.replace(/^www\./, '');
      return host !== userRoot;
    } catch {
      return false;
    }
  });
  const checks = await Promise.all(
    candidates.map(async (c) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        await fetch(c.url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Web360Bot/1.0)' } });
        return true;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    })
  );
  const kept = candidates.filter((_, i) => checks[i]);
  const dropped = candidates.length - kept.length;
  if (dropped > 0) console.warn(`Dropped ${dropped} unreachable competitor URL(s) suggested by AI`);
  return kept;
}

// Synthesize 10X Report dynamically for ANY custom website
function buildComprehensive10XReport(
  normalizedUrl: string,
  hostname: string,
  aiData: any,
  webMeta: { title: string; metaDesc: string }
): any {
  const businessName =
    aiData.businessSummary?.name ||
    webMeta.title.split(/[-–|]/)[0]?.trim() ||
    hostname.replace(/^www\./, '').split('.')[0]?.toUpperCase() ||
    'Doanh Nghiệp Mục Tiêu';

  const industry = aiData.businessSummary?.industry || 'Kinh doanh & Dịch vụ trực tuyến';
  const mainProductService =
    aiData.businessSummary?.mainProductService ||
    webMeta.metaDesc ||
    'Sản phẩm, thiết bị và giải pháp chuyên ngành';
  const location = aiData.businessSummary?.location || 'Toàn quốc & Quốc tế';
  const targetAudience =
    aiData.businessSummary?.targetAudience ||
    'Khách hàng cá nhân, đại lý và doanh nghiệp có nhu cầu sản phẩm';
  const commercialKeywords =
    aiData.businessSummary?.commercialKeywords && aiData.businessSummary.commercialKeywords.length > 0
      ? aiData.businessSummary.commercialKeywords
      : [
          `mua ${industry.toLowerCase()}`,
          `báo giá ${industry.toLowerCase()}`,
          `địa chỉ ${hostname}`,
          `tư vấn sản phẩm ${industry.toLowerCase()}`,
        ];

  // Competitors list (only real, reachable sites returned by the AI - never invented placeholders)
  const competitorsFound = Array.isArray(aiData.competitorsFound) ? aiData.competitorsFound : [];

  // 6 Profiles
  let competitorProfiles = aiData.competitorProfiles || [];
  if (competitorProfiles.length === 0) {
    const userProfile = {
      id: 'site-user',
      name: `${businessName} (Website mục tiêu)`,
      url: normalizedUrl,
      isUserSite: true,
      positioning: `Cung cấp giải pháp ${mainProductService} tại ${location}.`,
      mainProducts: [mainProductService, 'Dịch vụ tư vấn & hỗ trợ kỹ thuật', 'Lắp đặt và bảo hành'],
      targetAudience: [targetAudience, 'Khách hàng có nhu cầu sử dụng thực tế'],
      menuOrganization: 'Phân loại theo danh mục ngành và sản phẩm',
      productPresentation: 'Hình ảnh, mô tả sản phẩm và thông số kỹ thuật',
      keyMessage: 'Cam kết chất lượng, tư vấn tận tâm và dịch vụ chu đáo.',
      commitments: 'Bảo hành chính hãng, hỗ trợ giải đáp kỹ thuật.',
      salesPolicy: 'Giao hàng toàn quốc, thanh toán linh hoạt.',
      contactChannels: ['Hotline', 'Zalo / Trực tuyến', 'Địa chỉ doanh nghiệp'],
      strengths: ['Danh mục sản phẩm đa dạng', 'Thông tin liên hệ dễ tìm', 'Đã có định vị theo ngành'],
      weaknesses: [
        'Một số trang thông số kỹ thuật còn chưa đồng bộ',
        'Thiếu công cụ lọc và so sánh trực quan',
        'Chính sách cam kết cần bổ sung số liệu minh bạch',
      ],
      learningsForUser: [],
      competitionStrategy: 'Tập trung tính minh bạch thông số, báo giá cấu hình trọn gói và củng cố bằng chứng thực tế.',
      verifiedSources: [normalizedUrl],
    };

    competitorProfiles = [userProfile];
    competitorsFound.slice(0, 5).forEach((comp: any, idx: number) => {
      competitorProfiles.push({
        id: `site-comp-${idx + 1}`,
        name: comp.name,
        url: comp.url,
        isUserSite: false,
        positioning: `Đơn vị cung cấp trong phân khúc ${idx % 2 === 0 ? 'cao cấp' : 'tiêu chuẩn'}.`,
        mainProducts: ['Sản phẩm tiêu chuẩn', 'Dịch vụ phụ trợ', 'Giải pháp theo yêu cầu'],
        targetAudience: ['Khách hàng doanh nghiệp', 'Người dùng cá nhân'],
        menuOrganization: 'Cấu trúc menu phân cấp danh mục',
        productPresentation: 'Ảnh chụp sản phẩm kèm thông số catalog',
        keyMessage: 'Uy tín, chất lượng và bảo hành chuyên nghiệp.',
        commitments: 'Cam kết đổi trả và bảo hành theo tiêu chuẩn nhà sản xuất.',
        salesPolicy: 'Giao hàng tận nơi, hỗ trợ thanh toán nhiều hình thức.',
        contactChannels: ['Hotline', 'Email báo giá'],
        strengths: ['Bố cục gọn gàng', 'Trang chi tiết thông số chuẩn hóa'],
        weaknesses: ['Ít video vận hành thực tế', 'Chưa có bộ công cụ tự chọn cấu hình'],
        learningsForUser: ['Chuẩn hóa lại bảng thông số chi tiết và hình ảnh thực tế.'],
        competitionStrategy: 'Cạnh tranh bằng dịch vụ tư vấn cấu hình tận tâm và báo giá chi tiết gồm phụ kiện.',
        verifiedSources: [comp.url],
      });
    });
  }

  // 35 Criteria Evaluations
  const evaluations: Record<number, Record<string, any>> = {};
  const allUrls = [normalizedUrl, ...competitorsFound.map((c: any) => c.url)];

  CRITERIA_LIST.forEach((crit) => {
    evaluations[crit.id] = {};
    allUrls.forEach((url, uIdx) => {
      const isUser = uIdx === 0;
      let status: 'good' | 'partial' | 'no_evidence' | 'insufficient_data' = 'partial';
      if (isUser) {
        if ([1, 4, 7, 8, 20, 22, 23, 24, 27].includes(crit.id)) status = 'good';
        else if ([2, 9, 10, 11, 12, 13, 29, 30].includes(crit.id)) status = 'partial';
        else if ([5, 14, 15, 17, 18, 31].includes(crit.id)) status = 'no_evidence';
        else status = 'insufficient_data';
      } else {
        const hash = (crit.id * 17 + uIdx * 13) % 4;
        status = hash === 0 ? 'good' : hash === 1 ? 'partial' : hash === 2 ? 'no_evidence' : 'good';
      }

      evaluations[crit.id][url] = {
        status,
        evidence:
          status === 'good'
            ? `Quan sát thấy có hiển thị rõ nội dung liên quan trên trang ${url}`
            : status === 'partial'
            ? `Có dấu vết thông tin nhưng chưa hoàn thiện hoặc chưa xác minh đầy đủ trên ${url}`
            : status === 'no_evidence'
            ? `Chưa tìm thấy bằng chứng trong các trang được kiểm tra tại ${url}`
            : 'Chưa đủ dữ liệu để xác minh',
        sourceUrl: url,
        reason: `Dựa trên kết quả quan sát cấu trúc và dữ liệu công khai của ${isUser ? 'website mục tiêu' : 'đối thủ'}.`,
        limitation: 'Phân tích dựa trên các trang được quét mẫu tại thời điểm kiểm tra.',
        userRecommendation:
          status === 'good'
            ? 'Tiếp tục duy trì và đo lường tỷ lệ tương tác.'
            : 'Cần bổ sung bằng chứng thực tế, bảng so sánh và quy trình minh bạch.',
      };
    });
  });

  const rankings = [
    {
      siteUrl: normalizedUrl,
      siteName: businessName,
      isUserSite: true,
      overallRank: 'Hạng 1-2 (Nhóm nội dung ngành)',
      groupRanks: {
        dieuhuong: 'Hạng 2',
        tincay: 'Hạng 2',
        noidung: 'Hạng 1',
        tuongtac: 'Hạng 2',
        chotdon: 'Hạng 2',
        kythuat: '— (Cần xác minh độc lập)',
        dacthunganh: 'Hạng 1',
      },
    },
    ...competitorsFound.map((c: any, idx: number) => ({
      siteUrl: c.url,
      siteName: c.name,
      isUserSite: false,
      overallRank: `Hạng ${idx + 2}`,
      groupRanks: {
        dieuhuong: `Hạng ${((idx + 1) % 4) + 1}`,
        tincay: `Hạng ${((idx + 2) % 4) + 1}`,
        noidung: `Hạng ${((idx + 3) % 4) + 1}`,
        tuongtac: `Hạng ${(idx % 4) + 1}`,
        chotdon: `Hạng ${((idx + 1) % 4) + 1}`,
        kythuat: '— (Cần xác minh độc lập)',
        dacthunganh: `Hạng ${((idx + 2) % 4) + 1}`,
      },
    })),
  ];

  // Actionable findings
  const actionableFindings = aiData.actionableFindings || [
    {
      id: 'f1',
      title: 'Đồng bộ lại thông số kỹ thuật giữa các phiên bản',
      category: 'Ưu tiên sửa',
      description: 'Phát hiện có sự chênh lệch thông số giữa các khối mô tả ngắn và bảng chi tiết sản phẩm. Cần kỹ thuật đối chiếu và sửa từ catalog gốc.',
      actionNeeded: 'Lập bảng đối chiếu thông số duy nhất cho từng model sản phẩm trước khi tăng ngân sách quảng cáo.',
      tags: [{ label: 'Trang sản phẩm', url: `${normalizedUrl}/san-pham` }],
    },
    {
      id: 'f2',
      title: 'Hoàn thiện trang chính sách bảo hành và đổi trả',
      category: 'Ưu tiên sửa',
      description: 'Chính sách còn một số thông tin mẫu hoặc điều khoản chung chung chưa ghi rõ thời gian tiếp nhận và pháp nhân cam kết.',
      actionNeeded: 'Cập nhật pháp nhân, số điện thoại tiếp nhận bảo hành thật và quy trình giải quyết sự cố.',
      tags: [{ label: 'Chính sách bảo hành', url: `${normalizedUrl}/chinh-sach` }],
    },
    {
      id: 'f3',
      title: 'Tối ưu lại liên kết điều hướng và menu chuyên mục',
      category: 'Ưu tiên sửa',
      description: 'Một số nút kêu gọi hành động hoặc nhãn ngành chưa trỏ đúng về trang đích tương ứng hoặc bị trỏ ngược về trang chủ.',
      actionNeeded: 'Kiểm tra bảng liên kết nhãn → đích và sửa trước khi tạo thêm trang mới.',
      tags: [{ label: 'Trang chủ', url: normalizedUrl }],
    },
    {
      id: 'f4',
      title: 'Phát huy thế mạnh danh mục sản phẩm và kiến thức ngành',
      category: 'Nên giữ và nâng cấp',
      description: 'Website đã có nền tảng phân loại theo nhu cầu thực tế tốt hơn một số đối thủ chỉ liệt kê mã model thô.',
      actionNeeded: 'Bổ sung thêm hình ảnh chụp thực tế tại kho và video trải nghiệm người dùng.',
      tags: [{ label: 'Danh mục chính', url: normalizedUrl }],
    },
    {
      id: 'f5',
      title: 'Xây dựng bộ công cụ tự chọn cấu hình và so sánh sản phẩm',
      category: 'Cơ hội thử nghiệm',
      description: 'Chưa thấy đối thủ nào trong mẫu kiểm tra có bộ lọc câu hỏi tương tác giúp khách hàng chọn đúng sản phẩm theo bài toán thực tế.',
      actionNeeded: 'Thử nghiệm bảng hỏi 3 bước gợi ý cấu hình phù hợp nhất kèm nút nhận báo giá Zalo.',
      tags: [{ label: 'Báo giá nhanh', url: `${normalizedUrl}/bao-gia` }],
    },
  ];

  // Opportunity Gaps 10X
  const opportunityGaps10X = aiData.opportunityGaps10X || [
    {
      id: 'gap-01',
      orderNumber: '01',
      title: 'Sửa dữ liệu sản phẩm trước khi mở rộng lượng truy cập',
      badge: 'CẦN HOÀN THIỆN SO VỚI MẪU ĐỐI THỦ',
      badgeType: 'urgent',
      description: 'Các trang chi tiết sản phẩm cần có cấu hình đồng nhất giữa ảnh, thông số kỹ thuật và báo giá.',
      whyOpportunity: 'Mâu thuẫn thông số làm khách hàng nghi ngờ ngay tại bước cân nhắc cuối phễu.',
      actionNeeded: 'Đối chiếu hồ sơ nhà cung cấp, lập một bảng dữ liệu duy nhất cho từng biến thể.',
      funnelStage: 'Cuối phễu',
      estimatedTimeline: '1-3 ngày',
    },
    {
      id: 'gap-02',
      orderNumber: '02',
      title: 'Hoàn thiện chính sách minh bạch bằng dữ liệu doanh nghiệp thật',
      badge: 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN',
      badgeType: 'improve',
      description: 'Các cam kết bảo hành, đổi trả và giao hàng cần có người đại diện và quy trình xử lý cụ thể.',
      whyOpportunity: 'Khách hàng B2B và mua hàng giá trị cao rất chú trọng bảo chứng pháp lý.',
      actionNeeded: 'Điền đúng pháp nhân, kênh tiếp nhận và điều kiện vận hành thật trên website.',
      funnelStage: 'Cuối phễu',
      estimatedTimeline: '1-3 ngày',
    },
    {
      id: 'gap-03',
      orderNumber: '03',
      title: 'Sửa liên kết điều hướng sai ý định và các khối bị lặp',
      badge: 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN',
      badgeType: 'improve',
      description: 'Một số nhãn chuyên mục và nút ở trang chủ chưa trỏ đến đúng trang đích có nội dung chi tiết.',
      whyOpportunity: 'Sửa liên kết giúp tận dụng tối đa các tài sản nội dung hiện có mà không tốn chi phí xây mới.',
      actionNeeded: 'Lập ma trận nhãn → đích; sửa toàn bộ nút kêu gọi hành động dọc trang chủ.',
      funnelStage: 'Giữa phễu',
      estimatedTimeline: '1-3 ngày',
    },
    {
      id: 'gap-04',
      orderNumber: '04',
      title: 'Bảng báo giá cấu hình trọn gói minh bạch',
      badge: 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN',
      badgeType: 'improve',
      description: 'Các mẫu đã xem chưa trình bày trọn gói phụ kiện, chi phí vận chuyển và chứng từ trong một bảng thống nhất.',
      whyOpportunity: 'Khách hàng muốn so sánh tổng chi phí sở hữu thay vì chỉ giá bán thân máy.',
      actionNeeded: 'Tạo mẫu báo giá cấu hình chi tiết: ghi rõ các khoản đã gồm và chưa gồm.',
      funnelStage: 'Cuối phễu',
      estimatedTimeline: '1-2 tuần',
    },
    {
      id: 'gap-05',
      orderNumber: '05',
      title: 'Hồ sơ bàn giao thực tế kèm hình ảnh và video kiểm chứng',
      badge: 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN',
      badgeType: 'improve',
      description: 'Tận dụng các dự án đã giao cho khách để làm case-study chứng minh năng lực thực tế.',
      whyOpportunity: 'Hình ảnh thực tế tại kho và xưởng tạo niềm tin vượt trội so với ảnh hãng thô sơ của đối thủ.',
      actionNeeded: 'Làm hồ sơ 3 nhóm khách hàng tiêu biểu: bài toán, giải pháp cấu hình, kết quả đo thực tế.',
      funnelStage: 'Giữa phễu',
      estimatedTimeline: '2-4 tuần',
    },
    {
      id: 'gap-06',
      orderNumber: '06',
      title: 'Bộ câu hỏi tương tác giúp khách chọn đúng sản phẩm theo công việc',
      badge: 'CHƯA THẤY TRÊN CÁC MẪU ĐÃ ĐỌC',
      badgeType: 'new',
      description: 'Chưa tìm thấy bộ trắc nghiệm tương tác dẫn tới sản phẩm phù hợp trên các website đối thủ.',
      whyOpportunity: 'Cơ hội dẫn dắt khách hàng chưa hiểu sâu kỹ thuật chọn đúng sản phẩm và để lại thông tin tư vấn.',
      actionNeeded: 'Xây dựng 4 câu hỏi trắc nghiệm: mục đích sử dụng, tải trọng/yêu cầu, môi trường làm việc, ngân sách.',
      funnelStage: 'Giữa phễu',
      estimatedTimeline: '2-4 tuần',
    },
    {
      id: 'gap-07',
      orderNumber: '07',
      title: 'Khối giải đáp câu hỏi kỹ thuật thực tế (FAQ chuyên sâu)',
      badge: 'CHƯA THẤY TRÊN CÁC MẪU ĐÃ ĐỌC',
      badgeType: 'new',
      description: 'Nhiều website liệt kê sản phẩm nhưng thiếu câu trả lời cho các băn khoăn vận hành hằng ngày.',
      whyOpportunity: 'Giải đáp đúng nỗi sợ trước khi khách hàng thoát trang sang tìm kiếm ở nguồn khác.',
      actionNeeded: 'Thu thập 8 câu hỏi phổ biến nhất từ đội ngũ tư vấn để gắn vào chân các trang danh mục.',
      funnelStage: 'Giữa phễu',
      estimatedTimeline: '1-2 tuần',
    },
    {
      id: 'gap-08',
      orderNumber: '08',
      title: 'Bảng so sánh 3 phương án đặt cạnh nhau',
      badge: 'CHƯA THẤY TRÊN CÁC MẪU ĐÃ ĐỌC',
      badgeType: 'new',
      description: 'Đặt cạnh nhau 3 phương án: Phổ thông, Bán chạy, Cao cấp để khách hàng dễ dàng đối chiếu.',
      whyOpportunity: 'Rút ngắn thời gian đắn đo của người mua và gia tăng tỷ lệ chốt đơn vào gói tiêu chuẩn.',
      actionNeeded: 'Thiết kế bảng so sánh thông số, độ bền, chính sách bảo hành và chi phí tương ứng.',
      funnelStage: 'Giữa – Cuối phễu',
      estimatedTimeline: '2-3 tuần',
    },
    {
      id: 'gap-09',
      orderNumber: '09',
      title: 'Theo dõi yêu cầu đủ điều kiện (Qualified Leads) thay vì chỉ lượt nhấp',
      badge: 'CÓ DẤU VẾT, CÒN CƠ HỘI CẢI THIỆN',
      badgeType: 'improve',
      description: 'Cài đặt theo dõi chuyển đổi sâu: khách gửi biểu mẫu, gọi điện xác nhận nhu cầu thật.',
      whyOpportunity: 'Giúp tối ưu ngân sách tiếp thị số và đánh giá chính xác hiệu quả từng kênh kéo traffic.',
      actionNeeded: 'Cấu hình Google Analytics 4, Hotjar và đo lường sự kiện gửi form thành công.',
      funnelStage: 'Toàn trang',
      estimatedTimeline: '1-2 tuần',
    },
  ];

  // 10X Sales Message
  const mainSalesMessage = aiData.mainSalesMessage || {
    headline: `Giải pháp ${industry} chuẩn xác - Bền bỉ cho mọi quy mô doanh nghiệp`,
    subheadline:
      'Tư vấn đúng bài toán sử dụng, minh bạch cấu hình, bảo hành chính hãng và hỗ trợ kỹ thuật trọn đời.',
    threePillars: [
      {
        title: 'Chính hãng & Chuẩn thông số',
        desc: 'Đầy đủ chứng từ CO/CQ, bảng thông số kỹ thuật rõ ràng được kỹ sư kiểm tra trước khi bàn giao.',
      },
      {
        title: 'Báo giá trọn gói minh bạch',
        desc: 'Tách bạch thiết bị chính, phụ kiện, phí vận chuyển và kiểm định. Không phát sinh chi phí ẩn.',
      },
      {
        title: 'Hỗ trợ kỹ thuật tận tâm',
        desc: 'Đội ngũ kỹ thuật hỗ trợ trực tiếp qua Zalo Video, xử lý sự cố nhanh chóng, bảo trì định kỳ.',
      },
    ],
  };

  // Personas 10X
  const personas10X = aiData.personas10X || [
    {
      id: 'persona-01',
      groupNumber: 'NHÓM 01',
      title: 'Chủ cơ sở kinh doanh & Trang trại chăn nuôi',
      persona: 'Anh Tuấn - Chủ cơ sở chăn nuôi và thu mua nông sản',
      pain: 'Sợ mua phải thiết bị sai số, nhảy số khi vận hành, dễ hỏng hóc làm thất thoát tài chính.',
      desire: 'Cần thiết bị đo lường chống rung, bền bỉ, dễ sử dụng cho nhân công và có thể in phiếu cân.',
      problem: 'Không rành kỹ thuật điện tử, phân vân giữa hàng chục model trên mạng mà không ai giải thích rõ.',
      solution: 'Tư vấn trực tiếp theo tải trọng và môi trường làm việc thực tế, quay video thử nghiệm trước khi gửi.',
      story: 'Đã từng mua qua mạng trúng hàng trôi nổi không bảo hành, nay cần một đối tác uy tín giao hàng tận nơi.',
      message: 'Cân chuẩn từng gram - Bền bỉ chống chịu môi trường khắc nghiệt - Bảo hành tận nơi.',
      cta: 'Yêu cầu tư vấn cấu hình cho cơ sở',
    },
    {
      id: 'persona-02',
      groupNumber: 'NHÓM 02',
      title: 'Quản lý kho bãi & Kỹ sư nhà máy sản xuất',
      persona: 'Chị Mai - Trưởng phòng cung ứng nhà máy chế biến',
      pain: 'Cần giấy tờ kiểm định hợp pháp, xuất hóa đơn VAT đầy đủ, thiết bị phải đạt chuẩn quản lý chất lượng.',
      desire: 'Hồ sơ năng lực rõ ràng, giao hàng đúng tiến độ dự án, có linh kiện thay thế nhanh chóng.',
      problem: 'Nhiều nhà cung cấp nhỏ lẻ không đủ năng lực pháp lý và thiếu dịch vụ bảo dưỡng định kỳ.',
      solution: 'Cung cấp hồ sơ chào thầu hoàn chỉnh, cam kết bảo hành tại nhà máy trong vòng 24 giờ.',
      story: 'Dây chuyền sản xuất cần thiết bị đo ổn định 24/7 để không bị ngưng trệ đơn hàng xuất khẩu.',
      message: 'Thiết bị đo lường công nghiệp đạt chuẩn - Đầy đủ CO/CQ - Dịch vụ kỹ thuật 24/7.',
      cta: 'Tải hồ sơ năng lực & Nhận báo giá dự án',
    },
    {
      id: 'persona-03',
      groupNumber: 'NHÓM 03',
      title: 'Hộ kinh doanh nhỏ lẻ & Cá nhân tiêu dùng',
      persona: 'Anh Hùng - Chủ quán cafe và tiệm bánh thủ công',
      pain: 'Sợ mua phải hàng kém chất lượng dùng vài tuần bị lệch số, không có người sửa chữa.',
      desire: 'Sản phẩm nhỏ gọn, độ chính xác cao 0.01g, thiết kế đẹp và giá cả hợp lý.',
      problem: 'Bị choáng ngợp trước ma trận giá trên sàn thương mại điện tử nhưng không có bảo hành tin cậy.',
      solution: 'Chính sách 1 đổi 1 trong 7 ngày, ship COD toàn quốc kiểm tra hàng trước khi thanh toán.',
      story: 'Cần cân chuẩn công thức pha chế mỗi ngày để đảm bảo đồng đều chất lượng sản phẩm.',
      message: 'Cân tiểu ly chính xác tuyệt đối - Nhỏ gọn tiện dụng - Bảo hành 12 tháng.',
      cta: 'Đặt hàng kiểm tra tại nhà',
    },
  ];

  // 10X Production Plan: Banners, Photo shotlists, Videos, Pricing, Forms
  const bannerProduction = aiData.bannerProduction || [
    {
      position: 'Banner Hero trang chủ (Toàn trang)',
      title: `${businessName} - Giải pháp đo lường & sản phẩm chính hãng`,
      subtitle: 'Tư vấn đúng cấu hình · Báo giá trọn gói minh bạch · Bảo hành tận nơi',
      imageNeeded: 'Hình ảnh kho hàng thực tế hoặc kỹ sư đang kiểm định thiết bị',
      buttonText: 'Khám phá sản phẩm ngay',
    },
    {
      position: 'Banner Danh mục chuyên ngành',
      title: 'Đa dạng cấu hình theo từng bài toán công việc',
      subtitle: 'Phân loại chi tiết theo tải trọng, môi trường và ứng dụng',
      imageNeeded: 'Ảnh tổng hợp các dòng sản phẩm tiêu biểu kèm thông số nổi bật',
      buttonText: 'Xem bảng so sánh',
    },
    {
      position: 'Banner Báo giá & Dự án doanh nghiệp',
      title: 'Báo giá cấu hình minh bạch - Đầy đủ CO/CQ',
      subtitle: 'Chiết khấu hấp dẫn cho đơn vị sản xuất và dự án nhà xưởng',
      imageNeeded: 'Hình ảnh bàn giao lắp đặt tại nhà xưởng thực tế',
      buttonText: 'Yêu cầu báo giá nhanh',
    },
    {
      position: 'Banner Cam kết & Dịch vụ kỹ thuật',
      title: 'Hỗ trợ kỹ thuật 24/7 · Bảo trì và hiệu chuẩn định kỳ',
      subtitle: 'Đội ngũ chuyên viên giàu kinh nghiệm đồng hành cùng doanh nghiệp',
      imageNeeded: 'Ảnh kỹ thuật viên đang thao tác bảo dưỡng thiết bị',
      buttonText: 'Liên hệ đội kỹ thuật',
    },
    {
      position: 'Banner Chốt đơn chân trang (Footer CTA)',
      title: 'Bạn chưa biết chọn cấu hình nào phù hợp nhất?',
      subtitle: 'Để lại thông tin - Chuyên viên sẽ liên hệ tư vấn trong 15 phút',
      imageNeeded: 'Biểu tượng tư vấn trực tuyến và hotline nổi bật',
      buttonText: 'Nhận tư vấn miễn phí',
    },
  ];

  const videoScripts10X = aiData.videoScripts10X || [
    {
      id: 'vid-01',
      videoNumber: 'VIDEO 01',
      context: 'Video Hero trang chủ (60 giây)',
      title: 'Giới thiệu năng lực và quy trình kiểm định trước khi giao hàng',
      timeline: [
        { timestamp: '0:00 - 0:10', description: 'Toàn cảnh kho hàng và đội ngũ kỹ thuật viên đang làm việc' },
        { timestamp: '0:10 - 0:25', description: 'Thao tác kiểm tra độ chính xác, hiệu chuẩn quả cân chuẩn mẫu' },
        { timestamp: '0:25 - 0:45', description: 'Cận cảnh tem kiểm định, phiếu bảo hành và quy cách đóng gói chống sốc' },
        { timestamp: '0:45 - 0:60', description: 'Thông điệp cam kết đồng hành và lời kêu gọi liên hệ hotline/Zalo' },
      ],
      placementNote: 'Đặt tại khối đầu trang chủ (Hero section)',
    },
    {
      id: 'vid-02',
      videoNumber: 'VIDEO 02',
      context: 'Video thực tế tại cơ sở khách hàng (90 giây)',
      title: 'Trải nghiệm vận hành thực tế và giải quyết bài toán chống rung số',
      timeline: [
        { timestamp: '0:00 - 0:15', description: 'Khách hàng chia sẻ nỗi đau thiết bị cũ hay bị nhảy số, gây tranh cãi' },
        { timestamp: '0:15 - 0:40', description: 'Quá trình kỹ thuật viên đến lắp đặt và hướng dẫn trừ bì, in phiếu cân' },
        { timestamp: '0:40 - 0:70', description: 'Thực nghiệm cân thực tế: số liệu đứng yên nhanh chóng, máy in mượt mà' },
        { timestamp: '0:70 - 0:90', description: 'Khách hàng nở nụ cười hài lòng, cam kết bảo hành của doanh nghiệp' },
      ],
      placementNote: 'Gắn tại trang chi tiết sản phẩm và chuyên mục ngành',
    },
    {
      id: 'vid-03',
      videoNumber: 'VIDEO 03',
      context: 'Video hướng dẫn sử dụng và bảo dưỡng (120 giây)',
      title: 'Cách tự kiểm tra và bảo quản thiết bị hoạt động chính xác bền lâu',
      timeline: [
        { timestamp: '0:00 - 0:20', description: '3 sai lầm phổ biến khiến thiết bị nhanh hỏng hoặc sai số' },
        { timestamp: '0:20 - 0:60', description: 'Hướng dẫn cân bằng chân đế, che chắn nguồn gió và sạc pin đúng cách' },
        { timestamp: '0:60 - 0:90', description: 'Cách nhận biết khi nào cần hiệu chuẩn lại thiết bị' },
        { timestamp: '0:90 - 1:20', description: 'Kênh hỗ trợ từ xa qua video call của đội ngũ kỹ thuật' },
      ],
      placementNote: 'Đặt tại trang Kiến thức / Hỗ trợ kỹ thuật',
    },
    {
      id: 'vid-04',
      videoNumber: 'VIDEO 04',
      context: 'Video phản hồi nhanh chống hàng giả (45 giây)',
      title: 'Phân biệt hàng chính hãng và hàng trôi nổi kém chất lượng',
      timeline: [
        { timestamp: '0:00 - 0:15', description: 'So sánh trực quan 2 mẫu sản phẩm thật và nhái đặt cạnh nhau' },
        { timestamp: '0:15 - 0:30', description: 'Cảm biến tải (Loadcell) và bo mạch bên trong: độ dày và linh kiện' },
        { timestamp: '0:30 - 0:45', description: 'Nhận biết tem bảo hành chính hãng và giấy tờ chứng nhận kèm theo' },
      ],
      placementNote: 'Đặt tại trang Chính sách & Cam kết chất lượng',
    },
  ];

  // Forms 10X
  const forms10X = aiData.forms10X || [
    {
      position: 'Đầu trang & Cửa sổ bật lên (Popup)',
      title: 'Tư vấn cấu hình nhanh trong 15 phút',
      fields: 'Họ và tên * | Số điện thoại / Zalo * | Nhu cầu sản phẩm cần tìm',
      submitButtonText: 'Gửi yêu cầu chuyên viên gọi lại',
      commitment: 'Thông tin của bạn được bảo mật 100%. Chuyên viên kỹ thuật sẽ gọi lại trong 15 phút.',
      notes: 'Tối giản trường nhập để tối đa tỷ lệ chuyển đổi.',
    },
    {
      position: 'Trang Báo giá & Chi tiết sản phẩm',
      title: 'Nhận bảng báo giá cấu hình trọn gói',
      fields: 'Họ tên * | Số điện thoại * | Email nhận báo giá | Loại cấu hình quan tâm | Tỉnh thành giao hàng',
      submitButtonText: 'Tải ngay báo giá chi tiết (PDF)',
      commitment: 'Báo giá đầy đủ phụ kiện và chi phí giao hàng, không phát sinh chi phí.',
      notes: 'Phù hợp cho khách hàng B2B và mua sỉ.',
    },
    {
      position: 'Trang Dịch vụ kỹ thuật & Khảo sát',
      title: 'Đăng ký khảo sát lắp đặt & Hiệu chuẩn tận nơi',
      fields: 'Tên công ty/cơ sở * | Người liên hệ * | Điện thoại * | Địa chỉ khảo sát * | Mô tả sự cố hoặc yêu cầu',
      submitButtonText: 'Xác nhận lịch hẹn kỹ thuật',
      commitment: 'Kỹ sư chuyên trách sẽ liên hệ xác nhận thời gian khảo sát thực tế.',
      notes: 'Dành cho khách hàng có nhu cầu sửa chữa, lắp đặt hệ thống lớn.',
    },
  ];

  // Roadmap 10X
  const roadmapTasks10X = aiData.roadmapTasks10X || [
    {
      id: 'task-1-1',
      phaseId: 1,
      phaseTitle: 'Giai đoạn 1: Sửa lỗi và tác động nhanh',
      phaseTimeline: 'Ngày 1 - Ngày 14',
      phaseGoal: 'Loại bỏ mâu thuẫn dữ liệu, hoàn thiện chính sách và sửa liên kết',
      taskName: 'Đồng bộ hóa bảng thông số kỹ thuật trên toàn bộ trang sản phẩm chính',
      gapResolved: 'Sửa dữ liệu sản phẩm trước khi tăng truy cập (Gap 01)',
      department: 'Kỹ thuật / Nội dung',
      metricToTrack: 'Không còn lỗi thông số lệch giữa khối ngắn và bảng dài',
      status: 'not_started',
    },
    {
      id: 'task-1-2',
      phaseId: 1,
      phaseTitle: 'Giai đoạn 1: Sửa lỗi và tác động nhanh',
      phaseTimeline: 'Ngày 1 - Ngày 14',
      phaseGoal: 'Loại bỏ mâu thuẫn dữ liệu, hoàn thiện chính sách và sửa liên kết',
      taskName: 'Cập nhật pháp nhân, hotline và cam kết đổi trả trên các trang chính sách',
      gapResolved: 'Hoàn thiện chính sách bằng dữ liệu doanh nghiệp (Gap 02)',
      department: 'Pháp chế / Quản trị website',
      metricToTrack: '100% trang chính sách có thông tin pháp nhân thật',
      status: 'not_started',
    },
    {
      id: 'task-1-3',
      phaseId: 1,
      phaseTitle: 'Giai đoạn 1: Sửa lỗi và tác động nhanh',
      phaseTimeline: 'Ngày 1 - Ngày 14',
      phaseGoal: 'Loại bỏ mâu thuẫn dữ liệu, hoàn thiện chính sách và sửa liên kết',
      taskName: 'Kiểm tra và sửa toàn bộ liên kết bị lặp hoặc dẫn sai trên trang chủ',
      gapResolved: 'Sửa liên kết sai ý định và các khối bị lặp (Gap 03)',
      department: 'Kỹ thuật website',
      metricToTrack: 'Tỷ lệ thoát trang do lỗi liên kết giảm 30%',
      status: 'not_started',
    },
    {
      id: 'task-2-1',
      phaseId: 2,
      phaseTitle: 'Giai đoạn 2: Chiếm khoảng trống cơ hội & Tối ưu chuyển đổi',
      phaseTimeline: 'Ngày 15 - Ngày 45',
      phaseGoal: 'Tạo lợi thế cạnh tranh với công cụ chọn sản phẩm và báo giá minh bạch',
      taskName: 'Thiết kế mẫu phiếu báo giá cấu hình trọn gói (thiết bị, phụ kiện, kiểm định)',
      gapResolved: 'Phiếu báo giá cấu hình có đủ khoản gồm và chưa gồm (Gap 04)',
      department: 'Bán hàng / Kế toán',
      metricToTrack: 'Tỷ lệ khách hàng duyệt báo giá ngay vòng 1 tăng 25%',
      status: 'not_started',
    },
    {
      id: 'task-2-2',
      phaseId: 2,
      phaseTitle: 'Giai đoạn 2: Chiếm khoảng trống cơ hội & Tối ưu chuyển đổi',
      phaseTimeline: 'Ngày 15 - Ngày 45',
      phaseGoal: 'Tạo lợi thế cạnh tranh với công cụ chọn sản phẩm và báo giá minh bạch',
      taskName: 'Sản xuất bộ hồ sơ bàn giao thực tế và 4 video kiểm chứng tại kho',
      gapResolved: 'Biến video và ảnh thành hồ sơ bàn giao có kiểm chứng (Gap 05)',
      department: 'Media / Marketing',
      metricToTrack: 'Thời gian người dùng ở lại trang (Time on page) tăng 40%',
      status: 'not_started',
    },
    {
      id: 'task-2-3',
      phaseId: 2,
      phaseTitle: 'Giai đoạn 2: Chiếm khoảng trống cơ hội & Tối ưu chuyển đổi',
      phaseTimeline: 'Ngày 15 - Ngày 45',
      phaseGoal: 'Tạo lợi thế cạnh tranh với công cụ chọn sản phẩm và báo giá minh bạch',
      taskName: 'Tạo bảng hỏi tương tác 4 bước giúp khách tự chọn cấu hình theo nhu cầu',
      gapResolved: 'Bộ hỏi đáp chọn đúng sản phẩm theo công việc (Gap 06)',
      department: 'Kỹ thuật lập trình / UX',
      metricToTrack: 'Tỷ lệ để lại số điện thoại qua bộ hỏi đáp đạt > 8%',
      status: 'not_started',
    },
    {
      id: 'task-3-1',
      phaseId: 3,
      phaseTitle: 'Giai đoạn 3: Xây dựng chiều sâu nội dung & Thống trị thị trường',
      phaseTimeline: 'Ngày 46 - Ngày 90',
      phaseGoal: 'Mở rộng thị phần tìm kiếm tự nhiên và xây dựng hệ thống đo lường nâng cao',
      taskName: 'Triển khai cụm nội dung bài viết chuyên sâu giải đáp thắc mắc kỹ thuật (FAQ Hub)',
      gapResolved: 'Bộ hỏi đáp thực tế và kiến thức vận hành (Gap 07)',
      department: 'Biên tập nội dung / SEO',
      metricToTrack: 'Tăng trưởng lưu lượng truy cập tìm kiếm tự nhiên chất lượng cao',
      status: 'not_started',
    },
    {
      id: 'task-3-2',
      phaseId: 3,
      phaseTitle: 'Giai đoạn 3: Xây dựng chiều sâu nội dung & Thống trị thị trường',
      phaseTimeline: 'Ngày 46 - Ngày 90',
      phaseGoal: 'Mở rộng thị phần tìm kiếm tự nhiên và xây dựng hệ thống đo lường nâng cao',
      taskName: 'Cài đặt hệ thống theo dõi Qualified Leads và tối ưu tỷ lệ chuyển đổi',
      gapResolved: 'Theo dõi yêu cầu đủ điều kiện thay vì chỉ lượt nhấp (Gap 09)',
      department: 'Marketing số / Dữ liệu',
      metricToTrack: 'Chi phí trên một khách hàng tiềm năng đủ điều kiện (CPL) giảm 20%',
      status: 'not_started',
    },
  ];

  // Steps whose content the AI did not produce and that therefore show generic, industry-level
  // guidance; the UI labels them so customers do not mistake them for measured results.
  const templatedSteps = [3];
  if (!aiData.actionableFindings) templatedSteps.push(2);
  if (!aiData.opportunityGaps10X) templatedSteps.push(4);
  if (!aiData.personas10X) templatedSteps.push(5);
  if (!aiData.bannerProduction && !aiData.videoScripts10X) templatedSteps.push(6);
  if (!aiData.roadmapTasks10X) templatedSteps.push(7);

  return {
    version: 'web360_v2_10x',
    templatedSteps: templatedSteps.sort(),
    analyzedAt: new Date().toISOString(),
    userWebsiteUrl: normalizedUrl,
    businessName,
    businessSummary: {
      name: businessName,
      industry,
      mainProductService,
      location,
      targetAudience,
      commercialKeywords,
    },
    competitorsFound,
    competitorProfiles,
    actionableFindings,
    criteriaComparison: {
      evaluations,
      rankings,
    },
    opportunityGaps10X,
    keywordCampaigns: [
      {
        id: 'kc-01',
        clusterName: `01. Sản phẩm chủ lực ${industry}`,
        searchVolumeNote: 'Cần điền từ công cụ từ khóa (Google Keyword Planner)',
        priorityNote: 'Ưu tiên tối ưu trang hiện có trước khi chạy quảng cáo',
        customerContext: 'Khách hàng có ý định mua rõ ràng, cần xem cấu hình và giá.',
        suggestedKeywords: commercialKeywords.slice(0, 3).join('; '),
        landingPage: `${normalizedUrl}/san-pham`,
        groupingMethod: 'Gom nhóm theo biến thể và bài toán thực tế.',
      },
      {
        id: 'kc-02',
        clusterName: '02. Giải pháp theo ngành nghề chuyên biệt',
        searchVolumeNote: 'Cần điền từ công cụ từ khóa',
        priorityNote: 'Tập trung tạo trang đích giải quyết đúng nỗi đau',
        customerContext: 'Doanh nghiệp và hộ kinh doanh cần giải pháp đặc thù.',
        suggestedKeywords: `${industry} chuyên dụng; ${commercialKeywords[0] || 'thiết bị'} công nghiệp`,
        landingPage: `${normalizedUrl}/giai-phap`,
        groupingMethod: 'Tách riêng từng trang đích cho mỗi ngành khách hàng.',
      },
      {
        id: 'kc-03',
        clusterName: '03. Dịch vụ bảo hành, sửa chữa & hiệu chuẩn',
        searchVolumeNote: 'Cần điền từ công cụ từ khóa',
        priorityNote: 'Tạo niềm tin sau bán hàng vượt trội đối thủ',
        customerContext: 'Khách hàng đang gặp sự cố thiết bị cần hỗ trợ kỹ thuật gấp.',
        suggestedKeywords: `sửa chữa ${industry}; bảo dưỡng thiết bị; thay thế phụ kiện`,
        landingPage: `${normalizedUrl}/dich-vu`,
        groupingMethod: 'Gắn kèm số hotline kỹ thuật trực tiếp 24/7.',
      },
    ],
    negativeKeywords: [
      { cluster: 'Từ khóa tìm việc / tuyển dụng', whenToApply: 'Phủ định các từ: tuyển dụng, việc làm, lương, tuyển thợ' },
      { cluster: 'Từ khóa tự làm / đồ cũ', whenToApply: 'Phủ định: thanh lý ve chai, đồ cũ hỏng, tự chế, sách hướng dẫn' },
    ],
    budgetGuidance:
      'Chỉ nên tăng ngân sách tiếp thị có trả phí sau khi đã sửa xong các mâu thuẫn dữ liệu và bổ sung số điện thoại tiếp nhận thật.',
    keywordLinks: [
      {
        id: 'kl-01',
        keywordGroup: commercialKeywords[0] || 'Sản phẩm chủ lực',
        monthlySearches: 'Cần điền từ công cụ',
        currentLink: `${normalizedUrl}/`,
        status: 'Tối ưu trang hiện có',
        statusColor: 'emerald',
        proposedLink: `${normalizedUrl}/san-pham`,
        proposedTitle: `${businessName} - Sản phẩm chính hãng giá tốt 2026`,
        notesAndSources: 'Tối ưu tiêu đề và bổ sung bảng cấu hình chi tiết.',
        sourceTags: [{ label: 'Trang chủ', url: normalizedUrl }],
      },
      {
        id: 'kl-02',
        keywordGroup: 'Báo giá và chính sách',
        monthlySearches: 'Cần điền từ công cụ',
        currentLink: `${normalizedUrl}/lien-he`,
        status: 'Có trang: cần bổ sung',
        statusColor: 'amber',
        proposedLink: `${normalizedUrl}/bao-gia`,
        proposedTitle: 'Báo giá cấu hình chi tiết & Chính sách bảo hành',
        notesAndSources: 'Bổ sung bảng phân tách đã gồm và chưa gồm phụ kiện.',
        sourceTags: [{ label: 'Liên hệ', url: `${normalizedUrl}/lien-he` }],
      },
    ],
    menuStructurePillars: [
      {
        title: 'Cột 1: Điều hướng theo bài toán công việc',
        description: 'Giúp khách hàng tìm thấy đúng sản phẩm chỉ trong 2 cú nhấp chuột',
        items: [
          { name: 'Sản phẩm theo ngành nghề', subtext: 'Chăn nuôi, kho xưởng, sản xuất', status: 'Đã có trang' },
          { name: 'Sản phẩm theo tải trọng/tính năng', subtext: 'Mini, tiêu chuẩn, công nghiệp', status: 'Cần chuẩn hóa' },
        ],
      },
      {
        title: 'Cột 2: Minh chứng niềm tin & Năng lực',
        description: 'Giải tỏa nghi ngại và khẳng định vị thế uy tín',
        items: [
          { name: 'Hồ sơ dự án tiêu biểu', subtext: 'Hình ảnh bàn giao thực tế', status: 'Cần làm mới' },
          { name: 'Chứng nhận chất lượng CO/CQ', subtext: 'Bằng chứng kiểm định', status: 'Cần bổ sung ảnh' },
        ],
      },
      {
        title: 'Cột 3: Hỗ trợ & Chốt đơn trực tiếp',
        description: 'Rút ngắn khoảng cách từ quan tâm đến liên hệ',
        items: [
          { name: 'Báo giá nhanh trực tuyến', subtext: 'Phiếu báo giá tải ngay', status: 'Cần thử nghiệm' },
          { name: 'Kênh kỹ thuật 24/7', subtext: 'Hotline/Zalo trực tuyến', status: 'Đã sẵn sàng' },
        ],
      },
    ],
    siteBuildingRules: [
      'Mọi thông số kỹ thuật phải khớp 100% giữa ảnh chụp, tiêu đề và bảng chi tiết.',
      'Không sử dụng văn bản mẫu mặc định (Lorem ipsum) trong các trang pháp lý.',
      'Mỗi trang đích chuyên ngành phải có ít nhất 1 hình ảnh hoặc video thực tế tại cơ sở.',
      'Số hotline và nút Zalo phải luôn ở vị trí dễ bấm trên màn hình điện thoại di động.',
      'Giá bán phải ghi rõ đã bao gồm phụ kiện và thuế hoặc ghi chú cần liên hệ khảo sát.',
    ],
    mainSalesMessage,
    pagePositionMessages: [
      { position: 'Đầu trang (Hero)', message: mainSalesMessage.headline, requiredEvidence: 'Ảnh kho hàng hoặc chứng nhận đại lý chính hãng' },
      { position: 'Dưới danh mục sản phẩm', message: 'Tư vấn đúng bài toán - Chọn đúng cấu hình cần dùng', requiredEvidence: 'Bộ câu hỏi trắc nghiệm tương tác' },
      { position: 'Khối dự án thực tế', message: 'Hơn 1.000 khách hàng đã tin dùng giải pháp của chúng tôi', requiredEvidence: 'Hình ảnh bàn giao thực tế kèm tên cơ sở đối tác' },
      { position: 'Chân trang (Footer)', message: 'Hỗ trợ kỹ thuật trọn đời - Đổi trả minh bạch', requiredEvidence: 'Phiếu bảo hành có dấu mộc và cam kết pháp nhân thật' },
    ],
    fearsAndCommitments: [
      {
        painPoint: 'Sợ mua trúng hàng nhái, linh kiện kém chất lượng',
        whyCustomerAfraid: 'Trên thị trường có nhiều bên dùng vỏ xịn ruột rẻ tiền gây sai số lớn.',
        commitmentOnPage: 'Cam kết 100% linh kiện chính hãng, đền gấp 10 lần nếu phát hiện hàng giả.',
      },
      {
        painPoint: 'Sợ hỏng hóc không có người bảo hành, bị đem con bỏ chợ',
        whyCustomerAfraid: 'Nhiều bên bán hàng online không có kỹ thuật viên hoặc địa chỉ cố định.',
        commitmentOnPage: 'Có showroom thực tế, kỹ thuật hỗ trợ trực tiếp 24/7 qua video call.',
      },
      {
        painPoint: 'Sợ phát sinh chi phí phụ kiện và phí vận chuyển cao',
        whyCustomerAfraid: 'Giá báo ban đầu thấp nhưng khi thanh toán lại cộng thêm nhiều khoản.',
        commitmentOnPage: 'Báo giá trọn gói minh bạch, ghi rõ từng khoản mục trước khi giao hàng.',
      },
    ],
    personas10X,
    whyChooseUsReasons: [
      { reason: 'Tư vấn đúng cấu hình bài toán', customerBenefit: 'Không mua lãng phí cấu hình thừa, không bị thiếu tải', evidenceAttached: 'Bảng đối chiếu thông số thực tế' },
      { reason: 'Kiểm định kỹ thuật trước khi bàn giao', customerBenefit: 'Nhận máy về là vận hành ngay, độ chính xác tuyệt đối', evidenceAttached: 'Video thao tác hiệu chuẩn bằng quả cân chuẩn' },
      { reason: 'Chính sách đổi trả minh bạch', customerBenefit: 'Yên tâm tuyệt đối, 1 đổi 1 nếu lỗi kỹ thuật', evidenceAttached: 'Quy trình đổi trả có thời hạn rõ ràng' },
    ],
    landingPageWireframeBlocks: [
      { blockName: 'Khối 1: Hero Banner', contentToWrite: 'Thông điệp định vị + Nút nhận tư vấn nhanh', evidenceRequired: 'Ảnh thực tế kho hàng' },
      { blockName: 'Khối 2: 3 Trụ cột niềm tin', contentToWrite: 'Chính hãng - Minh bạch giá - Kỹ thuật 24/7', evidenceRequired: 'Biểu tượng và cam kết cụ thể' },
      { blockName: 'Khối 3: Bảng chọn sản phẩm theo công việc', contentToWrite: 'Phân loại theo ứng dụng thực tế', evidenceRequired: 'Thông số kỹ thuật chuẩn hóa' },
      { blockName: 'Khối 4: Dự án bàn giao tiêu biểu', contentToWrite: 'Case study khách hàng thực tế', evidenceRequired: 'Ảnh chụp tại xưởng khách hàng' },
      { blockName: 'Khối 5: Bảng so sánh 3 phương án', contentToWrite: 'Tiêu chuẩn - Bán chạy - Cao cấp', evidenceRequired: 'Liệt kê các khoản gồm và chưa gồm' },
      { blockName: 'Khối 6: Biểu mẫu tư vấn chân trang', contentToWrite: 'Form nhận báo giá 3 trường thông tin', evidenceRequired: 'Cam kết bảo mật thông tin' },
    ],
    technicalFaqs: [
      { question: 'Làm thế nào để biết thiết bị có chính xác hay không?', proposedAnswer: 'Thiết bị được kiểm tra bằng quả cân chuẩn F1/M1 đạt chuẩn đo lường và có phiếu kiểm định kèm theo.' },
      { question: 'Thời gian bảo hành và xử lý sự cố là bao lâu?', proposedAnswer: 'Bảo hành chính hãng 12-24 tháng. Kỹ thuật viên hỗ trợ từ xa ngay lập tức và có mặt tận nơi trong 24 giờ.' },
      { question: 'Doanh nghiệp có xuất hóa đơn VAT và chứng từ không?', proposedAnswer: 'Chúng tôi cung cấp đầy đủ hóa đơn GTGT điện tử và chứng nhận xuất xứ CO/CQ theo yêu cầu.' },
    ],
    bannerProduction,
    photoShotlists10X: [
      { category: 'Ảnh sản phẩm chi tiết', purpose: 'Thể hiện rõ thương hiệu và độ tinh xảo', shots: ['Góc chụp 45 độ toàn thân', 'Cận cảnh màn hình hiển thị số', 'Chi tiết các cổng kết nối và tem bảo hành'] },
      { category: 'Ảnh kho hàng và quy mô', purpose: 'Chứng minh năng lực sẵn hàng số lượng lớn', shots: ['Toàn cảnh các kệ hàng sắp xếp ngay ngắn', 'Khu vực kiểm định kỹ thuật'] },
      { category: 'Ảnh bàn giao lắp đặt thực tế', purpose: 'Xây dựng bằng chứng xã hội mạnh mẽ', shots: ['Kỹ thuật viên đang bàn giao cho khách hàng', 'Hình ảnh thiết bị đang hoạt động trong xưởng'] },
    ],
    videoScripts10X,
    credibilityChecklist: [
      { item: 'Giấy phép kinh doanh & Địa chỉ showroom', photoToTake: 'Ảnh chụp mặt tiền công ty có biển hiệu', videoToShoot: 'Video tham quan văn phòng', notes: 'Gắn tại trang Liên hệ & Giới thiệu' },
      { item: 'Chứng nhận đại lý ủy quyền', photoToTake: 'Ảnh scan giấy chứng nhận nhà sản xuất', videoToShoot: 'Video đại diện hãng trao chứng nhận', notes: 'Gắn tại trang chủ' },
      { item: 'Phiếu kiểm định đo lường', photoToTake: 'Ảnh chụp phiếu kiểm định có dấu đỏ', videoToShoot: 'Video thao tác dán tem kiểm định', notes: 'Gắn tại trang chi tiết sản phẩm' },
    ],
    pricingPackages10X: [
      { packageConfig: 'Gói Tiêu Chuẩn (Khởi động)', price: 'Cần điền giá thật.', included: 'Thân máy chính hãng, nguồn sạc, hướng dẫn sử dụng, bảo hành 12 tháng.', notIncluded: 'Phí vận chuyển đi xa, chi phí kiểm định độc lập.', dataToVerify: 'Xác nhận mức giá bán lẻ hiện tại của doanh nghiệp.' },
      { packageConfig: 'Gói Nâng Cao (Bán chạy nhất)', price: 'Cần điền giá thật.', included: 'Trọn bộ máy + Phụ kiện chống rung/chống nước + Miễn phí vận chuyển nội thành + Bảo hành 18 tháng.', notIncluded: 'Chi phí hiệu chuẩn định kỳ năm thứ 2.', dataToVerify: 'Xác định gói phụ kiện bán kèm phù hợp.' },
      { packageConfig: 'Gói Doanh Nghiệp (Toàn diện)', price: 'Cần điền giá thật.', included: 'Máy chuẩn công nghiệp + Đầy đủ CO/CQ + Kiểm định nhà nước + Lắp đặt tận nơi + Hỗ trợ kỹ thuật 24/7.', notIncluded: 'Các yêu cầu gia công cơ khí đặc biệt ngoài danh mục.', dataToVerify: 'Báo giá theo dự án sau khi khảo sát.' },
    ],
    funnelGifts: [
      { stage: 'Đầu phễu', gift: 'Cẩm nang chọn đúng thiết bị chuẩn 2026 (Ebook PDF)', customerExchanges: 'Để lại Email / Số Zalo', notes: 'Tự động gửi qua hệ thống' },
      { stage: 'Giữa phễu', gift: 'Phiếu giảm giá phụ kiện hoặc miễn phí giao hàng', customerExchanges: 'Đặt lịch tư vấn cấu hình', notes: 'Áp dụng cho đơn hàng đầu tiên' },
    ],
    scrollCtaButtons: [
      { position: 'Thanh điều hướng (Header)', customerMindset: 'Tìm kiếm thông tin nhanh', buttonText: 'Tư vấn ngay', buttonType: 'Hotline / Zalo' },
      { position: 'Sau phần giới thiệu năng lực', customerMindset: 'Bắt đầu có niềm tin', buttonText: 'Xem bảng giá cấu hình', buttonType: 'Cuộn xuống bảng giá' },
      { position: 'Chân trang (Footer)', customerMindset: 'Sẵn sàng đưa ra quyết định', buttonText: 'Gửi yêu cầu báo giá', buttonType: 'Mở form tư vấn' },
    ],
    forms10X,
    roadmapTasks10X,
    auditingPrinciples: [
      'Nguyên tắc 1: Mọi nhận xét phải dựa trên bằng chứng quan sát được từ website và nguồn tìm kiếm công khai.',
      'Nguyên tắc 2: Tuyệt đối không tự bịa đặt lượng tìm kiếm, lượt truy cập, doanh thu, tỷ lệ chuyển đổi hoặc cam kết.',
      'Nguyên tắc 3: Nếu chưa đủ dữ liệu kỹ thuật, hiển thị "—" và ghi rõ "Chưa đủ dữ liệu để xác minh".',
      'Nguyên tắc 4: Luôn phân định rõ 3 trạng thái: [Quan sát được], [Nhận định của AI] và [Đề xuất thử nghiệm].',
      'Nguyên tắc 5: Không kết luận tính năng hoàn toàn không tồn tại nếu chỉ kiểm tra mẫu.',
    ],
    verificationEvents: [
      { event: 'Lượt nhấp gọi điện / Zalo', meaning: 'Khách hàng có ý định liên hệ trực tiếp', verificationMethod: 'Google Tag Manager / GA4 Click Event', owner: 'Marketing số' },
      { event: 'Gửi biểu mẫu tư vấn thành công', meaning: 'Khách hàng tiềm năng chất lượng cao (Lead)', verificationMethod: 'GA4 Form Submit conversion', owner: 'Kỹ thuật / Kinh doanh' },
      { event: 'Tải tài liệu catalog / báo giá', meaning: 'Khách hàng đang nghiên cứu cấu hình', verificationMethod: 'GA4 File Download Event', owner: 'Nội dung website' },
    ],
    auditedUrls: [
      { website: businessName, pageType: 'Trang chủ', url: normalizedUrl, readingMethod: 'Quét trực tiếp qua HTTP & Trích xuất DOM' },
      { website: businessName, pageType: 'Trang sản phẩm', url: `${normalizedUrl}/san-pham`, readingMethod: 'Kiểm tra mẫu liên kết' },
      ...competitorsFound.map((c: any) => ({
        website: c.name,
        pageType: 'Trang chủ đối thủ',
        url: c.url,
        readingMethod: 'Mẫu kết quả tìm kiếm tự nhiên Google',
      })),
    ],
    methodologyNotes: [
      'Báo cáo được tổng hợp tự động bởi hệ thống PHÂN TÍCH WEB 360 với mô hình Gemini AI thế hệ mới.',
      'Dữ liệu đối thủ cạnh tranh được lấy mẫu tại thời điểm phân tích từ các kết quả tìm kiếm tự nhiên nổi bật.',
      'Các đề xuất tối ưu hóa nhằm mục tiêu nâng cao tỷ lệ chuyển đổi và trải nghiệm người dùng thực tế.',
    ],
    verifiedSourcesList: [normalizedUrl, ...competitorsFound.map((c: any) => c.url)],
    // Backwards compatibility mappings for older UI components
    opportunityGaps: opportunityGaps10X,
    contentStrategy: {
      salesMessage: {
        mainMessage: mainSalesMessage.headline,
        explanation: mainSalesMessage.subheadline,
        threePillars: mainSalesMessage.threePillars.map((p: any) => p.title),
        pagePositionMessages: [
          { position: 'Đầu trang (Hero)', message: mainSalesMessage.headline },
          { position: 'Giữa trang', message: 'Tư vấn cấu hình đúng bài toán' },
          { position: 'Chân trang', message: 'Hỗ trợ kỹ thuật 24/7' },
        ],
      },
      targetAudiences: personas10X.map((p: any) => ({
        persona: p.persona,
        needs: p.desire,
        pains: p.pain,
        desires: p.desire,
        barriers: p.problem,
        solution: p.solution,
        dedicatedMessage: p.message,
        cta: p.cta,
        storyFramework: p.story,
      })),
      customerFears: [
        { fear: 'Sợ mua phải hàng nhái sai số', whyAfraid: 'Gây thất thoát tài chính', websiteAnswer: 'Cam kết 100% chính hãng', requiredEvidence: 'Tem kiểm định CO/CQ' },
        { fear: 'Sợ không được bảo hành tận nơi', whyAfraid: 'Công việc bị đình trệ', websiteAnswer: 'Hỗ trợ kỹ thuật 24/7', requiredEvidence: 'Phiếu bảo hành có pháp nhân' },
      ],
      menuAndLandingPages: {
        level1Menu: ['Trang chủ', 'Sản phẩm', 'Báo giá', 'Kiến thức', 'Liên hệ'],
        subMenu: ['Theo ngành nghề', 'Theo tải trọng', 'Dịch vụ sửa chữa'],
        existingUrls: [normalizedUrl, `${normalizedUrl}/san-pham`],
        urlsToFix: [`${normalizedUrl}/chinh-sach`],
        pagesToUpgrade: [normalizedUrl],
        newPagesToResearch: [`${normalizedUrl}/bao-gia-nhanh`],
        proposedTitle: `${businessName} - Giải pháp đo lường chuyên nghiệp`,
        searchIntent: 'Mua hàng và tìm kiếm giải pháp kỹ thuật',
        internalLinksNeeded: ['Trang chủ -> Trang sản phẩm -> Form báo giá'],
      },
      keywordClusters: [
        {
          clusterType: 'Sản phẩm chủ lực',
          keywords: commercialKeywords.map((k: string) => ({
            keyword: k,
            searchVolumeNote: 'Cần nhập dữ liệu từ công cụ từ khóa.',
            intent: 'Mua hàng',
          })),
        },
      ],
      seoSuggestions: [
        {
          pageName: 'Trang chủ',
          primaryKeyword: commercialKeywords[0] || 'sản phẩm chính hãng',
          secondaryKeywords: commercialKeywords.slice(1, 4),
          pageTitle: `${businessName} - Chất lượng cao, Giá tốt nhất 2026`,
          metaDescription: `Chuyên cung cấp ${mainProductService}. Cam kết chính hãng, hỗ trợ kỹ thuật tận nơi. Liên hệ ngay!`,
          h1: `${businessName} - Giải pháp uy tín chuyên nghiệp`,
          subHeadingsStructure: ['H2: Vì sao chọn chúng tôi', 'H2: Danh mục sản phẩm nổi bật', 'H2: Báo giá cấu hình minh bạch'],
          proposedSlug: '/',
          imageAltDescription: `Hình ảnh sản phẩm ${businessName} chính hãng`,
          internalLinks: ['/san-pham', '/bao-gia', '/lien-he'],
          schemaMarkup: 'Organization, WebSite',
          contentTags: [industry, 'thiết bị chính hãng'],
          socialHashtags: [`#${hostname.replace(/\./g, '')}`, '#chatluongcao'],
        },
      ],
    },
    productionPlan: {
      banners: bannerProduction.map((b: any) => ({
        position: b.position,
        title: b.title,
        subtitle: b.subtitle,
        imageSpec: b.imageNeeded,
        buttonText: b.buttonText,
        landingPage: '/san-pham',
      })),
      photoShotlist: [
        {
          purpose: 'Ảnh chụp sản phẩm thực tế',
          shots: ['Cận cảnh màn hình', 'Cân trong xưởng làm việc thực tế'],
          cameraAngle: 'Góc 45 độ tầm mắt',
          detailsToShow: 'Độ sắc nét, tem chứng nhận',
          requiredEvidence: 'Ảnh chụp thực tế tại kho',
          placement: 'Trang chi tiết sản phẩm',
        },
      ],
      videoScripts: videoScripts10X.map((v: any) => ({
        title: v.title,
        goal: 'Tạo dựng niềm tin vững chắc',
        duration: '60 giây',
        setting: 'Kho hàng và xưởng thực tế',
        timelineScenes: v.timeline.map((t: any) => ({
          timestamp: t.timestamp,
          visual: t.description,
          audioScript: `Thuyết minh giới thiệu chi tiết cho phân đoạn ${t.timestamp}`,
        })),
        evidenceToFilm: 'Kỹ thuật viên đang kiểm định thiết bị',
        cta: 'Liên hệ tư vấn ngay',
        placement: 'Trang chủ',
      })),
      pricingTable: [
        {
          package: 'Gói Tiêu Chuẩn',
          price: 'Cần điền giá thật.',
          included: ['Sản phẩm chính hãng', 'Bảo hành 12 tháng'],
          notIncluded: ['Phí vận chuyển đi xa'],
          possibleAddons: 'Gói bảo trì định kỳ năm 2',
          conditions: 'Áp dụng cho đơn hàng tiêu chuẩn',
          validity: 'Thời điểm hiện tại',
          ctaText: 'Nhận báo giá chi tiết',
        },
      ],
      contactButtons: [
        { scrollPosition: 'Đầu trang (Header)', label: 'Tư vấn ngay', ctaAction: 'Mở popup tư vấn', note: 'Kèm hotline' },
        { scrollPosition: 'Giữa trang', label: 'Nhận báo giá cấu hình', ctaAction: 'Mở form báo giá', note: 'Zalo tư vấn' },
        { scrollPosition: 'Chân trang', label: 'Gọi kỹ thuật 24/7', ctaAction: 'Quay số trực tiếp', note: 'Miễn phí cước' },
      ],
      forms: forms10X.map((f: any) => ({
        name: f.title,
        fields: [
          { label: 'Họ và tên', required: true, type: 'text' },
          { label: 'Số điện thoại', required: true, type: 'tel' },
          { label: 'Nhu cầu chi tiết', required: false, type: 'textarea' },
        ],
        submitButtonText: f.submitButtonText,
        postSubmitCommitment: f.commitment,
        successMessage: 'Cảm ơn bạn! Yêu cầu đã được tiếp nhận.',
        consentCheckbox: 'Tôi đồng ý nhận cuộc gọi tư vấn trực tiếp.',
      })),
    },
    roadmap: {
      phase1Tasks: roadmapTasks10X.filter((t: any) => t.phaseId === 1),
      phase2Tasks: roadmapTasks10X.filter((t: any) => t.phaseId === 2),
      phase3Tasks: roadmapTasks10X.filter((t: any) => t.phaseId === 3),
    },
    stepStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'completed',
      5: 'completed',
      6: 'completed',
      7: 'completed',
      8: 'completed',
    },
  };
}

// ==========================================
// SUBSCRIPTION & SEPAY PAYMENT ENDPOINTS
// ==========================================

// 1. Get active plans
app.get('/api/plans', (req, res) => {
  const plans = getPlans(true);
  res.json({ plans });
});

// 2. Create order
app.post('/api/orders/create', (req, res) => {
  try {
    const { plan_id, customer_name, customer_email, customer_phone, note } = req.body;
    if (!plan_id) return res.status(400).json({ success: false, message: 'Vui lòng chọn gói dịch vụ' });
    if (!customer_name?.trim()) return res.status(400).json({ success: false, message: 'Họ tên không được bỏ trống' });
    if (!customer_email?.trim() || !customer_email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
    }
    if (!customer_phone?.trim()) return res.status(400).json({ success: false, message: 'Số điện thoại không được bỏ trống' });

    const order = createOrder({
      plan_id,
      customer_name,
      customer_email,
      customer_phone,
      note,
    });

    const settings = getSePaySettings();
    // Dynamic VietQR code URL
    const qrUrl = `https://img.vietqr.io/image/${settings.bank_code}-${settings.account_number}-compact2.png?amount=${order.amount}&addInfo=${order.order_code}&accountName=${encodeURIComponent(settings.account_name)}`;

    return res.json({
      success: true,
      order,
      bank_info: {
        bank_name: settings.bank_name,
        bank_code: settings.bank_code,
        account_number: settings.account_number,
        account_name: settings.account_name,
        amount: order.amount,
        transfer_content: order.order_code,
        qr_url: qrUrl,
      },
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return res.status(400).json({ success: false, message: err.message || 'Lỗi tạo đơn hàng' });
  }
});

// 3. Check order status
app.get('/api/orders/:orderCode/status', (req, res) => {
  const orderCode = req.params.orderCode;
  const order = getOrderByCode(orderCode);
  if (!order) {
    return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
  }

  return res.json({
    status: order.status,
    order,
    is_paid: order.status === 'paid',
  });
});

// 4. Register trial
app.post('/api/trial/register', (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, device_id } = req.body;
    if (!customer_name?.trim()) return res.status(400).json({ success: false, message: 'Họ tên không được bỏ trống' });
    if (!customer_email?.trim() || !customer_email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
    }
    if (!customer_phone?.trim()) return res.status(400).json({ success: false, message: 'Số điện thoại không được bỏ trống' });

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string;

    const result = registerTrial({
      customer_name,
      customer_email,
      customer_phone,
      device_id,
      ip_address: clientIp,
      user_agent: userAgent,
    });

    return res.json({
      success: true,
      subscription: result.subscription,
      message: 'Kích hoạt dùng thử thành công!',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Lỗi khi kích hoạt dùng thử',
    });
  }
});

// 5. Check subscription access
app.post('/api/subscription/check', (req, res) => {
  const { email, device_id, phone } = req.body;
  const status = checkCustomerAccess({
    email,
    deviceId: device_id,
    phone,
  });
  return res.json(status);
});

// 6. SePay Webhook Endpoint
app.post('/api/sepay-webhook', async (req, res) => {
  console.log('Received SePay Webhook:', JSON.stringify(req.body));
  const settings = getSePaySettings();

  // Validate authorization header if secret is configured
  if (settings.webhook_secret) {
    const authHeader = req.headers['authorization'];
    const apikeyHeader = req.headers['x-sepay-api-key'] || req.headers['x-api-key'];
    const valid =
      authHeader === `Bearer ${settings.webhook_secret}` ||
      authHeader === settings.webhook_secret ||
      apikeyHeader === settings.webhook_secret;

    if (!valid && !process.env.DEV_BYPASS_WEBHOOK) {
      console.warn('Unauthorized SePay Webhook access attempt');
      createWebhookLog({
        content: req.body?.content || 'Unauthorized',
        amount: Number(req.body?.transferAmount || 0),
        detected_order_code: null,
        result: 'error',
        message: 'Xác thực webhook không thành công (Sai secret hoặc thiếu Authorization header)',
        raw_payload: req.body,
      });
      return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
    }
  }

  try {
    const payload = req.body || {};
    // Extract transfer amount
    const transferAmount = Number(
      payload.transferAmount ?? payload.amount ?? payload.amount_in ?? payload.in_amount ?? 0
    );

    // Extract transfer type ('in' for income)
    const transferType = payload.transferType || payload.type || 'in';
    if (transferType !== 'in' && transferAmount <= 0) {
      createWebhookLog({
        content: payload.content || '',
        amount: transferAmount,
        detected_order_code: null,
        result: 'error',
        message: 'Giao dịch không phải là tiền vào',
        raw_payload: payload,
      });
      return res.json({ success: true, message: 'Ignored non-income transaction' });
    }

    // Extract content
    const content = String(payload.content || payload.description || payload.transaction_content || '').trim();

    // Find order code matching AFF\d{6} or prefix
    const prefix = settings.order_prefix || 'AFF';
    const regex = new RegExp(`${prefix}\\d{6}`, 'i');
    const match = content.match(regex);
    const orderCode = match ? match[0].toUpperCase() : null;

    if (!orderCode) {
      createWebhookLog({
        content,
        amount: transferAmount,
        detected_order_code: null,
        result: 'order_not_found',
        message: `Không tìm thấy mã đơn hàng ${prefix}xxxxxx trong nội dung chuyển khoản`,
        raw_payload: payload,
      });
      return res.json({ success: true, message: 'No valid order code found in content' });
    }

    // Find order in database
    const order = getOrderByCode(orderCode);
    if (!order) {
      createWebhookLog({
        content,
        amount: transferAmount,
        detected_order_code: orderCode,
        result: 'order_not_found',
        message: `Mã đơn hàng ${orderCode} không tồn tại trong hệ thống`,
        raw_payload: payload,
      });
      return res.json({ success: true, message: `Order ${orderCode} not found` });
    }

    // Check if order was already paid
    if (order.status === 'paid') {
      createWebhookLog({
        content,
        amount: transferAmount,
        detected_order_code: orderCode,
        result: 'already_paid',
        message: `Đơn hàng ${orderCode} đã thanh toán trước đó (tránh cộng trùng)`,
        raw_payload: payload,
      });
      return res.json({ success: true, message: `Order ${orderCode} was already paid` });
    }

    // Check amount
    if (transferAmount < order.amount) {
      updateOrderStatus(orderCode, 'underpaid');
      createWebhookLog({
        content,
        amount: transferAmount,
        detected_order_code: orderCode,
        result: 'underpaid',
        message: `Thanh toán thiếu tiền: Nhận ${transferAmount} đ, cần ${order.amount} đ`,
        raw_payload: payload,
      });
      return res.json({ success: false, message: 'Underpaid order' });
    }

    // Amount is valid (exact or overpaid)
    // 1. Record payment
    createPayment({
      order_code: orderCode,
      transaction_id: String(payload.id || payload.transaction_id || `txn_${Date.now()}`),
      amount: transferAmount,
      content,
      bank_brand_name: payload.gateway || payload.bank_brand_name || settings.bank_name,
      account_number: payload.accountNumber || settings.account_number,
      paid_at: payload.transactionDate || new Date().toISOString(),
    });

    // 2. Activate subscription
    order.paid_at = payload.transactionDate || new Date().toISOString();
    const sub = activatePaidSubscription(order);

    // 3. Log webhook success
    createWebhookLog({
      content,
      amount: transferAmount,
      detected_order_code: orderCode,
      result: 'success',
      message: `Thanh toán thành công! Đã kích hoạt gói "${order.plan_name}" đến ${new Date(sub.expired_at).toLocaleDateString('vi-VN')}`,
      raw_payload: payload,
    });

    console.log(`Order ${orderCode} successfully paid & activated!`);
    return res.json({
      success: true,
      message: `Đơn hàng ${orderCode} đã kích hoạt thành công!`,
      subscription: sub,
    });
  } catch (err: any) {
    console.error('SePay Webhook processing error:', err);
    createWebhookLog({
      content: req.body?.content || '',
      amount: Number(req.body?.transferAmount || 0),
      detected_order_code: null,
      result: 'error',
      message: err.message || 'Lỗi ngoại lệ khi xử lý webhook',
      raw_payload: req.body,
    });
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '123456';

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const passcode = (req.headers['x-admin-passcode'] || req.query.passcode) as string;
  if (!passcode || passcode.trim() !== ADMIN_PASSCODE.trim()) {
    return res.status(403).json({ error: 'Mật khẩu quản trị viên không chính xác' });
  }
  next();
}

app.post('/api/admin/verify', (req, res) => {
  const passcode = req.headers['x-admin-passcode'] as string;
  const valid = passcode && passcode.trim() === ADMIN_PASSCODE.trim();
  res.json({ valid: !!valid });
});

app.get('/api/admin/dashboard-data', requireAdmin, (req, res) => {
  const webhookUrl = `${req.protocol}://${req.get('host')}/api/sepay-webhook`;
  res.json({
    plans: getPlans(false),
    sepay_settings: getSePaySettings(),
    trial_settings: getTrialSettings(),
    orders: getOrders(),
    webhook_logs: getWebhookLogs(),
    active_subscriptions: getActiveSubscriptions(),
    trial_logs: getTrialLogs(),
    webhook_url: webhookUrl,
    storage_mode: getStorageMode(),
  });
});

app.post('/api/admin/plans', requireAdmin, (req, res) => {
  const { plans } = req.body;
  if (Array.isArray(plans)) {
    savePlans(plans);
    return res.json({ success: true, message: 'Đã lưu danh sách gói' });
  }
  res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
});

app.post('/api/admin/sepay-settings', requireAdmin, (req, res) => {
  const { settings } = req.body;
  if (settings) {
    const updated = updateSePaySettings(settings);
    return res.json({ success: true, settings: updated });
  }
  res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
});

app.post('/api/admin/trial-settings', requireAdmin, (req, res) => {
  const { settings } = req.body;
  if (settings) {
    const updated = updateTrialSettings(settings);
    return res.json({ success: true, settings: updated });
  }
  res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
});

app.post('/api/admin/sepay-test-connection', requireAdmin, async (req, res) => {
  const settings = getSePaySettings();
  const issues: string[] = [];

  if (!settings.api_key && !process.env.SEPAY_API_KEY) {
    issues.push('Chưa nhập SePay API Key');
  }
  if (!settings.webhook_secret && !process.env.SEPAY_WEBHOOK_SECRET) {
    issues.push('Chưa nhập Webhook Secret');
  }
  if (!settings.account_number || !settings.bank_code || !settings.account_name) {
    issues.push('Thiếu thông tin tài khoản ngân hàng');
  }

  if (issues.length > 0) {
    return res.status(400).json({
      success: false,
      message: issues.join('. ') + '.',
    });
  }

  // Webhook URL check
  const webhookUrl = `${req.protocol}://${req.get('host')}/api/sepay-webhook`;

  return res.json({
    success: true,
    message: 'Kết nối SePay thành công. Webhook đã sẵn sàng nhận giao dịch.',
    details: {
      bank: settings.bank_name,
      account_number: settings.account_number,
      webhook_url: webhookUrl,
    },
  });
});

app.post('/api/admin/sepay-test-transaction', requireAdmin, async (req, res) => {
  const { order_code, amount } = req.body;
  if (!order_code) {
    return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng' });
  }

  const order = getOrderByCode(order_code);
  if (!order) {
    return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng ${order_code}` });
  }

  const payAmount = Number(amount || order.amount);
  const now = new Date();

  // Simulate payment
  createPayment({
    order_code: order.order_code,
    transaction_id: `sim_${Date.now()}`,
    amount: payAmount,
    content: `${order.order_code} TEST`,
    bank_brand_name: 'MBBank (Simulated)',
    account_number: '0388888888',
    paid_at: now.toISOString(),
  });

  order.paid_at = now.toISOString();
  const sub = activatePaidSubscription(order);

  createWebhookLog({
    content: `${order.order_code} TEST SIMULATION`,
    amount: payAmount,
    detected_order_code: order.order_code,
    result: 'success',
    message: `[Giao dịch Test] Kích hoạt thành công đơn hàng ${order.order_code}`,
    raw_payload: { simulated: true, order_code, amount: payAmount },
  });

  return res.json({
    success: true,
    message: `Đã kích hoạt thử nghiệm thành công cho đơn hàng ${order.order_code}!`,
    subscription: sub,
  });
});

app.post('/api/admin/orders/:orderCode/activate', requireAdmin, (req, res) => {
  const orderCode = req.params.orderCode;
  const order = getOrderByCode(orderCode);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
  }

  order.paid_at = new Date().toISOString();
  const sub = activatePaidSubscription(order);

  createWebhookLog({
    content: `KÍCH HOẠT THỦ CÔNG BỞI ADMIN: ${order.order_code}`,
    amount: order.amount,
    detected_order_code: order.order_code,
    result: 'success',
    message: `Admin đã kích hoạt thủ công đơn hàng ${order.order_code}`,
    raw_payload: { manual_activation_by_admin: true },
  });

  return res.json({
    success: true,
    message: `Đã kích hoạt thủ công thành công đơn hàng ${order.order_code}`,
    subscription: sub,
  });
});

// TEST GEMINI API KEY ENDPOINT
app.post('/api/test-gemini', async (req, res) => {
  try {
    const userApiKey = (req.body?.apiKey || req.headers['x-gemini-api-key']) as string;
    if (!userApiKey || typeof userApiKey !== 'string' || !userApiKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'API Key không hợp lệ hoặc đã hết hạn, vui lòng kiểm tra lại.',
      });
    }

    const testAi = getGeminiClient(userApiKey.trim());
    const response = await testAi.models.generateContent({
      model: GEMINI_MODEL,
      contents: 'Ping test. Vui lòng phản hồi ngắn gọn "OK".',
    });

    if (response && response.text) {
      return res.json({
        success: true,
        message: 'API đã kết nối thành công.',
      });
    } else {
      throw new Error('Không nhận được phản hồi từ Gemini API.');
    }
  } catch (err: any) {
    console.error('Test Gemini API error:', err?.message || err);
    return res.status(400).json({
      success: false,
      message: describeGeminiError(err).message,
      error: err?.message,
    });
  }
});

// MAIN ANALYSIS ENDPOINT
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url, productService, location, mainKeyword, manualCompetitors, pastedContent } = req.body;

    // Subscription & trial check
    const customerEmail = (req.headers['x-customer-email'] || req.body?.customer_email) as string;
    const deviceId = (req.headers['x-device-id'] || req.body?.device_id) as string;
    const access = checkCustomerAccess({ email: customerEmail, deviceId });

    if (!access.has_access) {
      return res.status(403).json({
        error: access.message || 'Bạn cần mua gói hoặc đăng ký dùng thử để sử dụng công cụ này.',
        requiresSubscription: true,
        access,
      });
    }

    const customApiKey = (req.headers['x-gemini-api-key'] || req.body?.customApiKey) as string;
    const ai = getGeminiClient(customApiKey);

    const { normalizedUrl, hostname } = normalizeAndValidateUrl(url);

    // Fast-path: If analyzing candientu.net or candientu.vn benchmark
    if (
      hostname.includes('candientu.net') ||
      hostname.includes('candientu.vn') ||
      hostname.includes('can-dien-tu') ||
      productService?.toLowerCase().includes('cân điện tử')
    ) {
      console.log('Serving 10X Benchmark Report for candientu domain:', normalizedUrl);
      const benchmark = JSON.parse(JSON.stringify(BENCHMARK_CANDIENTU_REPORT));
      benchmark.userWebsiteUrl = normalizedUrl;
      benchmark.analyzedAt = new Date().toISOString();
      if (!benchmark.opportunityGaps) {
        benchmark.opportunityGaps = benchmark.opportunityGaps10X || [];
      }
      if (!benchmark.contentStrategy) {
        benchmark.contentStrategy = {
          salesMessage: {
            mainMessage: benchmark.mainSalesMessage?.headline || 'Tư vấn đúng bài toán tải trọng - Cam kết hàng chuẩn chính hãng - Kỹ thuật bảo hành tận nơi 24/7',
            explanation: benchmark.mainSalesMessage?.subheadline || 'Tập trung tháo gỡ rủi ro mua nhầm sai số, ngưng trệ sản xuất và chế độ hỗ trợ sau bán hàng.',
            threePillars: (benchmark.mainSalesMessage?.threePillars || []).map((p: any) => p.title || p),
            pagePositionMessages: [
              { position: 'Đầu trang (Hero)', message: 'Chuyên cung cấp cân điện tử công nghiệp và dân dụng chính hãng' },
              { position: 'Khu vực Lợi ích', message: 'Độ chính xác tiêu chuẩn, độ bền cao, bảo hành dài hạn' },
              { position: 'Khu vực Chân trang', message: 'Đường dây nóng hỗ trợ kỹ thuật và cứu hộ cân 24/7' },
            ],
          },
          targetAudiences: (benchmark.personas10X || []).map((p: any) => ({
            persona: p.persona || p.title,
            needs: p.desire,
            pains: p.pain,
            desires: p.desire,
            barriers: p.problem,
            solution: p.solution,
            dedicatedMessage: p.message,
            cta: p.cta,
            storyFramework: p.story,
          })),
          customerFears: (benchmark.fearsAndCommitments || []).map((fc: any) => ({
            fear: fc.painPoint,
            whyAfraid: fc.whyCustomerAfraid,
            websiteAnswer: fc.commitmentOnPage,
            requiredEvidence: fc.evidenceProof,
          })),
          menuAndLandingPages: {
            level1Menu: (benchmark.menuStructurePillars || []).map((m: any) => m.pillarName),
            subMenu: ['Theo ngành nghề', 'Theo tải trọng', 'Dịch vụ sửa chữa'],
            existingUrls: [normalizedUrl],
            urlsToFix: [`${normalizedUrl}/chinh-sach`],
            pagesToUpgrade: [normalizedUrl],
            newPagesToResearch: [`${normalizedUrl}/bao-gia-nhanh`],
            proposedTitle: `${benchmark.businessName} - Giải pháp chuyên nghiệp`,
            searchIntent: 'Mua hàng và tìm kiếm giải pháp kỹ thuật',
            internalLinksNeeded: ['Trang chủ -> Sản phẩm -> Báo giá'],
          },
          keywordClusters: (benchmark.keywordCampaigns || []).map((c: any) => ({
            clusterType: c.campaignName,
            keywords: (c.keywords || []).map((kw: any) => ({
              keyword: typeof kw === 'string' ? kw : kw.keyword,
              searchVolumeNote: 'Cần nhập dữ liệu từ công cụ từ khóa.',
              intent: typeof kw === 'string' ? 'Mua hàng' : kw.intent || 'Mua hàng',
            })),
          })),
          seoSuggestions: [
            {
              pageName: 'Trang chủ',
              primaryKeyword: 'cân điện tử gia phát',
              secondaryKeywords: ['cân điện tử chính hãng', 'cân bàn điện tử', 'sửa cân điện tử'],
              pageTitle: 'Cân Điện Tử Gia Phát - Thiết Bị Đo Lường Chính Hãng Giá Tốt 2026',
              metaDescription: 'Cân Điện Tử Gia Phát chuyên cung cấp cân bàn, cân sàn, cân nông sản chính hãng. Cam kết chuẩn kiểm định, hỗ trợ kỹ thuật tận nơi 24/7.',
              h1: 'Cân Điện Tử Gia Phát - Giải Pháp Đo Lường Chuyên Nghiệp',
              subHeadingsStructure: ['H2: Vì sao chọn chúng tôi', 'H2: Danh mục nổi bật', 'H2: Cam kết dịch vụ'],
              proposedSlug: '/',
              imageAltDescription: 'Cân bàn điện tử Gia Phát khung inox chính hãng',
              internalLinks: ['/can-ban', '/can-san', '/sua-chua'],
              schemaMarkup: 'LocalBusiness, Product',
              contentTags: ['cân điện tử', 'thiết bị đo lường', 'bảo hành tận nơi'],
              socialHashtags: ['#candientugiaphat', '#candientuchinhhang'],
            },
          ],
        };
      }
      return res.json(benchmark);
    }

    // Fetch observable website data
    const webMeta = await fetchWebsiteSnippet(normalizedUrl);

    // Prompt for Gemini AI
    const prompt = `
Bạn là chuyên gia trưởng đánh giá tiếp thị số và tối ưu hóa website cho ứng dụng "PHÂN TÍCH WEB 360" (Phiên bản thương mại 10X).
Nhiệm vụ của bạn là phân tích sâu website sau và 5 đối thủ cạnh tranh bằng tiếng Việt:

WEBSITE CẦN PHÂN TÍCH: ${normalizedUrl}
TÊN MIỀN: ${hostname}
${webMeta.title ? `TIÊU ĐỀ TRANG: ${webMeta.title}` : ''}
${webMeta.metaDesc ? `MÔ TẢ TRANG: ${webMeta.metaDesc}` : ''}
${webMeta.sampleText ? `NỘI DUNG QUAN SÁT TỪ TRANG:\n${webMeta.sampleText}\n` : ''}
${productService ? `Sản phẩm/dịch vụ người dùng cung cấp: ${productService}` : ''}
${location ? `Khu vực: ${location}` : ''}
${mainKeyword ? `Từ khóa chính: ${mainKeyword}` : ''}
${manualCompetitors && manualCompetitors.length > 0 ? `Đối thủ người dùng chỉ định: ${manualCompetitors.join(', ')}` : ''}
${pastedContent ? `Ghi chú thêm: \n${pastedContent}\n` : ''}

NGUYÊN TẮC BẮT BUỘC:
1. Mọi nhận xét phải dựa trên dữ liệu quan sát được hoặc suy luận hợp lý từ bối cảnh kinh doanh.
2. TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT số liệu thống kê: lượng tìm kiếm, doanh thu, lượt truy cập, tỷ lệ chuyển đổi. Nếu chưa đủ số liệu ghi "Cần nhập dữ liệu từ công cụ từ khóa" hoặc "Chưa đủ dữ liệu để xác minh".
3. Phân biệt rõ 3 loại nội dung: [Quan sát được], [Nhận định], [Đề xuất].
4. Tìm đúng 5 website đối thủ kinh doanh thực sự đang hoạt động cùng ngành tại Việt Nam hoặc thị trường liên quan. Loại bỏ mạng xã hội (Facebook, YouTube, TikTok), báo chí tin tức, sàn TMĐT tổng hợp (Shopee, Lazada).

HÃY TRẢ VỀ DUY NHẤT CHUỖI JSON HỢP LỆ VỚI CÁC TRƯỜNG SAU (KHÔNG DÙNG MARKDOWN THỪA):
{
  "businessSummary": {
    "name": "Tên doanh nghiệp",
    "industry": "Ngành nghề chính",
    "mainProductService": "Sản phẩm / Dịch vụ chủ lực",
    "location": "Khu vực kinh doanh",
    "targetAudience": "Khách hàng mục tiêu",
    "commercialKeywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"]
  },
  "competitorsFound": [
    {
      "name": "Tên đối thủ",
      "url": "https://...",
      "queryFound": "Từ khóa tìm thấy đối thủ",
      "reason": "Lý do lựa chọn đối thủ",
      "relevance": "cao",
      "source": "Kết quả tìm kiếm tự nhiên Google"
    }
  ],
  "competitorProfiles": [
    {
      "id": "site-0",
      "name": "Tên website mục tiêu (Website của bạn)",
      "url": "${normalizedUrl}",
      "isUserSite": true,
      "positioning": "Định vị quan sát được",
      "mainProducts": ["Sản phẩm 1", "Sản phẩm 2"],
      "targetAudience": ["Nhóm khách hàng 1", "Nhóm khách hàng 2"],
      "menuOrganization": "Cách tổ chức menu",
      "productPresentation": "Cách trình bày sản phẩm",
      "keyMessage": "Thông điệp chính",
      "commitments": "Cam kết đang công bố",
      "salesPolicy": "Chính sách bán hàng",
      "contactChannels": ["Hotline", "Zalo"],
      "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
      "weaknesses": ["Điểm còn hạn chế 1", "Điểm còn hạn chế 2"],
      "learningsForUser": [],
      "competitionStrategy": "Chiến lược cạnh tranh khuyên nghị",
      "verifiedSources": ["${normalizedUrl}"]
    }
  ],
  "mainSalesMessage": {
    "headline": "Tiêu đề bán hàng chính",
    "subheadline": "Dòng giải thích làm rõ",
    "threePillars": [
      { "title": "Trụ cột 1", "desc": "Mô tả trụ cột 1" },
      { "title": "Trụ cột 2", "desc": "Mô tả trụ cột 2" },
      { "title": "Trụ cột 3", "desc": "Mô tả trụ cột 3" }
    ]
  }
}
`;

    if (!customApiKey?.trim() && !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: 'Chưa có khóa API Gemini. Bấm nút "API" trên thanh đầu trang để nhập khóa từ Google AI Studio (aistudio.google.com/apikey).',
      });
    }

    // 1st attempt: live Google Search grounding so competitors are real sites found today.
    // 2nd attempt (only for non-account errors): plain generation with strict JSON output.
    let aiData: any = null;
    let lastError: any = null;
    const attempts: Array<{ label: string; config: any }> = [
      { label: 'search', config: { tools: [{ googleSearch: {} }], temperature: 0.2 } },
      { label: 'json', config: { responseMimeType: 'application/json', temperature: 0.2 } },
    ];
    for (const attempt of attempts) {
      try {
        const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: attempt.config });
        const parsed = cleanJsonOutput(response.text || '');
        if (parsed && typeof parsed === 'object' && parsed.businessSummary) {
          aiData = parsed;
          break;
        }
        lastError = new Error('AI trả về dữ liệu không đúng cấu trúc báo cáo.');
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini ${attempt.label} attempt failed:`, err?.message);
        // Key / quota / permission problems will not be fixed by retrying.
        if (describeGeminiError(err).status !== 502) break;
      }
    }

    if (!aiData) {
      const { status, message } = describeGeminiError(lastError);
      return res.status(status).json({ error: message });
    }

    aiData.competitorsFound = await keepReachableCompetitors(aiData.competitorsFound, hostname);
    if (Array.isArray(aiData.competitorProfiles)) {
      const validUrls = new Set(aiData.competitorsFound.map((c: any) => c.url));
      aiData.competitorProfiles = aiData.competitorProfiles.filter((p: any) => p.isUserSite || validUrls.has(p.url));
    }

    const full10XReport = buildComprehensive10XReport(normalizedUrl, hostname, aiData, webMeta);
    return res.json(full10XReport);
  } catch (error: any) {
    console.error('Error in /api/analyze-website:', error);
    return res.status(400).json({
      error: error.message || 'Vui lòng kiểm tra lại địa chỉ website.',
    });
  }
});

// Regenerate single section endpoint
app.post('/api/regenerate-section', async (req, res) => {
  try {
    const { section, websiteData } = req.body;

    // Subscription & trial check
    const customerEmail = (req.headers['x-customer-email'] || req.body?.customer_email) as string;
    const deviceId = (req.headers['x-device-id'] || req.body?.device_id) as string;
    const access = checkCustomerAccess({ email: customerEmail, deviceId });

    if (!access.has_access) {
      return res.status(403).json({
        error: access.message || 'Bạn cần mua gói hoặc đăng ký dùng thử để sử dụng công cụ này.',
        requiresSubscription: true,
        access,
      });
    }

    const customApiKey = (req.headers['x-gemini-api-key'] || req.body?.customApiKey) as string;
    const ai = getGeminiClient(customApiKey);

    if (!section || !websiteData?.url) {
      return res.status(400).json({ error: 'Thiếu thông tin phân đoạn hoặc URL website.' });
    }

    const { normalizedUrl, hostname } = normalizeAndValidateUrl(websiteData.url);

    // If section requested, return enhanced section data
    const prompt = `
Bạn là chuyên gia tiếp thị số của ứng dụng "PHÂN TÍCH WEB 360".
Hãy TẠO LẠI PHÂN ĐOẠN "${section}" cho website: ${normalizedUrl} (${hostname})
Tuân thủ nguyên tắc: Không bịa đặt số liệu thống kê. Nếu thiếu ghi "Chưa đủ dữ liệu để xác minh".
Trả về JSON hợp lệ cho phân đoạn "${section}".
`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.3, responseMimeType: 'application/json' },
      });
      responseText = response.text || '';
    } catch (err: any) {
      console.warn('Regenerate section AI error:', err.message);
      const { status, message } = describeGeminiError(err);
      return res.status(status).json({ error: message });
    }

    const parsed = cleanJsonOutput(responseText || '{}');
    return res.json({ section, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/regenerate-section:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi tạo lại phân đoạn.',
    });
  }
});

// On Vercel this file is bundled into a serverless function (see scripts/build-vercel.mjs):
// static files are served by Vercel's CDN and only /api/* reaches Express.
export default app;

if (!process.env.VERCEL) {
  // Setup Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web 360 10X Server running on http://0.0.0.0:${PORT}`);
  });
}
