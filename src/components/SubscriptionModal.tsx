import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Plan, Order } from '../types/subscription';
import {
  fetchPlansApi,
  createOrderApi,
  checkOrderStatusApi,
  getStoredCustomerInfo,
} from '../services/subscriptionApi';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  initialPlanId?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
  initialPlanId,
}) => {
  // Step state (1: Select Plan, 2: Customer Info, 3: QR Payment, 4: Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Plans data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Customer form
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Order creation and payment state
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [bankInfo, setBankInfo] = useState<{
    bank_name: string;
    bank_code: string;
    account_number: string;
    account_name: string;
    amount: number;
    transfer_content: string;
    qr_url: string;
  } | null>(null);

  // Polling state
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [hasCopiedAccount, setHasCopiedAccount] = useState<boolean>(false);
  const [hasCopiedContent, setHasCopiedContent] = useState<boolean>(false);

  // Load plans & saved info when opening
  useEffect(() => {
    if (isOpen) {
      loadPlans();
      const savedInfo = getStoredCustomerInfo();
      if (savedInfo.name) setCustomerName(savedInfo.name);
      if (savedInfo.email) setCustomerEmail(savedInfo.email);
      if (savedInfo.phone) setCustomerPhone(savedInfo.phone);
    } else {
      // Reset step on close
      setStep(1);
      setCurrentOrder(null);
      setBankInfo(null);
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const data = await fetchPlansApi();
      setPlans(data);
      if (data.length > 0) {
        if (initialPlanId) {
          const matched = data.find((p) => p.id === initialPlanId);
          setSelectedPlan(matched || data[1] || data[0]);
        } else {
          // Default to featured or middle plan
          const featured = data.find((p) => p.is_featured) || data[1] || data[0];
          setSelectedPlan(featured);
        }
      }
    } catch (err: any) {
      onShowToast('Không thể tải bảng giá gói', 'error');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Step 3: Polling order status every 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && currentOrder && currentOrder.status !== 'paid') {
      const pollStatus = async () => {
        try {
          const res = await checkOrderStatusApi(currentOrder.order_code);
          if (res.is_paid || res.status === 'paid') {
            setCurrentOrder(res.order);
            setStep(4);
            onSuccess(res.order);
            onShowToast('Thanh toán thành công! Gói của bạn đã được kích hoạt.', 'success');
          }
        } catch (err) {
          console.error('Polling payment status error:', err);
        }
      };

      timer = setInterval(pollStatus, 4500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, currentOrder]);

  if (!isOpen) return null;

  // Validation for Step 2
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!customerName.trim()) {
      errors.name = 'Họ tên không được bỏ trống';
    }
    if (!customerEmail.trim()) {
      errors.email = 'Email không được bỏ trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      errors.email = 'Email không đúng định dạng';
    }
    if (!customerPhone.trim()) {
      errors.phone = 'Số điện thoại không được bỏ trống';
    } else if (!/^[0-9+() -]{8,15}$/.test(customerPhone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create order and move to Step 3
  const handleProceedToPayment = async () => {
    if (!selectedPlan) {
      onShowToast('Vui lòng chọn một gói dịch vụ', 'error');
      setStep(1);
      return;
    }

    if (!validateForm()) {
      onShowToast('Vui lòng kiểm tra lại thông tin khách hàng', 'error');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const res = await createOrderApi({
        plan_id: selectedPlan.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        note: customerNote,
      });

      setCurrentOrder(res.order);
      setBankInfo(res.bank_info);
      setStep(3);
    } catch (err: any) {
      onShowToast(err.message || 'Không thể tạo đơn hàng thanh toán', 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Manual Check Payment
  const handleManualCheckPayment = async () => {
    if (!currentOrder) return;
    setIsCheckingPayment(true);
    try {
      const res = await checkOrderStatusApi(currentOrder.order_code);
      if (res.is_paid || res.status === 'paid') {
        setCurrentOrder(res.order);
        setStep(4);
        onSuccess(res.order);
        onShowToast('Thanh toán thành công! Gói của bạn đã được kích hoạt.', 'success');
      } else {
        onShowToast('Hệ thống đang chờ giao dịch từ SePay. Vui lòng thử lại sau vài giây!', 'info');
      }
    } catch (err: any) {
      onShowToast('Chưa thể kiểm tra đơn hàng, vui lòng thử lại sau', 'error');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Clipboard copy helpers
  const copyToClipboard = (text: string, type: 'account' | 'content') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setHasCopiedAccount(true);
      setTimeout(() => setHasCopiedAccount(false), 2000);
      onShowToast('Đã sao chép số tài khoản!', 'success');
    } else {
      setHasCopiedContent(true);
      setTimeout(() => setHasCopiedContent(false), 2000);
      onShowToast('Đã sao chép nội dung chuyển khoản!', 'success');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900/60 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with step progress */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-700 via-brand-700 to-brand-600 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  Mua gói sử dụng PHÂN TÍCH WEB 360
                </h3>
                <p className="text-xs text-brand-100">
                  Thanh toán tự động qua SePay · Kích hoạt ngay tức thì
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-white/15 text-[11px] font-semibold">
            <div
              className={`flex items-center gap-1.5 ${
                step >= 1 ? 'text-white' : 'text-brand-200/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  step >= 1 ? 'bg-white text-brand-700 font-bold' : 'bg-white/20 text-white'
                }`}
              >
                1
              </span>
              <span className="truncate">Chọn gói</span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                step >= 2 ? 'text-white' : 'text-brand-200/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  step >= 2 ? 'bg-white text-brand-700 font-bold' : 'bg-white/20 text-white'
                }`}
              >
                2
              </span>
              <span className="truncate">Thông tin</span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                step >= 3 ? 'text-white' : 'text-brand-200/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  step >= 3 ? 'bg-white text-brand-700 font-bold' : 'bg-white/20 text-white'
                }`}
              >
                3
              </span>
              <span className="truncate">Quét QR</span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                step === 4 ? 'text-white' : 'text-brand-200/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  step === 4 ? 'bg-emerald-400 text-slate-900 font-bold' : 'bg-white/20 text-white'
                }`}
              >
                4
              </span>
              <span className="truncate">Kích hoạt</span>
            </div>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100 space-y-4">
          {/* ================= STEP 1: CHỌN GÓI ================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chọn gói dịch vụ phù hợp với nhu cầu của bạn
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mở khóa 100% sức mạnh phân tích website 10X, xuất báo cáo và tạo lộ trình chuyển đổi
                </p>
              </div>

              {isLoadingPlans ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
                  <span className="text-xs">Đang tải danh sách gói...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {plans.map((p) => {
                    const isSelected = selectedPlan?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-brand-600 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                        }`}
                      >
                        {p.is_featured && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Phổ biến nhất
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.days} ngày
                            </span>
                          </div>

                          <div className="pt-1">
                            <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                              {formatPrice(p.price)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {p.description}
                          </p>

                          {p.features && p.features.length > 0 && (
                            <ul className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                              {p.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(p);
                              setStep(2);
                            }}
                            className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            Chọn gói này
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPlan && (
                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Tiếp tục: Nhập thông tin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: NHẬP THÔNG TIN ================= */}
          {step === 2 && selectedPlan && (
            <div className="space-y-4">
              {/* Selected Plan Summary Banner */}
              <div className="p-3.5 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 block">
                    Gói dịch vụ đã chọn:
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedPlan.name} ({selectedPlan.days} ngày sử dụng)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-brand-700 dark:text-brand-300">
                    {formatPrice(selectedPlan.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="block text-[11px] text-brand-600 hover:underline cursor-pointer"
                  >
                    Đổi gói
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden transition-all ${
                        formErrors.name
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500'
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.name}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Địa chỉ Email <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden transition-all ${
                          formErrors.email
                            ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.email}</span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại / Zalo <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Ví dụ: 0987654321"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden transition-all ${
                          formErrors.phone
                            ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.phone}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ghi chú thêm (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Website cần phân tích hoặc yêu cầu hỗ trợ"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isCreatingOrder}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang tạo đơn hàng...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục thanh toán</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: QUÉT QR THANH TOÁN ================= */}
          {step === 3 && currentOrder && bankInfo && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">Đang kiểm tra thanh toán tự động qua SePay...</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Gói sẽ tự động kích hoạt ngay khi ngân hàng ghi nhận chuyển khoản
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualCheckPayment}
                  disabled={isCheckingPayment}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCheckingPayment ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
                </button>
              </div>

              {/* Main Responsive Layout: Desktop side-by-side, Mobile stacked */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* QR Code Column */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-center pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-brand-600" />
                      Quét mã VietQR
                    </span>
                    <span className="text-[10px] text-slate-400">Mở app ngân hàng bất kỳ để quét</span>
                  </div>

                  <div className="payment-qr-frame p-2 bg-white rounded-xl shadow-xs border border-slate-200 dark:border-slate-600">
                    <img
                      src={bankInfo.qr_url}
                      alt="VietQR SePay Payment"
                      className="payment-qr-image w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <span className="text-[11px] font-extrabold text-brand-700 dark:text-brand-400">
                      {formatPrice(currentOrder.amount)}
                    </span>
                  </div>
                </div>

                {/* Transfer Info Details Column */}
                <div className="md:col-span-7 space-y-2.5 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                    {/* Ngân hàng */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">
                        {bankInfo.bank_name} ({bankInfo.bank_code})
                      </span>
                    </div>

                    {/* Chủ tài khoản */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase">
                        {bankInfo.account_name}
                      </span>
                    </div>

                    {/* Số tài khoản + Copy button */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {bankInfo.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                          className="p-1 rounded-md text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          {hasCopiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Số tiền */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                        {formatPrice(currentOrder.amount)}
                      </span>
                    </div>

                    {/* Nội dung chuyển khoản + Copy button (QUAN TRỌNG) */}
                    <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-800 dark:text-brand-300 text-[11px]">
                          Nội dung chuyển khoản (bắt buộc):
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentOrder.order_code, 'content')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          {hasCopiedContent ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono font-extrabold text-brand-700 dark:text-brand-200 text-base tracking-wider">
                        {currentOrder.order_code}
                      </div>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý quan trọng:</strong> Vui lòng chuyển đúng số tiền và đúng nội dung chuyển khoản để hệ thống SePay tự động xác nhận trong vòng 10–30 giây.
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 Navigation Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Đổi thông tin
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualCheckPayment}
                    disabled={isCheckingPayment}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                    <span>Kiểm tra lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Tôi sẽ chuyển khoản sau
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: KÍCH HOẠT THÀNH CÔNG ================= */}
          {step === 4 && currentOrder && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Thanh toán thành công!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  Hệ thống SePay đã ghi nhận giao dịch cho đơn hàng {currentOrder.order_code}
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Gói đã kích hoạt:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentOrder.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Thời hạn sử dụng:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentOrder.plan_days} ngày</span>
                </div>
                {currentOrder.expired_at && (
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Hiệu lực đến ngày:</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {new Date(currentOrder.expired_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Khách hàng:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentOrder.customer_name} ({currentOrder.customer_email})</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                >
                  Bắt đầu sử dụng ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
