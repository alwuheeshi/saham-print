import {
  addDbOrder,
  addDbPayment,
  deleteDbOrder,
  getDbOrder,
  listDbOrders,
  updateDbOrder,
  type DbOrder,
  type DbOrderInput,
} from './database';
import type { Order } from './types';

type OrderInput = Omit<Order, 'id' | 'orderNumber' | 'paidAmount' | 'remainingAmount' | 'paymentStatus' | 'payments' | 'createdAt'>;

function toOrder(order: DbOrder): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    serviceType: order.serviceType,
    description: order.description,
    dimensions: order.dimensions || undefined,
    quantity: order.quantity,
    notes: order.notes || undefined,
    assignedDesigner: order.assignedDesigner || undefined,
    assignedPrinter: order.assignedPrinter || undefined,
    assignedInstaller: order.assignedInstaller || undefined,
    totalPrice: order.totalPrice,
    deposit: order.deposit,
    payments: order.payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date,
      note: payment.note || undefined,
    })),
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
    paymentStatus: order.paymentStatus,
    deliveryDate: order.deliveryDate,
    status: order.status,
    createdAt: order.createdAt,
  };
}

function toOrderInput(input: Partial<Order> & OrderInput): DbOrderInput {
  return {
    customerName: input.customerName || '',
    phone: input.phone || '',
    serviceType: input.serviceType || 'printing',
    description: input.description || '',
    dimensions: input.dimensions || null,
    quantity: input.quantity || 1,
    notes: input.notes || null,
    assignedDesigner: input.assignedDesigner || null,
    assignedPrinter: input.assignedPrinter || null,
    assignedInstaller: input.assignedInstaller || null,
    totalPrice: input.totalPrice || 0,
    deposit: input.deposit || 0,
    deliveryDate: input.deliveryDate || '',
    status: input.status || 'new',
  };
}

export async function getOrders(): Promise<Order[]> {
  const orders = await listDbOrders();
  return orders.map(toOrder);
}

export async function addOrder(input: OrderInput): Promise<Order> {
  return toOrder(await addDbOrder(toOrderInput(input)));
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  return toOrder(await updateDbOrder(id, toOrderInput(merged)));
}

export async function addPayment(orderId: string, amount: number, note?: string): Promise<Order | null> {
  return toOrder(await addDbPayment(orderId, { amount, note: note || null }));
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDbOrder(id);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const order = await getDbOrder(id);
  return order ? toOrder(order) : undefined;
}

export async function searchOrders(query: string): Promise<Order[]> {
  const q = query.toLowerCase();
  return (await getOrders()).filter(o =>
    o.customerName.toLowerCase().includes(q) ||
    o.phone.includes(q) ||
    o.orderNumber?.toString().includes(q) ||
    o.id.includes(q)
  );
}
