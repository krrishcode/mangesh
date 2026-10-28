import { upload } from "@vercel/blob/client";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAdminAuthStore } from "../../../../stores/adminAuthStore";
import { fetchApi } from "../../../../lib/api";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  extensionForType,
} from "../../../../lib/upload";
import { startAdminRead } from "../../adminRead";
import { AdminError, useAdminData } from "../../useAdminData";
import { AdminPage } from "../ui/AdminPage";
import { FormField } from "../ui/FormField";
import { AdminIcon } from "../ui/AdminIcon";
import type { Product } from "./ProductsView";
export interface ColorVariant {
  id: string;
  color: string;
  colorHex: string;
  sizes: string[];
  inStockSizes: string[];
}
interface Category {
  id: number;
  name: string;
}
const optionalFields = [
  ["styleNumber", "Style number"],
  ["badge", "Product badge"],
  ["fabricContent", "Fabric composition"],
  ["componentsCount", "Number of components"],
  ["setIncludes", "Included items"],
  ["washCare", "Care instructions"],
  ["countryOfOrigin", "Country of origin"],
  ["manufacturerAddress", "Manufacturer address"],
  ["measurements", "Size & measurement notes"],
  ["craft", "Craft details"],
  ["editorialStory", "Product story"],
  ["returnsPolicy", "Returns policy"],
  ["disclaimer", "Additional information"],
] as const;
type OptionalKey = (typeof optionalFields)[number][0];
type Form = {
  title: string;
  description: string;
  sku: string;
  slug: string;
  categoryId: string;
  price: string;
  salePrice: string;
  stock: string;
  isActive: boolean;
  readyToShip: boolean;
  deliveryMethod: string;
  gallery: string[];
  variants: ColorVariant[];
} & Record<OptionalKey, string>;
const blankForm = (): Form => ({
  title: "",
  description: "",
  sku: "",
  slug: "",
  categoryId: "",
  price: "",
  salePrice: "",
  stock: "0",
  isActive: false,
  readyToShip: false,
  deliveryMethod: "both",
  gallery: [],
  variants: [],
  ...(Object.fromEntries(optionalFields.map(([key]) => [key, ""])) as Record<
    OptionalKey,
    string
  >),
});
function list<T>(value: unknown): T[] {
  if (value == null || value === "") return [];
  const result = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(result))
    throw new Error(
      "Some saved product details could not be read. Please contact support before editing.",
    );
  return result;
}
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function ProductFormView({
  productId,
  onNavigate,
  onBusyChange,
}: {
  productId?: number | null;
  onNavigate: (route: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const categories = useAdminData<Category[]>("/admin/categories");
  const [form, setForm] = useState<Form>(blankForm);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    onBusyChange?.(saving || uploading);
  }, [saving, uploading, onBusyChange]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!productId);
  const [imageUrl, setImageUrl] = useState("");
  const [sizeDraft, setSizeDraft] = useState<Record<string, string>>({});
  const slugEdited = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const change = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    setError("");
    slugEdited.current = false;
    setLoaded(!productId);
    if (!productId) {
      setForm(blankForm());
      setLoading(false);
      return;
    }
    setLoading(true);
    return startAdminRead<{ data: Product }>("/admin/products/" + productId, {
      success: ({ data: p }) => {
        if (!p) throw new Error("Product not found.");
        const gallery = [
          ...new Set(
            [p.imageFront, ...list<string>(p.gallery), p.imageDetail].filter(
              Boolean,
            ),
          ),
        ] as string[];
        let variants = list<ColorVariant>(p.colorVariants).map(
          (variant, index) => ({
            ...variant,
            id: variant.id || "existing-" + index,
            color: variant.color || "",
            colorHex: variant.colorHex || "",
            sizes: list<string>(variant.sizes),
            inStockSizes: list<string>(variant.inStockSizes),
          }),
        );
        if (!variants.length && (p.color || list<string>(p.sizes).length > 0))
          variants = [
            {
              id: "legacy",
              color: p.color || "",
              colorHex: p.colorHex || "",
              sizes: list<string>(p.sizes),
              inStockSizes: list<string>(p.inStockSizes),
            },
          ];
        setForm({
          ...blankForm(),
          title: p.title,
          description: p.description || "",
          sku: p.sku,
          slug: p.slug,
          categoryId: p.categoryId == null ? "" : String(p.categoryId),
          price: String(p.price),
          salePrice: p.salePrice == null ? "" : String(p.salePrice),
          stock: String(p.stock),
          isActive: p.isActive,
          readyToShip: Boolean(p.readyToShip),
          deliveryMethod: p.deliveryMethod || "both",
          gallery,
          variants,
          ...Object.fromEntries(
            optionalFields.map(([key]) => [
              key,
              p[key] == null ? "" : String(p[key]),
            ]),
          ),
        } as Form);
        setLoaded(true);
      },
      error: (reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load this product.",
        ),
      settled: () => setLoading(false),
    });
  }, [productId]);
  function updateVariant(id: string, patch: Partial<ColorVariant>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    }));
  }
  function addSize(variant: ColorVariant) {
    const size = (sizeDraft[variant.id] || "").trim();
    if (!size || variant.sizes.includes(size)) return;
    updateVariant(variant.id, { sizes: [...variant.sizes, size] });
    setSizeDraft((current) => ({ ...current, [variant.id]: "" }));
  }
  function addImage() {
    const value = imageUrl.trim();
    try {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      if (!form.gallery.includes(value))
        change("gallery", [...form.gallery, value]);
      setImageUrl("");
      setError("");
    } catch {
      setError("Enter a valid HTTP or HTTPS image URL.");
    }
  }
  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (
      files.length > MAX_UPLOAD_FILES ||
      files.some(
        (file) =>
          !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type) ||
          file.size > MAX_UPLOAD_BYTES,
      )
    ) {
      setError(
        "Choose up to " +
          MAX_UPLOAD_FILES +
          " JPG, PNG or WebP images, no larger than 8 MB each.",
      );
      event.target.value = "";
      return;
    }
    setUploading(true);
    setError("");
    try {
      const token = useAdminAuthStore.getState().token;
      if (!token) throw new Error("Please sign in again.");
      const urls: string[] = [];
      for (const file of files) {
        const blob = await upload(
          "products/" + crypto.randomUUID() + "." + extensionForType(file.type),
          file,
          {
            access: "public",
            handleUploadUrl: "/api/account/media/upload",
            headers: { Authorization: "Bearer " + token },
            contentType: file.type,
          },
        );
        urls.push(blob.url);
      }
      setForm((current) => ({
        ...current,
        gallery: [...current.gallery, ...urls],
      }));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Image upload failed. Try again.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || uploading || !loaded) return;
    setError("");
    const variants = form.variants.map((variant) => ({
      ...variant,
      color: variant.color.trim(),
      inStockSizes: variant.inStockSizes.filter((size) =>
        variant.sizes.includes(size),
      ),
    }));
    if (variants.some((variant) => !variant.color)) {
      setError(
        "Enter a color name for each variant, or remove unused variants.",
      );
      return;
    }
    if (form.salePrice !== "" && Number(form.salePrice) > Number(form.price)) {
      setError("Sale price cannot exceed the base price.");
      return;
    }
    const primary = variants[0];
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      sku: form.sku.trim(),
      slug: form.slug,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      price: form.price,
      salePrice: form.salePrice || null,
      stock: Number(form.stock),
      isActive: form.isActive,
      readyToShip: form.readyToShip,
      deliveryMethod: form.deliveryMethod,
      gallery: form.gallery,
      imageFront: form.gallery[0] || null,
      imageDetail: form.gallery[1] || null,
      colorVariants: variants,
      color: primary?.color || null,
      colorHex: primary?.colorHex || null,
      sizes: [...new Set(variants.flatMap((variant) => variant.sizes))],
      inStockSizes: [
        ...new Set(variants.flatMap((variant) => variant.inStockSizes)),
      ],
      ...Object.fromEntries(
        optionalFields.map(([key]) => [
          key,
          key === "componentsCount"
            ? form[key]
              ? Number(form[key])
              : null
            : form[key] || null,
        ]),
      ),
    };
    setSaving(true);
    try {
      await fetchApi("/admin/products" + (productId ? "/" + productId : ""), {
        method: productId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onNavigate("products");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save}>
      <AdminPage
        title={productId ? "Edit product" : "Add product"}
        description="Product details, images and availability."
        actions={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={saving || uploading}
            onClick={() => onNavigate("products")}
          >
            Back to products
          </button>
        }
      >
        {error && <AdminError message={error} />}
        {categories.error && (
          <AdminError message={categories.error} retry={categories.reload} />
        )}
        {loading ? (
          <p role="status" className="admin-muted">
            Loading product…
          </p>
        ) : (
          loaded && (
            <fieldset
              className="admin-modal-fields"
              disabled={saving || uploading}
            >
              <div className="admin-product-editor">
                <div>
                  <section className="admin-card">
                    <h2>Product details</h2>
                    <FormField label="Product name">
                      <input
                        required
                        maxLength={255}
                        value={form.title}
                        onChange={(event) => {
                          const title = event.target.value;
                          setForm((current) => ({
                            ...current,
                            title,
                            ...(!productId && !slugEdited.current
                              ? { slug: slugify(title) }
                              : {}),
                          }));
                        }}
                      />
                    </FormField>
                    <FormField label="Description">
                      <textarea
                        rows={5}
                        value={form.description}
                        onChange={(event) =>
                          change("description", event.target.value)
                        }
                      />
                    </FormField>
                    <div className="admin-form-grid">
                      <FormField label="SKU">
                        <input
                          required
                          maxLength={100}
                          value={form.sku}
                          onChange={(event) =>
                            change("sku", event.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="Category">
                        <select
                          value={form.categoryId}
                          onChange={(event) =>
                            change("categoryId", event.target.value)
                          }
                        >
                          <option value="">Uncategorised</option>
                          {categories.data?.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                    <FormField label="URL slug">
                      <input
                        required
                        maxLength={255}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        value={form.slug}
                        onChange={(event) => {
                          slugEdited.current = true;
                          change("slug", event.target.value);
                        }}
                      />
                    </FormField>
                  </section>
                  <section className="admin-card">
                    <h2>Product images</h2>
                    <p className="admin-helper">
                      The first image is the cover shown in the store.
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={uploadImages}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <AdminIcon name="plus" />
                      {uploading ? "Uploading…" : "Upload images"}
                    </button>
                    <div className="admin-media-grid">
                      {form.gallery.map((url, index) => (
                        <div className="admin-media-item" key={url}>
                          <img
                            src={url}
                            alt={"Product image " + (index + 1)}
                            width={120}
                            height={160}
                          />
                          <button
                            type="button"
                            aria-pressed={index === 0}
                            onClick={() =>
                              change("gallery", [
                                url,
                                ...form.gallery.filter(
                                  (image) => image !== url,
                                ),
                              ])
                            }
                          >
                            {index === 0 ? "Cover image" : "Use as cover"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              change(
                                "gallery",
                                form.gallery.filter((image) => image !== url),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <details>
                      <summary className="admin-text-link">
                        Add a hosted image
                      </summary>
                      <div className="admin-inline-fields">
                        <FormField label="Image URL">
                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(event) =>
                              setImageUrl(event.target.value)
                            }
                          />
                        </FormField>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={addImage}
                          style={{ marginBottom: 18 }}
                        >
                          Add image
                        </button>
                      </div>
                    </details>
                  </section>
                  <section className="admin-card">
                    <h2>Colors & sizes</h2>
                    <p className="admin-helper">
                      Add the sizes offered in each color. Select the sizes that
                      are currently in stock.
                    </p>
                    {form.variants.map((variant) => (
                      <div key={variant.id} className="admin-variant">
                        <div className="admin-inline-fields">
                          <FormField label="Color name">
                            <input
                              required
                              maxLength={100}
                              value={variant.color}
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  color: event.target.value,
                                })
                              }
                            />
                          </FormField>
                          <FormField label="Swatch">
                            <input
                              type="color"
                              value={
                                /^#[0-9a-f]{6}$/i.test(variant.colorHex)
                                  ? variant.colorHex
                                  : "#ffffff"
                              }
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  colorHex: event.target.value,
                                })
                              }
                            />
                          </FormField>
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            style={{ marginBottom: 18 }}
                            onClick={() =>
                              change(
                                "variants",
                                form.variants.filter(
                                  (row) => row.id !== variant.id,
                                ),
                              )
                            }
                          >
                            Remove color
                          </button>
                        </div>
                        <div className="admin-size-list">
                          {variant.sizes.map((size) => (
                            <div key={size} className="admin-size-item">
                              <label className="admin-checkbox">
                                <input
                                  type="checkbox"
                                  checked={variant.inStockSizes.includes(size)}
                                  onChange={(event) =>
                                    updateVariant(variant.id, {
                                      inStockSizes: event.target.checked
                                        ? [...variant.inStockSizes, size]
                                        : variant.inStockSizes.filter(
                                            (value) => value !== size,
                                          ),
                                    })
                                  }
                                />
                                {size} in stock
                              </label>
                              <button
                                type="button"
                                aria-label={"Remove size " + size}
                                onClick={() =>
                                  updateVariant(variant.id, {
                                    sizes: variant.sizes.filter(
                                      (value) => value !== size,
                                    ),
                                    inStockSizes: variant.inStockSizes.filter(
                                      (value) => value !== size,
                                    ),
                                  })
                                }
                              >
                                <AdminIcon name="close" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="admin-inline-fields">
                          <FormField label="Add a size">
                            <input
                              maxLength={40}
                              value={sizeDraft[variant.id] || ""}
                              onChange={(event) =>
                                setSizeDraft((current) => ({
                                  ...current,
                                  [variant.id]: event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addSize(variant);
                                }
                              }}
                            />
                          </FormField>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ marginBottom: 18 }}
                            onClick={() => addSize(variant)}
                          >
                            Add size
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() =>
                        change("variants", [
                          ...form.variants,
                          {
                            id: crypto.randomUUID(),
                            color: "",
                            colorHex: "",
                            sizes: [],
                            inStockSizes: [],
                          },
                        ])
                      }
                    >
                      <AdminIcon name="plus" />
                      Add color
                    </button>
                  </section>
                  <details className="admin-section-toggle">
                    <summary>Additional product information</summary>
                    <div className="admin-form-grid">
                      {optionalFields.map(([key, label]) => (
                        <FormField key={key} label={label + " (optional)"}>
                          <input
                            type={key === "componentsCount" ? "number" : "text"}
                            min={key === "componentsCount" ? 1 : undefined}
                            step={key === "componentsCount" ? 1 : undefined}
                            value={form[key]}
                            onChange={(event) =>
                              change(key, event.target.value)
                            }
                          />
                        </FormField>
                      ))}
                    </div>
                  </details>
                </div>
                <aside className="admin-editor-aside">
                  <section className="admin-card">
                    <h2>Pricing & inventory</h2>
                    <FormField label="Price (INR)">
                      <input
                        required
                        type="number"
                        min="0.01"
                        max="99999999.99"
                        step="0.01"
                        value={form.price}
                        onChange={(event) =>
                          change("price", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Sale price (optional)">
                      <input
                        type="number"
                        min="0.01"
                        max={form.price || "99999999.99"}
                        step="0.01"
                        value={form.salePrice}
                        onChange={(event) =>
                          change("salePrice", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Stock quantity">
                      <input
                        required
                        type="number"
                        min="0"
                        max="2147483647"
                        step="1"
                        value={form.stock}
                        onChange={(event) =>
                          change("stock", event.target.value)
                        }
                      />
                    </FormField>
                  </section>
                  <section className="admin-card">
                    <h2>Availability</h2>
                    <FormField label="Delivery method">
                      <select
                        value={form.deliveryMethod}
                        onChange={(event) =>
                          change("deliveryMethod", event.target.value)
                        }
                      >
                        <option value="both">Delivery & store pickup</option>
                        <option value="home">Home delivery only</option>
                        <option value="pickup">Store pickup only</option>
                      </select>
                    </FormField>
                    <label className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          change("isActive", event.target.checked)
                        }
                      />
                      Active in the store
                    </label>
                    <label className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={form.readyToShip}
                        onChange={(event) =>
                          change("readyToShip", event.target.checked)
                        }
                      />
                      Ready to ship
                    </label>
                    <button
                      type="submit"
                      className="admin-btn admin-btn-primary"
                      disabled={saving || uploading}
                      style={{ width: "100%", marginTop: 20 }}
                    >
                      {saving
                        ? "Saving…"
                        : productId
                          ? "Save changes"
                          : "Create product"}
                    </button>
                  </section>
                </aside>
              </div>
            </fieldset>
          )
        )}
      </AdminPage>
    </form>
  );
}
