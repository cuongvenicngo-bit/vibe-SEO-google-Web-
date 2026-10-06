import { AnalysisReport, WebsiteInputForm } from '../types';
import { DEFAULT_GEMINI_MODEL, findGeminiModel } from '../constants/geminiModels';

export const GEMINI_API_KEY_STORAGE_KEY = 'web360_gemini_api_key';
export const GEMINI_MODEL_STORAGE_KEY = 'web360_gemini_model';

export function getSavedGeminiModel(): string {
  try {
    return findGeminiModel(localStorage.getItem(GEMINI_MODEL_STORAGE_KEY)).id;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

export function saveGeminiModel(modelId: string): void {
  try {
    localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, findGeminiModel(modelId).id);
  } catch (err) {
    console.error('Failed to save Gemini model to localStorage:', err);
  }
}

// Helper to get custom Gemini API Key from localStorage
export function getSavedGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

// Helper to save custom Gemini API Key
export function saveGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Failed to save API key to localStorage:', err);
  }
}

// Helper to remove custom Gemini API Key
export function removeGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove API key from localStorage:', err);
  }
}

// Helper to build headers with custom API key and customer subscription info
function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-gemini-model': getSavedGeminiModel(),
  };
  const customKey = getSavedGeminiApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  try {
    const email = localStorage.getItem('web360_customer_email');
    if (email) headers['x-customer-email'] = email;
    const deviceId = localStorage.getItem('web360_device_uuid');
    if (deviceId) headers['x-device-id'] = deviceId;
  } catch {}
  return headers;
}

// Test Gemini API Key
export async function testGeminiApiKeyApi(
  apiKey: string,
  modelId: string = getSavedGeminiModel()
): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/test-gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-api-key': apiKey.trim(),
      'x-gemini-model': modelId,
    },
    body: JSON.stringify({ apiKey: apiKey.trim() }),
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = { message: `Lỗi kết nối máy chủ (${response.status})` };
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API Key không hợp lệ hoặc đã hết hạn, vui lòng kiểm tra lại.');
  }

  return data;
}

export async function analyzeWebsiteApi(input: WebsiteInputForm): Promise<AnalysisReport> {
  const response = await fetch('/api/analyze-website', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMsg = 'Không thể phân tích website';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = `Lỗi máy chủ (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function regenerateSectionApi(
  section: 'competitors' | 'criteria' | 'opportunities' | 'contentStrategy' | 'productionPlan' | 'roadmap',
  websiteData: WebsiteInputForm,
  currentReport: AnalysisReport
): Promise<any> {
  const response = await fetch('/api/regenerate-section', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({
      section,
      websiteData,
      currentReport,
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Không thể tạo lại phân đoạn này';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = `Lỗi máy chủ (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  const resJson = await response.json();
  return resJson.data;
}
