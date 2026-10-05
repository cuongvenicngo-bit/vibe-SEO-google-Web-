export interface Plan {
  id: string;
  name: string;
  days: number;
  price: number;
  description: string;
  features?: string[];
  is_active: boolean;
  is_featured: boolean;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'underpaid';

export interface Order {
  order_id: string;
  order_code: string;
  plan_id: string;
  plan_name: string;
  plan_days: number;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  note?: string;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
  expired_at?: string;
  payment_content: string;
  payment_method: 'sepay';
}

export interface PaymentRecord {
  payment_id: string;
  order_code: string;
  transaction_id: string;
  amount: number;
  content: string;
  bank_brand_name: string;
  account_number: string;
  paid_at: string;
  created_at: string;
}

export type SubscriptionType = 'paid' | 'trial';

export interface Subscription {
  subscription_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  subscription_type: SubscriptionType;
  plan_name: string;
  order_code?: string;
  started_at: string;
  expired_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SePaySettings {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  api_key: string;
  webhook_secret: string;
  order_prefix: string;
  transfer_content_template: string;
  is_active: boolean;
  updated_at: string;
}

export interface TrialSettings {
  is_active: boolean;
  trial_hours: number;
  button_title: string;
  description: string;
  max_trials_per_email: number;
  max_trials_per_phone: number;
  max_trials_per_device: number;
  updated_at: string;
}

export interface TrialLog {
  trial_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device_id?: string;
  ip_address?: string;
  user_agent?: string;
  started_at: string;
  expired_at: string;
  status: 'active' | 'expired' | 'upgraded';
  created_at: string;
}

export interface WebhookLog {
  log_id: string;
  received_at: string;
  content: string;
  amount: number;
  detected_order_code: string | null;
  result: 'success' | 'underpaid' | 'order_not_found' | 'already_paid' | 'error';
  message: string;
  raw_payload: any;
}

export interface CustomerSubscriptionStatus {
  has_access: boolean;
  is_trial: boolean;
  is_paid: boolean;
  is_expired: boolean;
  plan_name?: string;
  customer_email?: string;
  customer_name?: string;
  started_at?: string;
  expired_at?: string;
  remaining_days?: number;
  remaining_hours?: number;
  message?: string;
}
