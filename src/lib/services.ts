import { ServiceType } from './types';

const SERVICES_KEY = 'printshop_services';

export interface CustomService {
  id: string;
  label: string;
}

const DEFAULT_SERVICES: CustomService[] = [
  { id: 'printing', label: 'طباعة' },
  { id: 'tshirts', label: 'تيشيرتات' },
  { id: 'banners', label: 'بنرات' },
  { id: 'cups', label: 'أكواب' },
  { id: 'stickers', label: 'ستيكرات' },
  { id: 'cards', label: 'كروت' },
  { id: 'other', label: 'أخرى' },
];

export function getServices(): CustomService[] {
  const data = localStorage.getItem(SERVICES_KEY);
  if (!data) return DEFAULT_SERVICES;
  return JSON.parse(data);
}

export function saveServices(services: CustomService[]) {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

export function getServiceLabel(id: string): string {
  const services = getServices();
  return services.find(s => s.id === id)?.label || id;
}
