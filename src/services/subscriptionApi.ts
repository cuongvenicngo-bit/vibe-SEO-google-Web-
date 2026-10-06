import {
  Plan,
  Order,
  Subscription,
  SePaySettings,
  TrialSettings,
  TrialLog,
  WebhookLog,
  CustomerSubscriptionStatus,
} from '../types/subscription';

const CUSTOMER_EMAIL_KEY = 'web360_customer_email';
const CUSTOMER_PHONE_KEY = 'web360_customer_phone';
const CUSTOMER_NAME_KEY = 'web360_customer_name';
const DEVICE_ID_KEY = 'web360_device_uuid';

export function getStoredCustomerEmail(): string {
  try {
    return localStorage.getItem(CUSTOMER_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredCustomerInfo(info: { email: string; name?: string; phone?: string }) {
  try {
    if (info.email) localStorage.setItem(CUSTOMER_EMAIL_KEY, info.email.trim().toLowerCase());
    if (info.name) localStorage.setItem(CUSTOMER_NAME_KEY, info.name.trim());
    if (info.phone) localStorage.setItem(CUSTOMER_PHONE_KEY, info.phone.trim());
  } catch (err) {
    console.error('Failed to store customer info:', err);
  }
}

export function getStoredCustomerInfo(): { email: string; name: string; phone: string } {
  try {
    return {
      email: localStorage.getItem(CUSTOMER_EMAIL_KEY) || '',
      name: localStorage.getItem(CUSTOMER_NAME_KEY) || '',
      phone: localStorage.getItem(CUSTOMER_PHONE_KEY) || '',
    };
  } catch {
    return { email: '', name: '', phone: '' };
  }
}

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_fallback_' + Date.now();
  }
}

// ---------------- PUBLIC API CALLS ----------------

export async function fetchPlansApi(): Promise<Plan[]> {
  const res = await fetch('/api/plans');
  if (!res.ok) throw new Error('Không thể tải danh sách gói dịch vụ');
  const data = await res.json();
  return data.plans || [];
}

export async function createOrderApi(payload: {
  plan_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  note?: string;
}): Promise<{
  order: Order;
  bank_info: {
    bank_name: string;
    bank_code: string;
    account_number: string;
    account_name: string;
    amount: number;
    transfer_content: string;
    qr_url: string;
  };
}> {
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Không thể tạo đơn hàng thanh toán');
  }

  // Remember customer email
  setStoredCustomerInfo({
    email: payload.customer_email,
    name: payload.customer_name,
    phone: payload.customer_phone,
  });

  return data;
}

export async function checkOrderStatusApi(orderCode: string): Promise<{
  status: Order['status'];
  order: Order;
  is_paid: boolean;
}> {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/status`);
  if (!res.ok) throw new Error('Không thể kiểm tra trạng thái đơn hàng');
  return res.json();
}

export async function registerTrialApi(payload: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  note?: string;
}): Promise<{
  success: boolean;
  subscription: Subscription;
  message: string;
}> {
  const deviceId = getOrCreateDeviceId();
  const res = await fetch('/api/trial/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      device_id: deviceId,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Đăng ký dùng thử không thành công');
  }

  // Store customer info
  setStoredCustomerInfo({
    email: payload.customer_email,
    name: payload.customer_name,
    phone: payload.customer_phone,
  });

  return data;
}

export async function checkSubscriptionStatusApi(email?: string): Promise<CustomerSubscriptionStatus> {
  const effectiveEmail = email || getStoredCustomerEmail();
  const deviceId = getOrCreateDeviceId();

  const res = await fetch('/api/subscription/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: effectiveEmail,
      device_id: deviceId,
    }),
  });

  if (!res.ok) {
    return {
      has_access: false,
      is_trial: false,
      is_paid: false,
      is_expired: false,
      message: 'Không thể xác thực trạng thái gói',
    };
  }

  return res.json();
}

// ---------------- ADMIN API CALLS ----------------

function getAdminHeaders(passcode: string) {
  return {
    'Content-Type': 'application/json',
    'x-admin-passcode': passcode.trim(),
  };
}

export async function verifyAdminPasscodeApi(passcode: string): Promise<boolean> {
  const res = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  return !!data.valid;
}

export async function getAdminDataApi(passcode: string): Promise<{
  plans: Plan[];
  sepay_settings: SePaySettings;
  trial_settings: TrialSettings;
  orders: Order[];
  webhook_logs: WebhookLog[];
  active_subscriptions: Subscription[];
  trial_logs: TrialLog[];
  webhook_url: string;
  storage_mode?: 'shared' | 'temporary' | 'local-file';
}> {
  const res = await fetch('/api/admin/dashboard-data', {
    headers: getAdminHeaders(passcode),
  });
  if (!res.ok) throw new Error('Mật khẩu quản trị viên không chính xác hoặc phiên đã hết hạn');
  return res.json();
}

export async function saveAdminPlansApi(plans: Plan[], passcode: string) {
  const res = await fetch('/api/admin/plans', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify({ plans }),
  });
  if (!res.ok) throw new Error('Không thể lưu danh sách gói');
  return res.json();
}

export async function saveAdminSePaySettingsApi(settings: Partial<SePaySettings>, passcode: string) {
  const res = await fetch('/api/admin/sepay-settings', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error('Không thể lưu cấu hình SePay');
  return res.json();
}

export async function saveAdminTrialSettingsApi(settings: Partial<TrialSettings>, passcode: string) {
  const res = await fetch('/api/admin/trial-settings', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error('Không thể lưu cấu hình dùng thử');
  return res.json();
}

export async function testSePayConnectionApi(passcode: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const res = await fetch('/api/admin/sepay-test-connection', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Kết nối SePay không thành công');
  }
  return data;
}

export async function createTestTransactionApi(
  orderCode: string,
  amount: number,
  passcode: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/sepay-test-transaction', {
    method: 'POST',
    headers: getAdminHeaders(passcode),
    body: JSON.stringify({ order_code: orderCode, amount }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Không thể tạo giao dịch test');
  }
  return data;
}

export async function manualActivateOrderApi(
  orderCode: string,
  passcode: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/activate`, {
    method: 'POST',
    headers: getAdminHeaders(passcode),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Không thể kích hoạt đơn hàng thủ công');
  }
  return data;
}
