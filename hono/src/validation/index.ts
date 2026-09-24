import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().max(32).nullable().optional(),
});

export const updateMeasurementsSchema = z.object({
  chest: z.number().positive().max(200).nullable().optional(),
  waist: z.number().positive().max(200).nullable().optional(),
  hip: z.number().positive().max(200).nullable().optional(),
  shoulder: z.number().positive().max(200).nullable().optional(),
  sleeveLength: z.number().positive().max(200).nullable().optional(),
  inseam: z.number().positive().max(200).nullable().optional(),
  unit: z.enum(['inches', 'cm']).optional(),
});

export const createAddressSchema = z.object({
  label: z.enum(['shipping', 'billing']).default('shipping'),
  isDefault: z.boolean().default(false),
  fullName: z.string().min(2),
  phone: z.string().min(6).max(32),
  line1: z.string().min(4),
  line2: z.string().optional().nullable(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4).max(16),
  country: z.string().default('India'),
});

export const updateAddressSchema = createAddressSchema.partial();

export const createAppointmentSchema = z.object({
  location: z.string().min(2),
  occasion: z.string().min(2),
  scheduledAt: z.string().datetime().or(z.string().min(10)),
  notes: z.string().optional().nullable(),
});

export const addToWishlistSchema = z.object({
  productId: z.number().int().positive(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateAppointmentSchema = z.object({
  location: z.string().min(2).optional(),
  occasion: z.string().min(2).optional(),
  scheduledAt: z.string().datetime().or(z.string().min(10)).optional(),
  notes: z.string().optional().nullable(),
});
