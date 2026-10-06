import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  getSavedGeminiApiKey,
  saveGeminiApiKey,
  removeGeminiApiKey,
  testGeminiApiKeyApi,
} from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onApiKeyChanged?: (hasCustomKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onApiKeyChanged,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const current = getSavedGeminiApiKey();
      setApiKey(current);
      setSavedKey(current);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = !!savedKey && savedKey.trim().length > 0;

  // Handle Save
  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      onShowToast('Vui lòng nhập Gemini API Key trước khi lưu', 'error');
      return;
    }
    saveGeminiApiKey(trimmed);
    setSavedKey(trimmed);
    setTestResult(null);
    onApiKeyChanged?.(true);
    onShowToast('Đã lưu Gemini API Key riêng thành công!', 'success');
  };

  // Handle Remove / Clear
  const handleRemove = () => {
    removeGeminiApiKey();
    setApiKey('');
    setSavedKey('');
    setTestResult(null);
    onApiKeyChanged?.(false);
    onShowToast('Đã xóa API Key riêng. Hệ thống chuyển về dùng API mặc định.', 'info');
  };

  // Handle Test API Key
  const handleTest = async () => {
    const keyToTest = apiKey.trim() || savedKey.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: 'API Key không hợp lệ hoặc đã hết hạn, vui lòng kiểm tra lại.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await testGeminiApiKeyApi(keyToTest);
      setTestResult({
        success: true,
        message: 'API đã kết nối thành công.',
      });
      onShowToast('API đã kết nối thành công.', 'success');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'API Key không hợp lệ hoặc đã hết hạn, vui lòng kiểm tra lại.',
      });
      onShowToast('API Key không hợp lệ hoặc đã hết hạn, vui lòng kiểm tra lại.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Open Get API Key Link
  const handleGetApiKey = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-ocean-200 dark:border-ocean-900/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden space-y-0 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-ocean-600 via-brand-600 to-ocean-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Cấu hình Gemini API Key
              </h3>
              <p className="text-xs text-ocean-100">
                Tự do kết nối API Key riêng để phân tích không giới hạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Connection Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trạng thái hiện tại:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã kết nối API riêng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-ocean-50 text-ocean-700 dark:bg-ocean-950/60 dark:text-ocean-300 border border-ocean-200 dark:border-ocean-800">
                <ShieldCheck className="w-3.5 h-3.5 text-ocean-500" />
                Đang dùng API mặc định
              </span>
            )}
          </div>

          {/* Description Guide */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Khi gọi AI trong app, hệ thống sẽ <strong className="text-ocean-600 dark:text-ocean-400 font-semibold">ưu tiên dùng API Key riêng</strong> bạn đã lưu trong trình duyệt. Nếu chưa nhập, app sẽ tự động dùng API Key mặc định trên server.
          </p>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Gemini API Key:
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Dán mã API Key của bạn (ví dụ: AIzaSy...)"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showKey ? 'Ẩn API Key' : 'Hiện API Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Result Message Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in duration-150 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold text-xs leading-snug">
                {testResult.message}
              </div>
            </div>
          )}

          {/* Action Row 1: Test & Get Key link */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-ocean-300 dark:border-ocean-800 bg-ocean-50/70 hover:bg-ocean-100 dark:bg-ocean-950/50 dark:hover:bg-ocean-900/60 text-ocean-700 dark:text-ocean-300 font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
                  <span>Đang test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
                  <span>Test thử API</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGetApiKey}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Lấy API Key</span>
            </button>
          </div>

          {/* Action Row 2: Save & Delete */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {isConnected ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
                title="Xóa API Key đã lưu"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa API</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu API</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
