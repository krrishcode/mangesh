import type { OrderSummaryDto } from '../../types';

export interface AccountOrder extends OrderSummaryDto {
  guest?: boolean;
  items: Array<{ id: number; product_id: number | null; title: string; quantity: number; price: number; size?: string | null; color?: string | null; image_url?: string | null }>;
  payment_method?: string | null;
  payment_status?: string | null;
  fulfilment?: string | null;
  subtotal?: number | null;
  shipping_amount?: number | null;
  shipping_address?: Omit<Address, 'id'> | null;
  shipments?: Array<{ carrier?: string | null; tracking_number?: string | null; status: string; updated_at: string }>;
}
export interface Appointment {
  id: number;
  location: string;
  occasion: string;
  scheduled_at: string;
  status: string;
  notes?: string | null;
}
export interface Address {
  id: number;
  label: 'shipping' | 'billing';
  isDefault: boolean;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
export interface WishlistItem {
  id: number;
  product_id: number;
  title: string;
  price: number | null;
  sale_price: number | null;
  image_url?: string | null;
  in_stock: boolean;
  available?: boolean;
}
export const money = (value: number) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const dateLabel = (value: string, time = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
    ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
};
