import { invoke } from '@tauri-apps/api/core';
import type { OrderStatus, PaymentStatus } from './types';

export interface DatabaseStatus {
  path: string;
  schemaVersion: number;
  customerCount: number;
  serviceCount: number;
  orderCount: number;
  paymentCount: number;
}

export interface DbCustomer {
  id: string;
  name: string;
  phone: string;
  business?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface DbCustomerInput {
  id?: string;
  name: string;
  phone: string;
  business?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface DbService {
  id: string;
  label: string;
}

export interface DbServiceInput {
  id?: string;
  label: string;
}

export interface DbPayment {
  id: string;
  amount: number;
  date: string;
  note?: string | null;
}

export interface DbOrder {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  phone: string;
  serviceType: string;
  description: string;
  dimensions?: string | null;
  quantity: number;
  notes?: string | null;
  assignedDesigner?: string | null;
  assignedPrinter?: string | null;
  assignedInstaller?: string | null;
  totalPrice: number;
  deposit: number;
  payments: DbPayment[];
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  deliveryDate: string;
  status: OrderStatus;
  createdAt: string;
}

export interface DbOrderInput {
  customerName: string;
  phone: string;
  serviceType: string;
  description: string;
  dimensions?: string | null;
  quantity?: number;
  notes?: string | null;
  assignedDesigner?: string | null;
  assignedPrinter?: string | null;
  assignedInstaller?: string | null;
  totalPrice: number;
  deposit?: number;
  deliveryDate: string;
  status: OrderStatus;
}

export interface DbPaymentInput {
  amount: number;
  note?: string | null;
}

export interface DbBackupData {
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  settings: Array<{
    key: string;
    value: string;
    updatedAt: string;
  }>;
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    business?: string | null;
    address?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  services: Array<{
    id: string;
    label: string;
    createdAt: string;
    updatedAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: number;
    customerId: string;
    customerNameSnapshot: string;
    customerPhoneSnapshot: string;
    serviceId: string;
    description: string;
    dimensions?: string | null;
    quantity: number;
    notes?: string | null;
    assignedDesigner?: string | null;
    assignedPrinter?: string | null;
    assignedInstaller?: string | null;
    totalPrice: number;
    deposit: number;
    deliveryDate: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    amount: number;
    paidAt: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export function getDatabaseStatus(): Promise<DatabaseStatus> {
  return invoke<DatabaseStatus>('database_status');
}

export function listDbCustomers(): Promise<DbCustomer[]> {
  return invoke<DbCustomer[]>('db_list_customers');
}

export function addDbCustomer(input: DbCustomerInput): Promise<DbCustomer> {
  return invoke<DbCustomer>('db_add_customer', { input });
}

export function updateDbCustomer(id: string, input: DbCustomerInput): Promise<DbCustomer> {
  return invoke<DbCustomer>('db_update_customer', { id, input });
}

export function deleteDbCustomer(id: string): Promise<void> {
  return invoke<void>('db_delete_customer', { id });
}

export function listDbServices(): Promise<DbService[]> {
  return invoke<DbService[]>('db_list_services');
}

export function addDbService(input: DbServiceInput): Promise<DbService> {
  return invoke<DbService>('db_add_service', { input });
}

export function updateDbService(id: string, label: string): Promise<DbService> {
  return invoke<DbService>('db_update_service', { id, label });
}

export function deleteDbService(id: string): Promise<void> {
  return invoke<void>('db_delete_service', { id });
}

export function listDbOrders(): Promise<DbOrder[]> {
  return invoke<DbOrder[]>('db_list_orders');
}

export function getDbOrder(id: string): Promise<DbOrder | null> {
  return invoke<DbOrder | null>('db_get_order', { id });
}

export function addDbOrder(input: DbOrderInput): Promise<DbOrder> {
  return invoke<DbOrder>('db_add_order', { input });
}

export function updateDbOrder(id: string, input: DbOrderInput): Promise<DbOrder> {
  return invoke<DbOrder>('db_update_order', { id, input });
}

export function deleteDbOrder(id: string): Promise<void> {
  return invoke<void>('db_delete_order', { id });
}

export function addDbPayment(orderId: string, input: DbPaymentInput): Promise<DbOrder> {
  return invoke<DbOrder>('db_add_payment', { orderId, input });
}

export function exportDbBackup(): Promise<DbBackupData> {
  return invoke<DbBackupData>('db_export_backup');
}

export function importDbBackup(backup: DbBackupData): Promise<DatabaseStatus> {
  return invoke<DatabaseStatus>('db_import_backup', { backup });
}
