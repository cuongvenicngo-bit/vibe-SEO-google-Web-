import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { registerTrialApi, getStoredCustomerInfo } from '../services/subscriptionApi';
import { Subscription } from '../types/subscription';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sub: Subscription) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TrialModal: React.FC<TrialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubscription, setSuccessSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedInfo = getStoredCustomerInfo();
      if (savedInfo.name) setCustomerName(savedInfo.name);
      if (savedInfo.email) setCustomerEmail(savedInfo.email);
      if (savedInfo.phone) setCustomerPhone(savedInfo.phone);
      setErrorMessage(null);
      setSuccessSubscription(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerTrialApi({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        note: customerNote,
      });

      setSuccessSubscription(res.subscription);
      onSuccess(res.subscription);
      onShowToast('Kích hoạt dùng thử thành công!', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đăng ký dùng thử');
      onShowToast(err.message || 'Không thể đăng ký dùng thử', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Đăng ký Dùng thử Miễn phí</h3>
              <p className="text-xs text-blue-100">Trải nghiệm toàn diện tính năng PHÂN TÍCH WEB 360</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {successSubscription ? (
            /* Success Screen */
            <div className="py-4 text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Kích hoạt dùng thử thành công!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Bạn được dùng thử đến{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {new Date(successSubscription.expired_at).toLocaleDateString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Họ tên:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{successSubscription.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{successSubscription.customer_email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Đang hoạt động</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Bắt đầu sử dụng
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Đăng ký dùng thử miễn phí trong <strong>24 giờ</strong>. Không cần thẻ tín dụng, kích hoạt tức thì.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {formErrors.name && (
                  <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.name}</span>
                )}
              </div>

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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {formErrors.email && (
                  <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.email}</span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {formErrors.phone && (
                  <span className="text-rose-500 text-[11px] mt-0.5 block">{formErrors.phone}</span>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Ghi chú thêm (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Lĩnh vực kinh doanh hoặc website của bạn"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang kiểm tra và kích hoạt...</span>
                    </>
                  ) : (
                    <>
                      <span>Kích hoạt dùng thử ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
