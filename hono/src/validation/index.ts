import { z } from 'zod';
export const phoneSchema = z.string().trim().min(6).max(32).refine(value => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15, 'Enter a valid phone number, including the country code when needed.');

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(2).max(255),
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
  name: z.string().trim().min(2).max(255).optional(),
  phone: phoneSchema.nullable().optional(),
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
  fullName: z.string().trim().min(2).max(255),
  phone: phoneSchema,
  line1: z.string().trim().min(4).max(255),
  line2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(2).max(128),
  state: z.string().trim().min(2).max(128),
  postalCode: z.string().trim().min(4).max(255).max(16),
  country: z.string().trim().min(2).max(128).default('India'),
});

export const updateAddressSchema = createAddressSchema.partial();

export const createAppointmentSchema = z.object({
  location: z.string().trim().min(2).max(255),
  occasion: z.string().trim().min(2).max(255),
  scheduledAt: z.string().datetime({ offset: true }).refine(value => new Date(value).getTime() > Date.now(), 'Choose a future date and time'),
  notes: z.string().max(4000).optional().nullable(),
});

export const addToWishlistSchema = z.object({
  productId: z.number().int().positive(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateAppointmentSchema = z.object({
  location: z.string().trim().min(2).max(255).optional(),
  occasion: z.string().trim().min(2).max(255).optional(),
  scheduledAt: z.string().datetime({ offset: true }).refine(value => new Date(value).getTime() > Date.now(), 'Choose a future date and time').optional(),
  notes: z.string().max(4000).optional().nullable(),
});
