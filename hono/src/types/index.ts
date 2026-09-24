/**
 * Shared API Transfer Contracts, DTOs, and Client-facing View Models.
 */

// User DTOs (Public / Transfer safe)
export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  created_at?: string;
}

export interface AuthSessionDto {
  user: UserDto;
  token: string;
}

// Product DTOs & View Models
export interface ProductDto {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  price: string | number;
  sale_price?: string | number | null;
  stock: number;
  sku: string;
  category_id?: number | null;
  images?: string[];
  is_active: boolean;
  created_at?: string;
}

export interface ProductListItemDto {
  id: number;
  title: string;
  slug: string;
  price: string | number;
  sale_price?: string | number | null;
  image?: string;
  in_stock: boolean;
}

// Category & Navigation DTOs
export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

// Cart & Checkout DTOs
export interface CartItemDto {
  product_id: number;
  quantity: number;
  price: number;
  title: string;
  image_url?: string;
}

export interface CartSummaryDto {
  items: CartItemDto[];
  total_items: number;
  subtotal: number;
  shipping_estimate?: number;
  total: number;
}

// Order DTOs
export interface OrderSummaryDto {
  id: number;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items_count: number;
  created_at: string;
}

// Unified API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
