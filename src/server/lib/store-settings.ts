import { z } from 'zod';
import { db } from '../db';
import { adminSettings } from '../db/schema';
import { AppError } from './errors';
import { SUPPORT_EMAIL, SUPPORT_PHONE_E164 } from '../../lib/contact';

const amount = z.string().refine(value => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 99999999), 'Enter a non-negative amount with up to two decimal places.');
export const settingValidators = {
  store_name: z.string().trim().max(120),
  brand_tagline: z.string().trim().max(180),
  support_email: z.union([z.literal(''), z.string().trim().email().max(255)]),
  support_phone: z.string().trim().max(32),
  shipping_flat_rate: amount,
  free_shipping_threshold: amount,
  low_stock_threshold: z.string().regex(/^\d+$/).refine(value => Number(value) <= 100000),
} as const;
export type StoreSettingKey = keyof typeof settingValidators;
export type StoreSettings = Record<StoreSettingKey, string>;
export type StorePolicy = { shippingFee: number; freeShippingThreshold: number | null; lowStockThreshold: number; currency: 'INR'; codEnabled: boolean };

export function resolveStoreSettings(rows: { settingKey: string; value: string | null }[]) {
  const values = Object.fromEntries(rows.map(row => [row.settingKey, row.value]));
  const settings: StoreSettings = {
    store_name: values.store_name ?? process.env.STORE_NAME ?? '',
    brand_tagline: values.brand_tagline ?? process.env.STORE_TAGLINE ?? '',
    support_email: values.support_email || process.env.SUPPORT_EMAIL || SUPPORT_EMAIL,
    support_phone: values.support_phone ?? process.env.SUPPORT_PHONE ?? SUPPORT_PHONE_E164,
    shipping_flat_rate: values.shipping_flat_rate ?? process.env.SHIPPING_FEE_INR ?? '0',
    free_shipping_threshold: values.free_shipping_threshold ?? process.env.FREE_SHIPPING_THRESHOLD_INR ?? '',
    low_stock_threshold: values.low_stock_threshold ?? process.env.LOW_STOCK_THRESHOLD ?? '5',
  };
  for (const key of ['shipping_flat_rate', 'free_shipping_threshold', 'low_stock_threshold'] as const) {
    if (!settingValidators[key].safeParse(settings[key]).success) throw new AppError(503, 'Store pricing or inventory settings are invalid. Update Store Settings.');
  }
  const policy: StorePolicy = {
    shippingFee: Number(settings.shipping_flat_rate),
    freeShippingThreshold: settings.free_shipping_threshold === '' ? null : Number(settings.free_shipping_threshold),
    lowStockThreshold: Number(settings.low_stock_threshold), currency: 'INR', codEnabled: process.env.COD_ENABLED !== 'false',
  };
  return { settings, policy };
}

export async function getStoreSettings() {
  return resolveStoreSettings(await db.select().from(adminSettings));
}
