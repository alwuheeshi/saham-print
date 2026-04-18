import {
  addDbCustomer,
  deleteDbCustomer,
  listDbCustomers,
  updateDbCustomer,
  type DbCustomer,
} from './database';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  business?: string;
  address?: string;
  notes?: string;
}

function toCustomer(customer: DbCustomer): Customer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    business: customer.business || undefined,
    address: customer.address || undefined,
    notes: customer.notes || undefined,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  return (await listDbCustomers()).map(toCustomer);
}

export async function addCustomer(name: string, phone: string, business?: string, address?: string, notes?: string): Promise<Customer> {
  return toCustomer(await addDbCustomer({ name, phone, business, address, notes }));
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  const customers = await getCustomers();
  const existing = customers.find(c => c.id === id);
  if (!existing) return null;

  return toCustomer(await updateDbCustomer(id, {
    ...existing,
    ...updates,
  }));
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDbCustomer(id);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return (await getCustomers()).find(c => c.id === id);
}
