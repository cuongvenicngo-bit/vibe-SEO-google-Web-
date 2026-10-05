import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Settings,
  Users,
  Clock,
  Activity,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  Plan,
  Order,
  Subscription,
  SePaySettings,
  TrialSettings,
  TrialLog,
  WebhookLog,
} from '../types/subscription';
import {
  verifyAdminPasscodeApi,
  getAdminDataApi,
  saveAdminPlansApi,
  saveAdminSePaySettingsApi,
  saveAdminTrialSettingsApi,
  testSePayConnectionApi,
  createTestTransactionApi,
  manualActivateOrderApi,
} from '../services/subscriptionApi';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onDataChanged?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onDataChanged,
}) => {
  // Passcode verification state
  const [passcode, setPasscode] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    'plans' | 'sepay' | 'trial' | 'orders' | 'webhooks' | 'subscribers' | 'trial_users'
  >('plans');

  // Loaded data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sepaySettings, setSepaySettings] = useState<SePaySettings | null>(null);
  const [trialSettings, setTrialSettings] = useState<TrialSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [trialLogs, setTrialLogs] = useState<TrialLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCopiedWebhook, setHasCopiedWebhook] = useState<boolean>(false);

  // Search filters
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [trialFilter, setTrialFilter] = useState<'all' | 'active' | 'expired' | 'upgraded'>('all');

  // Test SePay state
  const [isTestingSePay, setIsTestingSePay] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test Transaction state
  const [testOrderCode, setTestOrderCode] = useState<string>('');
  const [testAmount, setTestAmount] = useState<number>(99000);

  useEffect(() => {
    if (isOpen) {
      // Check if already authenticated in session
      const savedPass = sessionStorage.getItem('web360_admin_pass');
      if (savedPass) {
        setPasscode(savedPass);
        handleLogin(savedPass);
      }
    } else {
      setAuthError(null);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (passToVerify?: string) => {
    const pass = passToVerify || passcode;
    if (!pass.trim()) {
      setAuthError('Vui lòng nhập mật khẩu quản trị');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const valid = await verifyAdminPasscodeApi(pass);
      if (valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('web360_admin_pass', pass.trim());
        loadDashboardData(pass);
      } else {
        setAuthError('Mật khẩu quản trị viên không chính xác');
      }
    } catch {
      setAuthError('Không thể kết nối đến máy chủ');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadDashboardData = async (pass?: string) => {
    const authPass = pass || passcode;
    setIsLoadingData(true);
    try {
      const data = await getAdminDataApi(authPass);
      setPlans(data.plans || []);
      setSepaySettings(data.sepay_settings);
      setTrialSettings(data.trial_settings);
      setOrders(data.orders || []);
      setWebhookLogs(data.webhook_logs || []);
      setSubscribers(data.active_subscriptions || []);
      setTrialLogs(data.trial_logs || []);
      setWebhookUrl(data.webhook_url);
    } catch (err: any) {
      onShowToast(err.message || 'Không thể tải dữ liệu admin', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Save Plans
  const handleSavePlans = async () => {
    setIsSaving(true);
    try {
      await saveAdminPlansApi(plans, passcode);
      onShowToast('Đã lưu cấu hình danh sách gói thành công', 'success');
      onDataChanged?.();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi lưu gói', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save SePay Settings
  const handleSaveSePaySettings = async () => {
    if (!sepaySettings) return;
    setIsSaving(true);
    try {
      await saveAdminSePaySettingsApi(sepaySettings, passcode);
      onShowToast('Đã lưu cài đặt thanh toán SePay thành công', 'success');
      onDataChanged?.();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi lưu cài đặt SePay', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test SePay Connection
  const handleTestSePay = async () => {
    setIsTestingSePay(true);
    setTestResult(null);
    try {
      const res = await testSePayConnectionApi(passcode);
      setTestResult({ success: true, message: res.message });
      onShowToast(res.message, 'success');
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      onShowToast(err.message, 'error');
    } finally {
      setIsTestingSePay(false);
    }
  };

  // Create Test Transaction
  const handleCreateTestTx = async () => {
    if (!testOrderCode.trim()) {
      onShowToast('Vui lòng nhập mã đơn hàng cần test (ví dụ AFF000001)', 'error');
      return;
    }
    try {
      const res = await createTestTransactionApi(testOrderCode, testAmount, passcode);
      onShowToast(res.message, 'success');
      loadDashboardData();
      onDataChanged?.();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Save Trial Settings
  const handleSaveTrialSettings = async () => {
    if (!trialSettings) return;
    setIsSaving(true);
    try {
      await saveAdminTrialSettingsApi(trialSettings, passcode);
      onShowToast('Đã lưu cấu hình dùng thử thành công', 'success');
      onDataChanged?.();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi lưu cấu hình dùng thử', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Manual Activate Order
  const handleManualActivate = async (orderCode: string) => {
    if (!confirm(`Xác nhận kích hoạt thủ công cho đơn hàng ${orderCode}?`)) return;
    try {
      const res = await manualActivateOrderApi(orderCode, passcode);
      onShowToast(res.message, 'success');
      loadDashboardData();
      onDataChanged?.();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setHasCopiedWebhook(true);
    setTimeout(() => setHasCopiedWebhook(false), 2000);
    onShowToast('Đã sao chép Webhook URL!', 'success');
  };

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const term = orderSearch.toLowerCase();
    return (
      o.order_code.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_email.toLowerCase().includes(term) ||
      o.customer_phone.includes(term)
    );
  });

  // Filtered trial logs
  const filteredTrialLogs = trialLogs.filter((t) => {
    if (trialFilter === 'all') return true;
    return t.status === trialFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Passcode Login Screen if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto w-full my-auto space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bảng quản trị SePay & Gói sử dụng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nhập mật khẩu quản trị viên để truy cập hệ thống
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3"
            >
              <div>
                <input
                  type="password"
                  placeholder="Mật khẩu quản trị viên"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-rose-500 text-xs mt-1.5 text-left">{authError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'Đang xác thực...' : 'Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <>
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Trung tâm Quản trị SePay & Gói dịch vụ
                  </h3>
                  <p className="text-xs text-slate-400">
                    Quản lý doanh thu, webhook giao dịch, gói cước và người dùng dùng thử
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDashboardData()}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shrink-0 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'plans'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Gói sử dụng ({plans.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sepay')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'sepay'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt SePay</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trial')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'trial'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cài đặt dùng thử</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Đơn hàng ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('webhooks')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'webhooks'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Giao dịch Webhook ({webhookLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('subscribers')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'subscribers'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Đang active ({subscribers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trial_users')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'trial_users'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Người dùng dùng thử ({trialLogs.length})</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: GÓI SỬ DỤNG */}
              {activeTab === 'plans' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Danh sách các gói sử dụng
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Chỉnh sửa tên, số ngày, giá bán và trạng thái hiển thị
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newPlan: Plan = {
                            id: `plan_${Date.now()}`,
                            name: 'Gói mới',
                            days: 30,
                            price: 150000,
                            description: 'Mô tả gói mới',
                            is_active: true,
                            is_featured: false,
                          };
                          setPlans([...plans, newPlan]);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm gói</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePlans}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Đang lưu...' : 'Lưu danh sách gói'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                            Gói #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPlans(plans.filter((x) => x.id !== p.id))}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Xóa gói"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            Tên gói:
                          </label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[idx].name = e.target.value;
                              setPlans(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              Số ngày:
                            </label>
                            <input
                              type="number"
                              value={p.days}
                              onChange={(e) => {
                                const updated = [...plans];
                                updated[idx].days = Number(e.target.value);
                                setPlans(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              Giá tiền (VNĐ):
                            </label>
                            <input
                              type="number"
                              value={p.price}
                              onChange={(e) => {
                                const updated = [...plans];
                                updated[idx].price = Number(e.target.value);
                                setPlans(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            Mô tả ngắn:
                          </label>
                          <textarea
                            rows={2}
                            value={p.description}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[idx].description = e.target.value;
                              setPlans(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.is_active}
                              onChange={(e) => {
                                const updated = [...plans];
                                updated[idx].is_active = e.target.checked;
                                setPlans(updated);
                              }}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                            <span>Bật gói</span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.is_featured}
                              onChange={(e) => {
                                const updated = [...plans];
                                updated[idx].is_featured = e.target.checked;
                                setPlans(updated);
                              }}
                              className="rounded text-amber-500 cursor-pointer"
                            />
                            <span>Gói nổi bật</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: CÀI ĐẶT SEPAY */}
              {activeTab === 'sepay' && sepaySettings && (
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Cài đặt tích hợp SePay
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cấu hình tài khoản ngân hàng nhận tiền và Webhook tự động
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSePaySettings}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình SePay'}</span>
                    </button>
                  </div>

                  {/* Webhook URL Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                        Webhook URL của app (Đăng ký trên my.sepay.vn):
                      </span>
                      <button
                        type="button"
                        onClick={copyWebhookUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                      >
                        {hasCopiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Sao chép URL</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 font-mono text-[11px] text-blue-600 dark:text-blue-400 select-all border border-slate-200 dark:border-slate-800 break-all">
                      {webhookUrl}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Giao thức: <strong>POST</strong>, Kiểu dữ liệu: <strong>JSON</strong>. Khi có biến động số dư, SePay sẽ bắn thông tin về URL này để app tự động kích hoạt gói.
                    </p>
                  </div>

                  {/* Bank info settings */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                      Thông tin tài khoản ngân hàng (Hiển thị trên mã VietQR)
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tên ngân hàng:
                        </label>
                        <input
                          type="text"
                          value={sepaySettings.bank_name}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, bank_name: e.target.value })
                          }
                          placeholder="Ví dụ: MBBank (Quân Đội)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Mã ngân hàng (VietQR Code):
                        </label>
                        <input
                          type="text"
                          value={sepaySettings.bank_code}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, bank_code: e.target.value.toUpperCase() })
                          }
                          placeholder="MB, VCB, TCB, VPB..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Số tài khoản:
                        </label>
                        <input
                          type="text"
                          value={sepaySettings.account_number}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, account_number: e.target.value })
                          }
                          placeholder="0987654321"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Chủ tài khoản (Không dấu):
                        </label>
                        <input
                          type="text"
                          value={sepaySettings.account_name}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, account_name: e.target.value.toUpperCase() })
                          }
                          placeholder="NGUYEN VAN A"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SePay Secret Keys */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                      Mã xác thực SePay
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          SePay API Key:
                        </label>
                        <input
                          type="password"
                          value={sepaySettings.api_key}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, api_key: e.target.value })
                          }
                          placeholder="Nhập API Key từ SePay"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          SePay Webhook Secret:
                        </label>
                        <input
                          type="password"
                          value={sepaySettings.webhook_secret}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, webhook_secret: e.target.value })
                          }
                          placeholder="Secret token kiểm tra Authorization"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tiền tố mã đơn hàng:
                        </label>
                        <input
                          type="text"
                          value={sepaySettings.order_prefix}
                          onChange={(e) =>
                            setSepaySettings({ ...sepaySettings, order_prefix: e.target.value.toUpperCase() })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sepaySettings.is_active}
                            onChange={(e) =>
                              setSepaySettings({ ...sepaySettings, is_active: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                          <span>Bật thanh toán tự động SePay</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Testing */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                      Kiểm tra & Thử nghiệm thanh toán
                    </h5>

                    {/* Test Connection Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestSePay}
                        disabled={isTestingSePay}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isTestingSePay ? 'Đang test...' : 'Test kết nối SePay'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={copyWebhookUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Webhook URL</span>
                      </button>
                    </div>

                    {testResult && (
                      <div
                        className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                          testResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="font-semibold">{testResult.message}</span>
                      </div>
                    )}

                    {/* Test Transaction Simulation */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Tạo giao dịch test (Mô phỏng SePay bắn Webhook):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="Mã đơn hàng (ví dụ: AFF000001)"
                          value={testOrderCode}
                          onChange={(e) => setTestOrderCode(e.target.value.toUpperCase())}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-xs w-44"
                        />
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={testAmount}
                          onChange={(e) => setTestAmount(Number(e.target.value))}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-xs w-28"
                        />
                        <button
                          type="button"
                          onClick={handleCreateTestTx}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                        >
                          Tạo giao dịch test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CÀI ĐẶT DÙNG THỬ */}
              {activeTab === 'trial' && trialSettings && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Cài đặt chương trình Dùng thử
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cấu hình số giờ dùng thử và giới hạn chống lạm dụng
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveTrialSettings}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3.5">
                    <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trialSettings.is_active}
                        onChange={(e) =>
                          setTrialSettings({ ...trialSettings, is_active: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span>Bật tính năng dùng thử miễn phí</span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Số giờ dùng thử:
                      </label>
                      <input
                        type="number"
                        value={trialSettings.trial_hours}
                        onChange={(e) =>
                          setTrialSettings({ ...trialSettings, trial_hours: Number(e.target.value) })
                        }
                        className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-400 ml-2">giờ</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tiêu đề nút dùng thử:
                      </label>
                      <input
                        type="text"
                        value={trialSettings.button_title}
                        onChange={(e) =>
                          setTrialSettings({ ...trialSettings, button_title: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Mô tả dùng thử:
                      </label>
                      <textarea
                        rows={2}
                        value={trialSettings.description}
                        onChange={(e) =>
                          setTrialSettings({ ...trialSettings, description: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                        Quy định chống lạm dụng:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span>Giới hạn mỗi Email:</span>
                          <span className="font-bold font-mono">1 lần</span>
                        </label>
                        <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span>Giới hạn mỗi SĐT:</span>
                          <span className="font-bold font-mono">1 lần</span>
                        </label>
                        <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span>Giới hạn thiết bị:</span>
                          <span className="font-bold font-mono">1 lần</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ĐƠN HÀNG */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Danh sách đơn hàng ({filteredOrders.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Theo dõi trạng thái thanh toán từ SePay
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm mã đơn, email, SĐT..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-60"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Mã đơn</th>
                          <th className="p-2.5">Khách hàng</th>
                          <th className="p-2.5">Email / SĐT</th>
                          <th className="p-2.5">Gói</th>
                          <th className="p-2.5">Số tiền</th>
                          <th className="p-2.5">Trạng thái</th>
                          <th className="p-2.5">Ngày tạo</th>
                          <th className="p-2.5">Ngày hết hạn</th>
                          <th className="p-2.5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-slate-400">
                              Chưa có đơn hàng nào
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o) => (
                            <tr key={o.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                              <td className="p-2.5 font-mono font-bold text-blue-600">
                                {o.order_code}
                              </td>
                              <td className="p-2.5 font-medium">{o.customer_name}</td>
                              <td className="p-2.5">
                                <div>{o.customer_email}</div>
                                <div className="text-slate-400">{o.customer_phone}</div>
                              </td>
                              <td className="p-2.5">{o.plan_name}</td>
                              <td className="p-2.5 font-mono font-bold text-blue-600">
                                {formatPrice(o.amount)}
                              </td>
                              <td className="p-2.5">
                                {o.status === 'paid' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                    Đã thanh toán
                                  </span>
                                ) : o.status === 'underpaid' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                                    Thiếu tiền
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium text-[10px]">
                                    Chờ thanh toán
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {new Date(o.created_at).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {o.expired_at
                                  ? new Date(o.expired_at).toLocaleDateString('vi-VN')
                                  : '-'}
                              </td>
                              <td className="p-2.5 text-right">
                                {o.status !== 'paid' && (
                                  <button
                                    type="button"
                                    onClick={() => handleManualActivate(o.order_code)}
                                    className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] cursor-pointer"
                                  >
                                    Kích hoạt
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: GIAO DỊCH WEBHOOK */}
              {activeTab === 'webhooks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Lịch sử nhận Webhook từ SePay ({webhookLogs.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Chi tiết các payload giao dịch chuyển khoản gửi về
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Thời gian</th>
                          <th className="p-2.5">Nội dung chuyển khoản</th>
                          <th className="p-2.5">Số tiền</th>
                          <th className="p-2.5">Mã đơn phát hiện</th>
                          <th className="p-2.5">Kết quả</th>
                          <th className="p-2.5">Thông báo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {webhookLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              Chưa có lịch sử webhook nào
                            </td>
                          </tr>
                        ) : (
                          webhookLogs.map((log) => (
                            <tr key={log.log_id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                              <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                                {new Date(log.received_at).toLocaleTimeString('vi-VN')}{' '}
                                {new Date(log.received_at).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="p-2.5 font-medium max-w-[200px] truncate" title={log.content}>
                                {log.content}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-blue-600">
                                {formatPrice(log.amount)}
                              </td>
                              <td className="p-2.5 font-mono font-bold">
                                {log.detected_order_code || '-'}
                              </td>
                              <td className="p-2.5">
                                {log.result === 'success' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                    Thành công
                                  </span>
                                ) : log.result === 'underpaid' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                    Thiếu tiền
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium text-[10px]">
                                    {log.result}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[220px] truncate" title={log.message}>
                                {log.message}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: NGƯỜI DÙNG ACTIVE */}
              {activeTab === 'subscribers' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Danh sách đăng ký đang có hiệu lực ({subscribers.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bao gồm người dùng trả phí và người dùng trong thời hạn dùng thử
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Họ tên</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Số điện thoại</th>
                          <th className="p-2.5">Loại</th>
                          <th className="p-2.5">Gói / Thời hạn</th>
                          <th className="p-2.5">Ngày kích hoạt</th>
                          <th className="p-2.5">Hết hạn vào</th>
                          <th className="p-2.5">Còn lại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subscribers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400">
                              Chưa có người dùng active nào
                            </td>
                          </tr>
                        ) : (
                          subscribers.map((s) => {
                            const now = new Date().getTime();
                            const exp = new Date(s.expired_at).getTime();
                            const remainingDays = Math.max(0, Math.floor((exp - now) / 86400000));
                            const remainingHours = Math.max(0, Math.floor((exp - now) / 3600000));

                            return (
                              <tr key={s.subscription_id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                <td className="p-2.5 font-bold">{s.customer_name}</td>
                                <td className="p-2.5">{s.customer_email}</td>
                                <td className="p-2.5 font-mono">{s.customer_phone}</td>
                                <td className="p-2.5">
                                  {s.subscription_type === 'paid' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      Trả phí
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-[10px]">
                                      Dùng thử
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-semibold text-blue-600">{s.plan_name}</td>
                                <td className="p-2.5 text-slate-500">
                                  {new Date(s.started_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="p-2.5 font-semibold">
                                  {new Date(s.expired_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="p-2.5 font-bold text-emerald-600">
                                  {s.subscription_type === 'paid'
                                    ? `${remainingDays} ngày`
                                    : `${remainingHours} giờ`}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: NGƯỜI DÙNG DÙNG THỬ */}
              {activeTab === 'trial_users' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Lịch sử đăng ký dùng thử ({filteredTrialLogs.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Theo dõi thiết bị, IP và kiểm tra chống lạm dụng dùng thử
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTrialFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trialFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrialFilter('active')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trialFilter === 'active'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Đang dùng thử
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrialFilter('expired')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trialFilter === 'expired'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Đã hết hạn
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Họ tên</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">SĐT</th>
                          <th className="p-2.5">Thời gian bắt đầu</th>
                          <th className="p-2.5">Thời gian hết hạn</th>
                          <th className="p-2.5">Trạng thái</th>
                          <th className="p-2.5">IP / Thiết bị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTrialLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400">
                              Chưa có dữ liệu dùng thử
                            </td>
                          </tr>
                        ) : (
                          filteredTrialLogs.map((t) => {
                            const now = new Date().getTime();
                            const isExpired = new Date(t.expired_at).getTime() < now;
                            return (
                              <tr key={t.trial_id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                <td className="p-2.5 font-bold">{t.customer_name}</td>
                                <td className="p-2.5">{t.customer_email}</td>
                                <td className="p-2.5 font-mono">{t.customer_phone}</td>
                                <td className="p-2.5 text-slate-500">
                                  {new Date(t.started_at).toLocaleTimeString('vi-VN')}{' '}
                                  {new Date(t.started_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="p-2.5 text-slate-500">
                                  {new Date(t.expired_at).toLocaleTimeString('vi-VN')}{' '}
                                  {new Date(t.expired_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="p-2.5">
                                  {isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                      Hết hạn
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-bold text-[10px]">
                                      Còn hạn
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={t.ip_address || t.device_id}>
                                  {t.ip_address || t.device_id || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
