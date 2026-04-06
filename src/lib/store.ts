import { Order, Payment, PaymentStatus } from './types';

const STORAGE_KEY = 'printshop_orders';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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

export function addOrder(input: Omit<Order, 'id' | 'paidAmount' | 'remainingAmount' | 'paymentStatus' | 'payments' | 'createdAt'>): Order {
  const paidAmount = input.deposit || 0;
  const remainingAmount = input.totalPrice - paidAmount;
  const order: Order = {
    ...input,
    id: generateId(),
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
  // recalc
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
