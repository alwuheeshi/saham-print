import { Order, Payment, PaymentStatus } from './types';

const STORAGE_KEY = 'printshop_orders';
const ORDER_NUMBER_KEY = 'printshop_order_number';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getNextOrderNumber(): number {
  const current = localStorage.getItem(ORDER_NUMBER_KEY);
  const next = current ? parseInt(current) + 1 : 1001;
  localStorage.setItem(ORDER_NUMBER_KEY, next.toString());
  return next;
}

function calcPaymentStatus(totalPrice: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalPrice) return 'paid';
  return 'partially_paid';
}

export function getOrders(): Order[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function addOrder(input: Omit<Order, 'id' | 'orderNumber' | 'paidAmount' | 'remainingAmount' | 'paymentStatus' | 'payments' | 'createdAt'>): Order {
  const paidAmount = input.deposit || 0;
  const remainingAmount = input.totalPrice - paidAmount;
  const order: Order = {
    ...input,
    id: generateId(),
    orderNumber: getNextOrderNumber(),
    payments: paidAmount > 0 ? [{ id: generateId(), amount: paidAmount, date: new Date().toISOString(), note: 'عربون' }] : [],
    paidAmount,
    remainingAmount,
    paymentStatus: calcPaymentStatus(input.totalPrice, paidAmount),
    createdAt: new Date().toISOString(),
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

export function updateOrder(id: string, updates: Partial<Order>): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  const order = { ...orders[idx], ...updates };
  order.paidAmount = order.payments.reduce((s: number, p: Payment) => s + p.amount, 0);
  order.remainingAmount = order.totalPrice - order.paidAmount;
  order.paymentStatus = calcPaymentStatus(order.totalPrice, order.paidAmount);
  orders[idx] = order;
  saveOrders(orders);
  return order;
}

export function addPayment(orderId: string, amount: number, note?: string): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  const order = orders[idx];
  order.payments.push({ id: generateId(), amount, date: new Date().toISOString(), note });
  order.paidAmount = order.payments.reduce((s, p) => s + p.amount, 0);
  order.remainingAmount = order.totalPrice - order.paidAmount;
  order.paymentStatus = calcPaymentStatus(order.totalPrice, order.paidAmount);
  orders[idx] = order;
  saveOrders(orders);
  return order;
}

export function deleteOrder(id: string) {
  const orders = getOrders().filter(o => o.id !== id);
  saveOrders(orders);
}

export function getOrder(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}

export function searchOrders(query: string): Order[] {
  const q = query.toLowerCase();
  return getOrders().filter(o =>
    o.customerName.toLowerCase().includes(q) ||
    o.phone.includes(q) ||
    o.orderNumber?.toString().includes(q) ||
    o.id.includes(q)
  );
}

export function exportBackup(): string {
  const data = {
    orders: localStorage.getItem(STORAGE_KEY),
    customers: localStorage.getItem('printshop_customers'),
    services: localStorage.getItem('printshop_services'),
    orderNumber: localStorage.getItem(ORDER_NUMBER_KEY),
    credentials: localStorage.getItem('printshop_credentials'),
  };
  return JSON.stringify(data);
}

export function importBackup(json: string) {
  const data = JSON.parse(json);
  if (data.orders) localStorage.setItem(STORAGE_KEY, data.orders);
  if (data.customers) localStorage.setItem('printshop_customers', data.customers);
  if (data.services) localStorage.setItem('printshop_services', data.services);
  if (data.orderNumber) localStorage.setItem(ORDER_NUMBER_KEY, data.orderNumber);
  if (data.credentials) localStorage.setItem('printshop_credentials', data.credentials);
}
