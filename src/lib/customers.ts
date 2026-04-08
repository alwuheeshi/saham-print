export interface Customer {
  id: string;
  name: string;
  phone: string;
}

const STORAGE_KEY = 'printshop_customers';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getCustomers(): Customer[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

export function addCustomer(name: string, phone: string): Customer {
  const customers = getCustomers();
  const customer: Customer = { id: generateId(), name, phone };
  customers.unshift(customer);
  saveCustomers(customers);
  return customer;
}

export function deleteCustomer(id: string) {
  saveCustomers(getCustomers().filter(c => c.id !== id));
}

export function ensureCustomerExists(name: string, phone: string) {
  const customers = getCustomers();
  const exists = customers.find(c => c.name === name && c.phone === phone);
  if (!exists) {
    addCustomer(name, phone);
  }
}
