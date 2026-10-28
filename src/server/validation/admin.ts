import { z } from "zod";

export const adminCreateAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  location: z.string().trim().min(2).max(255),
  occasion: z.string().trim().min(2).max(255),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      "Choose a future date and time",
    ),
  notes: z.string().max(4000).optional().nullable(),
});

export const adminRescheduleAppointmentSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      "Choose a future date and time",
    ),
});

const money = z
  .union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)])
  .refine(
    (value) =>
      Number.isFinite(Number(value)) &&
      Number(value) > 0 &&
      Number(value) <= 99999999.99 &&
      Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.00001,
    "Enter a positive price with no more than two decimal places.",
  );
const slug = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens for the URL slug.",
  );
const text = z.string().max(60000).nullable().optional();
const image = z
  .string()
  .max(4000)
  .refine(
    (value) => /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value),
    "Use an HTTP, HTTPS or local image URL.",
  );
const sizes = z
  .array(z.string().trim().min(1).max(40))
  .max(100)
  .refine(
    (value) => new Set(value).size === value.length,
    "Size names must be unique.",
  );
function jsonArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, schema.nullable().optional());
}
const variant = z
  .object({
    id: z.string().max(150).optional(),
    color: z.string().trim().min(1).max(100),
    colorHex: z.string().max(50).optional(),
    sizes,
    inStockSizes: sizes,
  })
  .passthrough()
  .refine(
    (value) => value.inStockSizes.every((size) => value.sizes.includes(size)),
    "In-stock sizes must be offered by this color.",
  );
const productFields = z.object({
  title: z.string().trim().min(1).max(255),
  slug,
  sku: z.string().trim().min(1).max(100),
  price: money,
  salePrice: money.nullable().optional(),
  stock: z.number().int().min(0).max(2147483647).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  readyToShip: z.boolean().optional(),
  deliveryMethod: z.enum(["both", "home", "pickup"]).optional(),
  description: text,
  imageFront: image.nullable().optional(),
  imageDetail: image.nullable().optional(),
  color: z.string().max(100).nullable().optional(),
  colorHex: z.string().max(50).nullable().optional(),
  badge: z.string().max(100).nullable().optional(),
  styleNumber: z.string().max(100).nullable().optional(),
  washCare: z.string().max(255).nullable().optional(),
  countryOfOrigin: z.string().max(100).nullable().optional(),
  componentsCount: z.number().int().positive().max(10000).nullable().optional(),
  fabricContent: text,
  setIncludes: text,
  measurements: text,
  manufacturerAddress: text,
  craft: text,
  editorialStory: text,
  returnsPolicy: text,
  disclaimer: text,
  gallery: jsonArray(z.array(image).max(100)),
  sizes: jsonArray(sizes),
  inStockSizes: jsonArray(sizes),
  colorVariants: jsonArray(z.array(variant).max(50)),
});
export const adminCreateProductSchema = productFields.refine(
  (value) =>
    value.salePrice == null || Number(value.salePrice) <= Number(value.price),
  { message: "Sale price cannot exceed the base price.", path: ["salePrice"] },
);
export const adminUpdateProductSchema = productFields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Choose product details to update.",
  );
export const adminCategorySchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug,
  description: text,
});
export const adminCategoryUpdateSchema = adminCategorySchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Choose category details to update.",
  );
export function adminValidationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  return (issue.path.length ? issue.path.join(".") + ": " : "") + issue.message;
}
