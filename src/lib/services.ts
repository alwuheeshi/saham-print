import {
  addDbService,
  deleteDbService,
  listDbServices,
  updateDbService,
  type DbService,
} from './database';

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

let serviceCache: CustomService[] = DEFAULT_SERVICES;

function toService(service: DbService): CustomService {
  return {
    id: service.id,
    label: service.label,
  };
}

export async function getServices(): Promise<CustomService[]> {
  serviceCache = (await listDbServices()).map(toService);
  return serviceCache;
}

export async function addService(label: string): Promise<CustomService> {
  const service = toService(await addDbService({ label }));
  serviceCache = [...serviceCache, service];
  return service;
}

export async function renameService(id: string, label: string): Promise<CustomService> {
  const service = toService(await updateDbService(id, label));
  serviceCache = serviceCache.map(item => item.id === id ? service : item);
  return service;
}

export async function removeService(id: string): Promise<void> {
  await deleteDbService(id);
  serviceCache = serviceCache.filter(item => item.id !== id);
}

export function getServiceLabel(id: string): string {
  return serviceCache.find(s => s.id === id)?.label || id;
}
