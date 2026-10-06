import fs from 'fs';
import path from 'path';
import {
  Plan,
  Order,
  PaymentRecord,
  Subscription,
  SePaySettings,
  TrialSettings,
  TrialLog,
  WebhookLog,
  CustomerSubscriptionStatus,
} from '../types/subscription';

// Vercel functions can only write to /tmp, and that copy is lost whenever the instance is recycled.
const DATA_DIR = process.env.VERCEL ? '/tmp/web360-data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'app_database.json');

// Optional shared store (Upstash Redis REST, e.g. added from the Vercel Marketplace) so that
// orders, subscriptions and admin settings survive across serverless instances.
const REMOTE_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REMOTE_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REMOTE_KEY = 'web360:app_database';
const hasRemoteStore = () => !!(REMOTE_URL && REMOTE_TOKEN);
let pendingRemoteSave: Promise<void> | null = null;

async function redisCommand(command: string[]): Promise<any> {
  const res = await fetch(REMOTE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REMOTE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis ${command[0]} failed with HTTP ${res.status}`);
  return (await res.json()).result;
}

interface DatabaseSchema {
  plans: Plan[];
  orders: Order[];
  payments: PaymentRecord[];
  subscriptions: Subscription[];
  sepay_settings: SePaySettings;
  trial_settings: TrialSettings;
  trial_logs: TrialLog[];
  webhook_logs: WebhookLog[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_7d',
    name: 'Gói 7 ngày',
    days: 7,
    price: 99000,
    description: 'Trải nghiệm đầy đủ phân tích website 10X cho 1 chiến dịch',
    features: [
      'Phân tích 360° toàn diện 8 bước',
      'Định vị đối thủ & bản đồ radar D3',
      'Bản kế hoạch hành động 3 giai đoạn',
      'Xuất báo cáo TXT chuẩn UTF-8 & PDF',
    ],
    is_active: true,
    is_featured: false,
  },
  {
    id: 'plan_30d',
    name: 'Gói 30 ngày',
    days: 30,
    price: 199000,
    description: 'Lựa chọn tối ưu cho chủ shop, doanh nghiệp & agency vừa và nhỏ',
    features: [
      'Tất cả tính năng của gói 7 ngày',
      'Không giới hạn số lần phân tích website',
      'Ưu tiên tốc độ xử lý AI Gemini cao cấp',
      'Chiến lược nội dung & kịch bản chốt sale 10X',
    ],
    is_active: true,
    is_featured: true,
  },
  {
    id: 'plan_90d',
    name: 'Gói 90 ngày',
    days: 90,
    price: 499000,
    description: 'Tiết kiệm chi phí tối đa, đồng hành chiến lược chuyển đổi số quý',
    features: [
      'Tất cả tính năng của gói 30 ngày',
      'Tiết kiệm hơn 30% so với gia hạn từng tháng',
      'Phân tích đối thủ sâu & phát hiện khoảng trống',
      'Cập nhật tự động các tiêu chí chuẩn thương mại mới',
    ],
    is_active: true,
    is_featured: false,
  },
];

const DEFAULT_SEPAY_SETTINGS: SePaySettings = {
  bank_name: 'MBBank (Ngân hàng Quân Đội)',
  bank_code: 'MB',
  account_number: '0388888888',
  account_name: 'CONG TY TNHH PHAN TICH WEB 360',
  api_key: process.env.SEPAY_API_KEY || '',
  webhook_secret: process.env.SEPAY_WEBHOOK_SECRET || '',
  order_prefix: 'AFF',
  transfer_content_template: '{ORDER_CODE}',
  is_active: true,
  updated_at: new Date().toISOString(),
};

const DEFAULT_TRIAL_SETTINGS: TrialSettings = {
  is_active: true,
  trial_hours: 24,
  button_title: 'Dùng thử miễn phí',
  description: 'Trải nghiệm đầy đủ tính năng PHÂN TÍCH WEB 360 trong 24 giờ hoàn toàn miễn phí',
  max_trials_per_email: 1,
  max_trials_per_phone: 1,
  max_trials_per_device: 1,
  updated_at: new Date().toISOString(),
};

// In-memory cache synced with disk
let dbMemory: DatabaseSchema | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  if (dbMemory) return dbMemory;

  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      dbMemory = {
        plans: parsed.plans || DEFAULT_PLANS,
        orders: parsed.orders || [],
        payments: parsed.payments || [],
        subscriptions: parsed.subscriptions || [],
        sepay_settings: { ...DEFAULT_SEPAY_SETTINGS, ...(parsed.sepay_settings || {}) },
        trial_settings: { ...DEFAULT_TRIAL_SETTINGS, ...(parsed.trial_settings || {}) },
        trial_logs: parsed.trial_logs || [],
        webhook_logs: parsed.webhook_logs || [],
      };
      return dbMemory;
    } catch (err) {
      console.error('Failed to parse database file, initializing defaults:', err);
    }
  }

  // Initialize new default database
  dbMemory = {
    plans: DEFAULT_PLANS,
    orders: [],
    payments: [],
    subscriptions: [],
    sepay_settings: DEFAULT_SEPAY_SETTINGS,
    trial_settings: DEFAULT_TRIAL_SETTINGS,
    trial_logs: [],
    webhook_logs: [],
  };

  saveDatabase();
  return dbMemory;
}

function saveDatabase() {
  if (!dbMemory) return;
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
  if (hasRemoteStore()) {
    const snapshot = JSON.stringify(dbMemory);
    pendingRemoteSave = redisCommand(['SET', REMOTE_KEY, snapshot]).then(() => undefined);
  }
}

/** Reloads the in-memory database from the shared store (no-op without one). */
export async function hydrateDatabase(): Promise<void> {
  if (!hasRemoteStore()) return;
  const stored = await redisCommand(['GET', REMOTE_KEY]);
  if (typeof stored !== 'string') {
    // First run against an empty store: publish the current (default) data.
    loadDatabase();
    saveDatabase();
    return;
  }
  const parsed = JSON.parse(stored);
  dbMemory = {
    plans: parsed.plans || DEFAULT_PLANS,
    orders: parsed.orders || [],
    payments: parsed.payments || [],
    subscriptions: parsed.subscriptions || [],
    sepay_settings: { ...DEFAULT_SEPAY_SETTINGS, ...(parsed.sepay_settings || {}) },
    trial_settings: { ...DEFAULT_TRIAL_SETTINGS, ...(parsed.trial_settings || {}) },
    trial_logs: parsed.trial_logs || [],
    webhook_logs: parsed.webhook_logs || [],
  };
}

/** Waits until the latest change has been written to the shared store. */
export async function flushDatabase(): Promise<void> {
  const pending = pendingRemoteSave;
  pendingRemoteSave = null;
  if (pending) await pending;
}

export function getStorageMode(): 'shared' | 'temporary' | 'local-file' {
  if (hasRemoteStore()) return 'shared';
  return process.env.VERCEL ? 'temporary' : 'local-file';
}

// ----------------- PLANS -----------------
export function getPlans(onlyActive = true): Plan[] {
  const db = loadDatabase();
  if (onlyActive) {
    return db.plans.filter((p) => p.is_active);
  }
  return db.plans;
}

export function getPlanById(id: string): Plan | undefined {
  const db = loadDatabase();
  return db.plans.find((p) => p.id === id);
}

export function savePlans(plans: Plan[]): void {
  const db = loadDatabase();
  db.plans = plans;
  saveDatabase();
}

// ----------------- SEPAY SETTINGS -----------------
export function getSePaySettings(): SePaySettings {
  const db = loadDatabase();
  // Sync env vars if not set in db
  if (!db.sepay_settings.api_key && process.env.SEPAY_API_KEY) {
    db.sepay_settings.api_key = process.env.SEPAY_API_KEY;
  }
  if (!db.sepay_settings.webhook_secret && process.env.SEPAY_WEBHOOK_SECRET) {
    db.sepay_settings.webhook_secret = process.env.SEPAY_WEBHOOK_SECRET;
  }
  return db.sepay_settings;
}

export function updateSePaySettings(newSettings: Partial<SePaySettings>): SePaySettings {
  const db = loadDatabase();
  db.sepay_settings = {
    ...db.sepay_settings,
    ...newSettings,
    updated_at: new Date().toISOString(),
  };
  saveDatabase();
  return db.sepay_settings;
}

// ----------------- TRIAL SETTINGS -----------------
export function getTrialSettings(): TrialSettings {
  const db = loadDatabase();
  return db.trial_settings;
}

export function updateTrialSettings(newSettings: Partial<TrialSettings>): TrialSettings {
  const db = loadDatabase();
  db.trial_settings = {
    ...db.trial_settings,
    ...newSettings,
    updated_at: new Date().toISOString(),
  };
  saveDatabase();
  return db.trial_settings;
}

// ----------------- ORDERS -----------------
export function getOrders(): Order[] {
  const db = loadDatabase();
  return db.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getOrderByCode(code: string): Order | undefined {
  const db = loadDatabase();
  const normalized = (code || '').trim().toUpperCase();
  return db.orders.find((o) => o.order_code.toUpperCase() === normalized);
}

export function generateNextOrderCode(prefix = 'AFF'): string {
  const db = loadDatabase();
  const existingNumbers = db.orders
    .map((o) => {
      const match = o.order_code.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(6, '0')}`;
}

export function createOrder(data: {
  plan_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  note?: string;
}): Order {
  const db = loadDatabase();
  const plan = getPlanById(data.plan_id);
  if (!plan) {
    throw new Error('Gói dịch vụ không tồn tại');
  }

  const prefix = db.sepay_settings.order_prefix || 'AFF';
  const orderCode = generateNextOrderCode(prefix);

  const newOrder: Order = {
    order_id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    order_code: orderCode,
    plan_id: plan.id,
    plan_name: plan.name,
    plan_days: plan.days,
    amount: plan.price,
    customer_name: data.customer_name.trim(),
    customer_email: data.customer_email.trim().toLowerCase(),
    customer_phone: data.customer_phone.trim(),
    note: data.note?.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
    payment_content: orderCode,
    payment_method: 'sepay',
  };

  db.orders.push(newOrder);
  saveDatabase();
  return newOrder;
}

export function updateOrderStatus(
  orderCode: string,
  status: Order['status'],
  extra?: { paid_at?: string; expired_at?: string }
): Order | undefined {
  const db = loadDatabase();
  const order = db.orders.find((o) => o.order_code.toUpperCase() === orderCode.toUpperCase());
  if (!order) return undefined;

  order.status = status;
  if (extra?.paid_at) order.paid_at = extra.paid_at;
  if (extra?.expired_at) order.expired_at = extra.expired_at;

  saveDatabase();
  return order;
}

// ----------------- SUBSCRIPTIONS -----------------
export function getSubscriptions(): Subscription[] {
  const db = loadDatabase();
  return db.subscriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getActiveSubscriptions(): Subscription[] {
  const db = loadDatabase();
  const now = new Date().getTime();
  return db.subscriptions.filter((s) => s.is_active && new Date(s.expired_at).getTime() > now);
}

export function getSubscriptionByEmail(email: string): Subscription | undefined {
  if (!email) return undefined;
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  // Sort latest first
  const subs = db.subscriptions
    .filter((s) => s.customer_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.expired_at).getTime() - new Date(a.expired_at).getTime());

  return subs[0];
}

export function activatePaidSubscription(order: Order): Subscription {
  const db = loadDatabase();
  const now = new Date();
  const planDays = order.plan_days || 30;

  // Calculate expired date: paid_at + plan_days
  const paidAt = order.paid_at ? new Date(order.paid_at) : now;
  const expiredAt = new Date(paidAt.getTime() + planDays * 24 * 60 * 60 * 1000);

  // Check if existing active subscription exists for email
  const existing = getSubscriptionByEmail(order.customer_email);
  let sub: Subscription;

  if (existing && existing.is_active && new Date(existing.expired_at).getTime() > now.getTime()) {
    // If existing paid subscription is still active, extend its expiry!
    const baseTime = Math.max(new Date(existing.expired_at).getTime(), now.getTime());
    const newExpiry = new Date(baseTime + planDays * 24 * 60 * 60 * 1000);

    existing.subscription_type = 'paid';
    existing.plan_name = order.plan_name;
    existing.order_code = order.order_code;
    existing.expired_at = newExpiry.toISOString();
    existing.customer_name = order.customer_name;
    existing.customer_phone = order.customer_phone;
    sub = existing;
  } else {
    sub = {
      subscription_id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      customer_email: order.customer_email.toLowerCase(),
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      subscription_type: 'paid',
      plan_name: order.plan_name,
      order_code: order.order_code,
      started_at: paidAt.toISOString(),
      expired_at: expiredAt.toISOString(),
      is_active: true,
      created_at: now.toISOString(),
    };
    db.subscriptions.push(sub);
  }

  // Update order's expired_at
  updateOrderStatus(order.order_code, 'paid', {
    paid_at: paidAt.toISOString(),
    expired_at: sub.expired_at,
  });

  saveDatabase();
  return sub;
}

// ----------------- TRIAL SYSTEM -----------------
export function getTrialLogs(): TrialLog[] {
  const db = loadDatabase();
  return db.trial_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function hasEmailTrialed(email: string): boolean {
  if (!email) return false;
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  return db.trial_logs.some((t) => t.customer_email.toLowerCase() === normalized);
}

export function hasPhoneTrialed(phone: string): boolean {
  if (!phone) return false;
  const db = loadDatabase();
  const normalized = phone.trim().replace(/\D/g, '');
  return db.trial_logs.some((t) => t.customer_phone.replace(/\D/g, '') === normalized);
}

export function hasDeviceTrialed(deviceId: string): boolean {
  if (!deviceId) return false;
  const db = loadDatabase();
  return db.trial_logs.some((t) => t.device_id === deviceId);
}

export function registerTrial(data: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device_id?: string;
  ip_address?: string;
  user_agent?: string;
}): { subscription: Subscription; trialLog: TrialLog } {
  const db = loadDatabase();
  const settings = db.trial_settings;

  if (!settings.is_active) {
    throw new Error('Chương trình dùng thử hiện chưa được bật.');
  }

  const email = data.customer_email.trim().toLowerCase();
  const phone = data.customer_phone.trim();

  if (settings.max_trials_per_email > 0 && hasEmailTrialed(email)) {
    throw new Error('Email này đã sử dụng lượt dùng thử.');
  }

  if (settings.max_trials_per_phone > 0 && hasPhoneTrialed(phone)) {
    throw new Error('Số điện thoại này đã sử dụng lượt dùng thử.');
  }

  if (data.device_id && settings.max_trials_per_device > 0 && hasDeviceTrialed(data.device_id)) {
    throw new Error('Thiết bị này đã sử dụng lượt dùng thử.');
  }

  const now = new Date();
  const trialHours = settings.trial_hours || 24;
  const expiredAt = new Date(now.getTime() + trialHours * 60 * 60 * 1000);

  const trialLog: TrialLog = {
    trial_id: `trial_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    customer_name: data.customer_name.trim(),
    customer_email: email,
    customer_phone: phone,
    device_id: data.device_id,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    started_at: now.toISOString(),
    expired_at: expiredAt.toISOString(),
    status: 'active',
    created_at: now.toISOString(),
  };
  db.trial_logs.push(trialLog);

  // Create trial subscription
  const sub: Subscription = {
    subscription_id: `sub_trial_${Date.now()}`,
    customer_email: email,
    customer_name: data.customer_name.trim(),
    customer_phone: phone,
    subscription_type: 'trial',
    plan_name: `Dùng thử (${trialHours} giờ)`,
    started_at: now.toISOString(),
    expired_at: expiredAt.toISOString(),
    is_active: true,
    created_at: now.toISOString(),
  };
  db.subscriptions.push(sub);

  saveDatabase();
  return { subscription: sub, trialLog };
}

// ----------------- ACCESS CHECK -----------------
export function checkCustomerAccess(identifier?: {
  email?: string;
  phone?: string;
  deviceId?: string;
}): CustomerSubscriptionStatus {
  if (!identifier || (!identifier.email && !identifier.deviceId && !identifier.phone)) {
    return {
      has_access: false,
      is_trial: false,
      is_paid: false,
      is_expired: false,
      message: 'Bạn cần mua gói hoặc đăng ký dùng thử để sử dụng công cụ này.',
    };
  }

  const db = loadDatabase();
  const now = new Date().getTime();

  // Find subscription by email first
  let sub: Subscription | undefined;
  if (identifier.email) {
    sub = getSubscriptionByEmail(identifier.email);
  }

  // Fallback to phone
  if (!sub && identifier.phone) {
    const cleanPhone = identifier.phone.replace(/\D/g, '');
    sub = db.subscriptions
      .filter((s) => s.customer_phone.replace(/\D/g, '') === cleanPhone)
      .sort((a, b) => new Date(b.expired_at).getTime() - new Date(a.expired_at).getTime())[0];
  }

  if (!sub) {
    return {
      has_access: false,
      is_trial: false,
      is_paid: false,
      is_expired: false,
      message: 'Bạn chưa có gói sử dụng đang hoạt động.',
    };
  }

  const expireTime = new Date(sub.expired_at).getTime();
  const isExpired = expireTime <= now;

  if (isExpired) {
    return {
      has_access: false,
      is_trial: sub.subscription_type === 'trial',
      is_paid: sub.subscription_type === 'paid',
      is_expired: true,
      plan_name: sub.plan_name,
      customer_email: sub.customer_email,
      customer_name: sub.customer_name,
      started_at: sub.started_at,
      expired_at: sub.expired_at,
      message:
        sub.subscription_type === 'trial'
          ? 'Thời gian dùng thử đã hết, vui lòng mua gói để tiếp tục.'
          : 'Gói sử dụng đã hết hạn, vui lòng gia hạn để tiếp tục.',
    };
  }

  const remainingMs = expireTime - now;
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.max(1, Math.floor(remainingMs / (60 * 60 * 1000)));

  return {
    has_access: true,
    is_trial: sub.subscription_type === 'trial',
    is_paid: sub.subscription_type === 'paid',
    is_expired: false,
    plan_name: sub.plan_name,
    customer_email: sub.customer_email,
    customer_name: sub.customer_name,
    started_at: sub.started_at,
    expired_at: sub.expired_at,
    remaining_days: remainingDays,
    remaining_hours: remainingHours,
    message:
      sub.subscription_type === 'trial'
        ? `Bạn đang dùng thử, còn ${remainingHours} giờ.`
        : `Gói đang hoạt động, còn ${remainingDays} ngày.`,
  };
}

// ----------------- PAYMENTS & WEBHOOKS -----------------
export function createPayment(record: Omit<PaymentRecord, 'payment_id' | 'created_at'>): PaymentRecord {
  const db = loadDatabase();
  const payment: PaymentRecord = {
    ...record,
    payment_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  db.payments.push(payment);
  saveDatabase();
  return payment;
}

export function getPayments(): PaymentRecord[] {
  const db = loadDatabase();
  return db.payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createWebhookLog(log: Omit<WebhookLog, 'log_id' | 'received_at'>): WebhookLog {
  const db = loadDatabase();
  const newLog: WebhookLog = {
    ...log,
    log_id: `whl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    received_at: new Date().toISOString(),
  };
  db.webhook_logs.unshift(newLog); // latest first
  // Keep last 500 logs to prevent unbounded growth
  if (db.webhook_logs.length > 500) {
    db.webhook_logs = db.webhook_logs.slice(0, 500);
  }
  saveDatabase();
  return newLog;
}

export function getWebhookLogs(): WebhookLog[] {
  const db = loadDatabase();
  return db.webhook_logs;
}
