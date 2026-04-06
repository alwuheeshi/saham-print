export type ServiceType = string;
export type OrderStatus = 'new' | 'in_progress' | 'done' | 'delivered';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  serviceType: ServiceType;
  description: string;
  totalPrice: number;
  deposit: number;
  payments: Payment[];
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  deliveryDate: string;
  status: OrderStatus;
  createdAt: string;
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  printing: 'طباعة',
  tshirts: 'تيشيرتات',
  banners: 'بنرات',
  cups: 'أكواب',
  stickers: 'ستيكرات',
  cards: 'كروت',
  other: 'أخرى',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  in_progress: 'قيد التنفيذ',
  done: 'جاهز',
  delivered: 'تم التسليم',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  partially_paid: 'مدفوع جزئياً',
  paid: 'مدفوع بالكامل',
};
