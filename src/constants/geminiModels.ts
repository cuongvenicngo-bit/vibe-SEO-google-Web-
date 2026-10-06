/**
 * Gemini models customers can choose for analysis, cheapest first. Shared by the UI (picker)
 * and the server (allow-list), so only these IDs are ever sent to Google.
 * Prices: Google AI pricing page, paid tier, USD per 1M tokens (input / output), checked 10/2026.
 */
export interface GeminiModelOption {
  id: string;
  label: string;
  tier: string;
  price: string;
  /** Live Google Search grounding (finds real competitors today). */
  supportsSearch: boolean;
  freeTier: boolean;
  description: string;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Flash-Lite 3.1',
    tier: 'Tiết kiệm nhất',
    price: '$0.25 / $1.50',
    supportsSearch: false,
    freeTier: true,
    description: 'Rẻ và nhanh nhất. Không tra cứu Google trực tiếp nên danh sách đối thủ kém chính xác hơn.',
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Flash-Lite 3.5',
    tier: 'Tiết kiệm',
    price: '$0.30 / $2.50',
    supportsSearch: false,
    freeTier: true,
    description: 'Chi phí thấp, chất lượng khá. Không tra cứu Google trực tiếp.',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Flash 3.8',
    tier: 'Cân bằng · Khuyên dùng',
    price: '$0.75 / $3.75',
    supportsSearch: true,
    freeTier: true,
    description: 'Tra cứu Google để tìm đối thủ thật. Cân bằng tốt giữa chất lượng và chi phí.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Pro 3.1 (Preview)',
    tier: 'Mạnh nhất',
    price: '$2.00 / $12.00',
    supportsSearch: true,
    freeTier: false,
    description: 'Phân tích sâu nhất, có tra cứu Google. Không có gói miễn phí, tốn nhiều token nhất.',
  },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function findGeminiModel(id: string | undefined | null): GeminiModelOption {
  return GEMINI_MODEL_OPTIONS.find((m) => m.id === id) || GEMINI_MODEL_OPTIONS.find((m) => m.id === DEFAULT_GEMINI_MODEL)!;
}
