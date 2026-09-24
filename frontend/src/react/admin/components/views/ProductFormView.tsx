import React, { useEffect, useState, useRef } from 'react';
import { fetchApi } from '../../../../lib/api';
import { FormField } from '../ui/FormField';

export interface ColorVariant {
  id: string;
  color: string;
  colorHex: string;
  sizes: string[];
  inStockSizes: string[];
}

interface CategoryOption {
  id: number;
  name: string;
}

interface ProductFormViewProps {
  productId?: number | null;
  onNavigate: (route: string) => void;
}

const BADGE_OPTIONS = [
  { value: '', label: 'None (Standard)' },
  { value: 'EXCLUSIVE', label: 'EXCLUSIVE (Flagship Heirloom)' },
  { value: 'FW26 RUNWAY', label: 'FW26 RUNWAY (Couture Fashion Week)' },
  { value: 'NEW ARRIVAL', label: 'NEW ARRIVAL (Fresh Release)' },
  { value: 'BESTSELLER', label: 'BESTSELLER (Sovereign Choice)' },
  { value: 'LIMITED EDITION', label: 'LIMITED EDITION (Artisanal Craft)' },
  { value: 'HERITAGE ATELIER', label: 'HERITAGE ATELIER (Handmade Heirlooms)' },
];

const STANDARD_SIZES = ['38', '40', '42', '44', '46', '48', '50'];

// Comprehensive Couture & Fashion Color Mapping
const COUTURE_COLOR_MAP: Record<string, string> = {
  beige: '#D6C7B2',
  black: '#1C1917',
  'midnight black': '#1C1917',
  white: '#FFFFFF',
  'off white': '#FAF9F6',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  blue: '#2563EB',
  'royal blue': '#1D4ED8',
  'navy blue': '#000080',
  navy: '#000080',
  'sky blue': '#0EA5E9',
  'mist blue': '#93C5FD',
  'baby blue': '#BAE6FD',
  red: '#DC2626',
  crimson: '#991B1B',
  maroon: '#4A0E17',
  wine: '#5C1D2E',
  burgundy: '#800020',
  ruby: '#9B111E',
  green: '#16A34A',
  'emerald green': '#059669',
  emerald: '#059669',
  sage: '#9EAB94',
  'deep green': '#14532D',
  'forest green': '#166534',
  olive: '#808000',
  mint: '#A7F3D0',
  yellow: '#EAB308',
  mustard: '#CA8A04',
  gold: '#D4AF37',
  golden: '#D4AF37',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  copper: '#B87333',
  pink: '#EC4899',
  'rose pink': '#F43F5E',
  'dusty rose': '#DCAE96',
  'rose gold': '#B76E79',
  magenta: '#D946EF',
  fuchsia: '#C026D3',
  purple: '#9333EA',
  lavender: '#E9D5FF',
  violet: '#7C3AED',
  indigo: '#4338CA',
  orange: '#F97316',
  rust: '#B45309',
  peach: '#FFDAB9',
  coral: '#F87171',
  terracotta: '#E2725B',
  brown: '#78350F',
  tan: '#D2B48C',
  khaki: '#C3B091',
  charcoal: '#334155',
  grey: '#6B7280',
  gray: '#6B7280',
  turquoise: '#06B6D4',
  teal: '#0D9488',
  cyan: '#06B6D4',
  aqua: '#00FFFF',
};

// Automatic color resolver: detects typed names like 'blue', 'red', 'royal blue', etc.
function resolveColorNameToHex(name: string): string {
  const clean = name.trim().toLowerCase();
  if (!clean) return '#CCCCCC';

  // 1. Exact match in couture map
  if (COUTURE_COLOR_MAP[clean]) {
    return COUTURE_COLOR_MAP[clean];
  }

  // 2. Keyword substring search (e.g. 'dark blue' -> 'blue', 'light green' -> 'green')
  for (const [key, hex] of Object.entries(COUTURE_COLOR_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return hex;
    }
  }

  // 3. Hex code fallback if user typed #...
  if (/^#([0-9A-F]{3}){1,2}$/i.test(clean)) {
    return clean;
  }

  // 4. Return clean string as valid standard CSS color (e.g. 'salmon', 'chocolate', 'plum')
  return clean;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateSku(title: string, categoryName: string = ''): string {
  const catPrefix = categoryName
    ? categoryName.slice(0, 3).toUpperCase()
    : 'SHR';
  const titleInitials = title
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 3)
    .join('') || 'MM';
  const num = Math.floor(100 + Math.random() * 899);
  return `MM-${catPrefix}-${titleInitials}${num}`;
}

function generateStyleCode(title: string): string {
  const letters = title
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'MP';
  const num = Math.floor(1 + Math.random() * 9);
  return `F26${letters}${num}`;
}

const INITIAL_GALLERY = [
  'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
  'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
];

const BLANK_COLOR_VARIANTS: ColorVariant[] = [
  {
    id: 'var-1',
    color: '',
    colorHex: '#CCCCCC',
    sizes: ['38', '40', '42', '44', '46', '48'],
    inStockSizes: ['38', '40', '42', '44'],
  },
];

const BLANK_FORM = {
  title: '',
  categoryId: '' as string | number,
  badge: '',
  slug: '',
  sku: '',
  styleNumber: '',
  price: '',
  salePrice: '',
  stock: '1',
  description: '',
  readyToShip: true,
  isActive: true,
  deliveryMethod: 'both' as 'both' | 'home' | 'pickup',
  gallery: [] as string[],
  primaryImage: '',
  colorVariants: BLANK_COLOR_VARIANTS,
  measurements: '',
  fabricContent: '',
  componentsCount: '1',
  setIncludes: '',
  washCare: '',
  countryOfOrigin: 'India',
  manufacturerAddress: 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
};

export const ProductFormView: React.FC<ProductFormViewProps> = ({ productId, onNavigate }) => {
  const isEditing = Boolean(productId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeColorTab, setActiveColorTab] = useState<string>('var-1');

  const [form, setForm] = useState(BLANK_FORM);

  // Fetch initial data
  useEffect(() => {
    fetchApi<{ data: CategoryOption[] }>('/admin/categories')
      .then(res => {
        const cats = res.data || [];
        setCategories(cats);
        if (!productId && cats.length > 0) {
          setForm(f => ({ ...f, categoryId: cats[0].id }));
        }
      })
      .catch(() => setCategories([]));

    if (!productId) {
      setForm(BLANK_FORM);
      setActiveColorTab('var-1');
      setLoading(false);
    } else {
      setLoading(true);
      fetchApi<{ data: any }>(`/products/${productId}`)
        .then(res => {
          const p = res.data;
          if (p) {
            // Parse gallery
            let parsedGallery: string[] = [];
            if (p.gallery) {
              try {
                parsedGallery = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery;
              } catch {}
            }
            if (!Array.isArray(parsedGallery) || parsedGallery.length === 0) {
              parsedGallery = [p.imageFront, p.imageDetail].filter(Boolean) as string[];
              if (parsedGallery.length === 0) parsedGallery = [...INITIAL_GALLERY];
            }

            const primaryImg = p.imageFront || parsedGallery[0] || '';

            // Parse color variants
            let parsedVariants: ColorVariant[] = [];
            if (p.colorVariants) {
              try {
                const arr = typeof p.colorVariants === 'string' ? JSON.parse(p.colorVariants) : p.colorVariants;
                if (Array.isArray(arr) && arr.length > 0) {
                  parsedVariants = arr.map((v: any) => ({
                    id: v.id || `var-${Math.random()}`,
                    color: v.color || 'Beige',
                    colorHex: v.colorHex || resolveColorNameToHex(v.color || 'Beige'),
                    sizes: Array.isArray(v.sizes) ? v.sizes : ['38', '40', '42', '44', '46', '48'],
                    inStockSizes: Array.isArray(v.inStockSizes) ? v.inStockSizes : ['38', '40', '42', '44', '46'],
                  }));
                }
              } catch {}
            }

            if (parsedVariants.length === 0) {
              let legacySizes = ['38', '40', '42', '44', '46', '48'];
              let legacyInStock = ['38', '40', '42', '44', '46'];
              try {
                if (p.sizes) legacySizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
                if (p.inStockSizes) legacyInStock = typeof p.inStockSizes === 'string' ? JSON.parse(p.inStockSizes) : p.inStockSizes;
              } catch {}

              const colorName = p.color || 'Beige';
              parsedVariants = [
                {
                  id: 'var-1',
                  color: colorName,
                  colorHex: p.colorHex || resolveColorNameToHex(colorName),
                  sizes: legacySizes,
                  inStockSizes: legacyInStock,
                },
              ];
            }

            setActiveColorTab(parsedVariants[0]?.id || 'var-1');

            setForm({
              title: p.title || '',
              categoryId: p.categoryId ?? '',
              badge: p.badge || '',
              slug: p.slug || '',
              sku: p.sku || '',
              styleNumber: p.styleNumber || 'F26MP8',
              price: p.price ? String(p.price) : '',
              salePrice: p.salePrice ? String(p.salePrice) : '',
              stock: p.stock !== undefined ? String(p.stock) : '10',
              description: p.description || '',
              readyToShip: p.readyToShip !== undefined ? Boolean(p.readyToShip) : true,
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
              deliveryMethod: p.deliveryMethod || 'both',
              gallery: parsedGallery,
              primaryImage: primaryImg,
              colorVariants: parsedVariants,
              measurements: p.measurements || `Sherwani Length - 110 cm (43.3 In)\nChuridar Fabric - 250 cm (2.5 Mtrs)\nDraped Stole - 250 cm (2.5 Mtrs)`,
              fabricContent: p.fabricContent || '100% Silk + Lining : 100% Viscose',
              componentsCount: String(p.componentsCount || 3),
              setIncludes: p.setIncludes || 'Hand-embroidered Sherwani, Churidar Fabric & Handcrafted Silk Stole',
              washCare: p.washCare || 'Dry Clean / Spot Clean',
              countryOfOrigin: p.countryOfOrigin || 'India',
              manufacturerAddress: p.manufacturerAddress || 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
            });
          }
        })
        .catch(err => {
          alert(`Failed to load product: ${err.message}`);
          onNavigate('products');
        })
        .finally(() => setLoading(false));
    }
  }, [productId]);

  // Handle title input change with clean auto generation
  const handleTitleChange = (val: string) => {
    const catName = categories.find(c => String(c.id) === String(form.categoryId))?.name || '';
    setForm(f => ({
      ...f,
      title: val,
      slug: isEditing ? f.slug : generateSlug(val),
      sku: isEditing ? f.sku : (f.sku ? f.sku : generateSku(val, catName)),
      styleNumber: isEditing ? f.styleNumber : (f.styleNumber ? f.styleNumber : generateStyleCode(val)),
    }));
  };

  const regenerateCodes = () => {
    const catName = categories.find(c => String(c.id) === String(form.categoryId))?.name || '';
    setForm(f => ({
      ...f,
      slug: generateSlug(f.title || 'product'),
      sku: generateSku(f.title || 'Product', catName),
      styleNumber: generateStyleCode(f.title || 'Product'),
    }));
  };

  // ─── Media Gallery Handlers ───────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('http://localhost:4000/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        setForm(f => {
          const nextGallery = [...f.gallery, ...data.urls];
          return {
            ...f,
            gallery: nextGallery,
            primaryImage: f.primaryImage || data.urls[0],
          };
        });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(`Image upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      alert('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }

    setForm(f => ({
      ...f,
      gallery: [...f.gallery, trimmed],
      primaryImage: f.primaryImage || trimmed,
    }));
    setUrlInput('');
  };

  const handleSetPrimaryImage = (url: string) => {
    setForm(f => ({
      ...f,
      primaryImage: url,
    }));
  };

  const handleRemoveGalleryImage = (url: string) => {
    setForm(f => {
      const nextGallery = f.gallery.filter(item => item !== url);
      const nextPrimary = f.primaryImage === url ? (nextGallery[0] || '') : f.primaryImage;
      return {
        ...f,
        gallery: nextGallery,
        primaryImage: nextPrimary,
      };
    });
  };

  // ─── Colorways Management with Automatic Color Detection ─────────────
  const addColorVariant = () => {
    const newId = `var-${Date.now()}`;
    const newVariant: ColorVariant = {
      id: newId,
      color: 'Blue',
      colorHex: resolveColorNameToHex('Blue'),
      sizes: ['40', '42', '44'],
      inStockSizes: ['40', '44'],
    };
    setForm(f => ({ ...f, colorVariants: [...f.colorVariants, newVariant] }));
    setActiveColorTab(newId);
  };

  const removeColorVariant = (id: string) => {
    if (form.colorVariants.length <= 1) {
      alert('A product must maintain at least one colorway.');
      return;
    }
    const remaining = form.colorVariants.filter(v => v.id !== id);
    setForm(f => ({ ...f, colorVariants: remaining }));
    if (activeColorTab === id) {
      setActiveColorTab(remaining[0].id);
    }
  };

  // When user types 'blue', 'red', 'black', etc., automatically updates the colorHex in real time!
  const handleColorNameChange = (variantId: string, newColorName: string) => {
    const detectedHex = resolveColorNameToHex(newColorName);
    setForm(f => ({
      ...f,
      colorVariants: f.colorVariants.map(v =>
        v.id === variantId
          ? { ...v, color: newColorName, colorHex: detectedHex }
          : v
      ),
    }));
  };

  // Fast Size Toggle: Inactive -> In Stock -> Sold Out -> Inactive
  const cycleSizeStatus = (variantId: string, size: string) => {
    setForm(f => ({
      ...f,
      colorVariants: f.colorVariants.map(v => {
        if (v.id !== variantId) return v;
        const isOffered = v.sizes.includes(size);
        const isInStock = v.inStockSizes.includes(size);

        if (!isOffered) {
          // Inactive -> In Stock
          return {
            ...v,
            sizes: [...v.sizes, size].sort(),
            inStockSizes: [...v.inStockSizes, size].sort(),
          };
        } else if (isInStock) {
          // In Stock -> Sold Out
          return {
            ...v,
            inStockSizes: v.inStockSizes.filter(s => s !== size),
          };
        } else {
          // Sold Out -> Inactive
          return {
            ...v,
            sizes: v.sizes.filter(s => s !== size),
            inStockSizes: v.inStockSizes.filter(s => s !== size),
          };
        }
      }),
    }));
  };

  const activeVariant = form.colorVariants.find(v => v.id === activeColorTab) || form.colorVariants[0];

  // ─── Save & Publish ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title || !form.slug || !form.price || !form.sku) {
      alert('Title, URL slug, base price, and SKU code are required.');
      return;
    }

    setSaving(true);
    const primaryVariant = form.colorVariants[0] || {
      color: 'Beige',
      colorHex: '#D6C7B2',
      sizes: ['38', '40', '42', '44', '46'],
      inStockSizes: ['38', '40', '42', '44'],
    };

    const allSizesSet = new Set<string>();
    const allInStockSet = new Set<string>();
    form.colorVariants.forEach(v => {
      v.sizes.forEach(s => allSizesSet.add(s));
      v.inStockSizes.forEach(s => allInStockSet.add(s));
    });

    const finalImageFront = form.primaryImage || form.gallery[0] || null;
    const finalImageDetail = form.gallery.find(img => img !== finalImageFront) || form.gallery[1] || null;

    const payload = {
      title: form.title,
      slug: form.slug,
      sku: form.sku,
      styleNumber: form.styleNumber || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      price: form.price,
      salePrice: form.salePrice || null,
      stock: Number(form.stock || 0),
      badge: form.badge || null,
      isActive: form.isActive,
      readyToShip: form.readyToShip,
      deliveryMethod: form.deliveryMethod,
      description: form.description || null,
      color: primaryVariant.color,
      colorHex: primaryVariant.colorHex,
      imageFront: finalImageFront,
      imageDetail: finalImageDetail,
      gallery: form.gallery,
      colorVariants: form.colorVariants,
      sizes: Array.from(allSizesSet),
      inStockSizes: Array.from(allInStockSet),
      measurements: form.measurements || null,
      fabricContent: form.fabricContent || null,
      componentsCount: Number(form.componentsCount || 3),
      setIncludes: form.setIncludes || null,
      washCare: form.washCare || null,
      countryOfOrigin: form.countryOfOrigin || 'India',
      manufacturerAddress: form.manufacturerAddress || 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
      returnsPolicy: 'This item is not eligible for return or exchange. Custom tailored couture fittings available.',
      disclaimer: 'The colour of the product may vary slightly from how it appears here due to photographic lighting filters and screen calibrations.',
    };

    try {
      if (isEditing) {
        await fetchApi(`/admin/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      onNavigate('products');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
        Loading garment specifications...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 80 }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid var(--admin-border)',
      }}>
        <div>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--admin-accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              marginBottom: 4,
            }}
          >
            ← Back to Products Catalogue
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>
              {isEditing ? `Edit Garment #${productId}` : 'Create Couture Garment'}
            </h1>
            {form.badge && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '3px 8px',
                borderRadius: 4,
                background: '#FDF2F4',
                color: 'var(--admin-accent)',
                border: '1px solid #F3CFD5',
              }}>
                {form.badge}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => onNavigate('products')}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 130 }}
          >
            {saving ? 'Publishing...' : (isEditing ? 'Save Changes' : 'Publish Product')}
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Main Form Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Section 1: Title, Category & Sleek Auto-Codes */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1.2fr', gap: 14 }}>
              <FormField label="Garment Title *">
                <input
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. Kindred Embroidered Zardozi Silk Sherwani"
                  style={{ fontWeight: 600, fontSize: 14 }}
                />
              </FormField>

              <FormField label="Category">
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Editorial Badge">
                <select
                  value={form.badge}
                  onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                >
                  {BADGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* SLEEK, COMPACT IDENTIFIER CHIP BAR */}
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: '#FAF9F8',
              borderRadius: 6,
              border: '1px solid #EFECE8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: 'var(--admin-text-muted)' }}>
                <span>
                  <strong style={{ color: '#44403C' }}>Slug:</strong>{' '}
                  <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 3, border: '1px solid #E7E5E4' }}>
                    /{form.slug || 'slug'}
                  </code>
                </span>
                <span>
                  <strong style={{ color: '#44403C' }}>SKU:</strong>{' '}
                  <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 3, border: '1px solid #E7E5E4', fontWeight: 600 }}>
                    {form.sku || 'SKU'}
                  </code>
                </span>
                <span>
                  <strong style={{ color: '#44403C' }}>Style:</strong>{' '}
                  <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 3, border: '1px solid #E7E5E4', fontWeight: 600 }}>
                    {form.styleNumber || 'STYLE'}
                  </code>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={regenerateCodes}
                  title="Auto-regenerate slug, SKU, and style number based on product title"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ↻ Regenerate
                </button>
                <span style={{ color: '#D6D3D1' }}>|</span>
                <button
                  type="button"
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {showCodeEditor ? 'Hide Code Fields' : 'Edit Codes'}
                </button>
              </div>
            </div>

            {/* Optional Collapsible Manual Code Editor */}
            {showCodeEditor && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr',
                gap: 12,
                marginTop: 10,
                padding: 12,
                background: '#FFFFFF',
                borderRadius: 6,
                border: '1px dashed #D6D3D1',
              }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 2 }}>Custom URL Slug</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    style={{ fontSize: 12, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 2 }}>Custom SKU</label>
                  <input
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 2 }}>Style Number</label>
                  <input
                    value={form.styleNumber}
                    onChange={e => setForm(f => ({ ...f, styleNumber: e.target.value }))}
                    style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}
                  />
                </div>
              </div>
            )}

            {/* Storefront Description */}
            <div style={{ marginTop: 14 }}>
              <FormField label="Storefront Editorial Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the craft, silhouette, embroidery heritage, and royal styling of this garment..."
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: PRODUCT MEDIA GALLERY & PRIMARY IMAGE SELECTION */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
                  Product Media Gallery
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  Upload multiple high-res product photos. The <strong>★ Primary Cover</strong> will be the flagship storefront hero image.
                </p>
              </div>

              <span style={{
                fontSize: 11,
                fontWeight: 600,
                background: '#F5F5F4',
                color: '#44403C',
                padding: '4px 8px',
                borderRadius: 4,
              }}>
                {form.gallery.length} Images in Gallery
              </span>
            </div>

            {/* Upload Zone & URL Adder */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: 12,
              marginBottom: 16,
            }}>
              {/* Dropzone File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #D6D3D1',
                  borderRadius: 6,
                  padding: '16px 12px',
                  textAlign: 'center',
                  background: uploading ? '#FDF2F4' : '#FAFAF9',
                  cursor: uploading ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 85,
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: 20, marginBottom: 2 }}>{uploading ? '⏳' : '📸'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-accent)' }}>
                  {uploading ? 'Uploading Images to Server...' : 'Click to Upload Multiple Photos'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                  Drag & drop PNG, JPG, WEBP • Saves directly to media server
                </div>
              </div>

              {/* Add by URL Option */}
              <div style={{
                border: '1px solid #E7E5E4',
                borderRadius: 6,
                padding: 12,
                background: '#FAFAF9',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Add Image via CDN Link / URL
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://... image.jpg"
                    style={{ fontSize: 11, height: 32, flex: 1, background: '#FFFFFF' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={handleAddImageUrl}
                    style={{ whiteSpace: 'nowrap', height: 32, fontSize: 11 }}
                  >
                    + Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery Grid with Primary Select */}
            {form.gallery.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--admin-text-muted)',
                background: '#FAF9F8',
                borderRadius: 6,
                fontSize: 12,
              }}>
                No images added yet. Upload files or paste image URLs above.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 12,
              }}>
                {form.gallery.map((imgUrl, idx) => {
                  const isPrimary = form.primaryImage === imgUrl || (!form.primaryImage && idx === 0);

                  return (
                    <div
                      key={imgUrl + idx}
                      style={{
                        position: 'relative',
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: isPrimary ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                        boxShadow: isPrimary ? '0 0 0 2px rgba(74, 14, 23, 0.15)' : 'none',
                        background: '#1C1917',
                        aspectRatio: '3/4',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                      onClick={() => handleSetPrimaryImage(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Garment image ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Primary Cover Badge */}
                      {isPrimary ? (
                        <div style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: 'var(--admin-accent)',
                          color: '#FDE047',
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          padding: '3px 6px',
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                          <span>★</span> PRIMARY COVER
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryImage(imgUrl);
                          }}
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: 'rgba(255, 255, 255, 0.9)',
                            color: '#44403C',
                            border: '1px solid #D6D3D1',
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '2px 5px',
                            borderRadius: 3,
                            cursor: 'pointer',
                          }}
                        >
                          ☆ Set Primary
                        </button>
                      )}

                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGalleryImage(imgUrl);
                        }}
                        title="Remove from gallery"
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: 11,
                        }}
                      >
                        ✕
                      </button>

                      {/* Index Footer */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px 6px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                        color: '#FFFFFF',
                        fontSize: 9,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span>#{idx + 1}</span>
                        {isPrimary && <span style={{ color: '#FDE047', fontWeight: 600 }}>Default Cover</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: COLORWAYS & STREAMLINED SIZE MATRIX (Auto-detects color when typing name) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
                  Colorways & Size Matrix
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  Type any color name (e.g. <strong>Blue, Red, Black, Gold, Sage</strong>)—the color updates automatically.
                </p>
              </div>

              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={addColorVariant}
              >
                + Add Another Color
              </button>
            </div>

            {/* Horizontal Color Tabs */}
            <div style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid #E7E5E4',
              paddingBottom: 10,
              marginBottom: 16,
              overflowX: 'auto',
            }}>
              {form.colorVariants.map((v) => {
                const isActiveTab = v.id === activeColorTab;
                return (
                  <div
                    key={v.id}
                    onClick={() => setActiveColorTab(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 20,
                      background: isActiveTab ? '#FDF2F4' : '#F5F5F4',
                      border: isActiveTab ? '1.5px solid var(--admin-accent)' : '1px solid #E7E5E4',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isActiveTab ? 700 : 500,
                      color: isActiveTab ? 'var(--admin-accent)' : '#44403C',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Live Auto-Updated Swatch in Tab */}
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      backgroundColor: v.colorHex || resolveColorNameToHex(v.color),
                      border: '1.5px solid rgba(0,0,0,0.15)',
                      flexShrink: 0,
                      transition: 'background-color 0.2s ease',
                    }} />
                    <span>{v.color || 'Unnamed'}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      ({v.inStockSizes.length} sizes in stock)
                    </span>

                    {form.colorVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeColorVariant(v.id);
                        }}
                        title="Delete colorway"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Focused Active Color Configuration Panel */}
            {activeVariant && (
              <div style={{
                background: '#FAF9F8',
                borderRadius: 6,
                border: '1px solid #EFECE8',
                padding: 16,
              }}>
                {/* Clean Color Name with Live Dynamic Color Swatch Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                      Color Name (Type color to change color automatically)
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        value={activeVariant.color}
                        onChange={e => handleColorNameChange(activeVariant.id, e.target.value)}
                        placeholder="Type color: Blue, Red, Black, Beige, Wine, Gold, Sage..."
                        style={{
                          fontSize: 13,
                          height: 38,
                          paddingLeft: 38,
                          paddingRight: 12,
                          background: '#FFFFFF',
                          fontWeight: 600,
                          width: '100%',
                          borderRadius: 6,
                          border: '1px solid #D6D3D1',
                          outline: 'none',
                        }}
                      />
                      {/* Live Visible Color Swatch Circle directly inside the input */}
                      <span
                        style={{
                          position: 'absolute',
                          left: 11,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: activeVariant.colorHex || resolveColorNameToHex(activeVariant.color),
                          border: '1.5px solid rgba(0,0,0,0.2)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          transition: 'background-color 0.2s ease',
                        }}
                        title={`Detected color: ${activeVariant.colorHex}`}
                      />
                    </div>
                  </div>

                  {/* Live Visual Color Chip Preview */}
                  <div style={{ paddingTop: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 14px',
                      borderRadius: 20,
                      background: '#FFFFFF',
                      border: '1px solid #E7E5E4',
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: activeVariant.colorHex || resolveColorNameToHex(activeVariant.color),
                        border: '1.5px solid rgba(0,0,0,0.2)',
                        transition: 'background-color 0.2s ease',
                      }} />
                      <span style={{ color: '#1C1917' }}>{activeVariant.color || 'Type color...'}</span>
                      <span style={{ fontSize: 11, color: '#78716C', fontFamily: 'monospace' }}>
                        {activeVariant.colorHex}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sleek Ultra-Compact Size Matrix */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Size Inventory for <span style={{ color: 'var(--admin-accent)' }}>{activeVariant.color}</span>
                    </label>
                    <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                      Click any size to cycle: <strong style={{ color: '#166534' }}>In Stock</strong> → <strong style={{ color: '#991B1B' }}>Sold Out</strong> → <span style={{ color: '#78716C' }}>Inactive</span>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                    {STANDARD_SIZES.map(sz => {
                      const isOffered = activeVariant.sizes.includes(sz);
                      const isInStock = activeVariant.inStockSizes.includes(sz);

                      let bg = '#F5F5F4';
                      let borderColor = '#E7E5E4';
                      let statusText = 'Unavailable';
                      let statusBg = '#E7E5E4';
                      let statusColor = '#78716C';

                      if (isOffered && isInStock) {
                        bg = '#FFFFFF';
                        borderColor = '#16A34A';
                        statusText = '● In Stock';
                        statusBg = '#DCFCE7';
                        statusColor = '#166534';
                      } else if (isOffered && !isInStock) {
                        bg = '#FFFFFF';
                        borderColor = '#DC2626';
                        statusText = '○ Sold Out';
                        statusBg = '#FEE2E2';
                        statusColor = '#991B1B';
                      }

                      return (
                        <div
                          key={sz}
                          onClick={() => cycleSizeStatus(activeVariant.id, sz)}
                          style={{
                            background: bg,
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: 6,
                            padding: '8px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isOffered ? '#1C1917' : '#A8A29E',
                          }}>
                            Size {sz}
                          </span>

                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: statusBg,
                            color: statusColor,
                            padding: '2px 6px',
                            borderRadius: 3,
                          }}>
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Specifications & Royal Atelier Accords */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
              Garment Specifications & Craft Accords
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <FormField label="Content / Fabric">
                <input
                  value={form.fabricContent}
                  onChange={e => setForm(f => ({ ...f, fabricContent: e.target.value }))}
                  placeholder="100% Silk + Lining : 100% Viscose"
                />
              </FormField>

              <FormField label="No. of Components">
                <input
                  type="number"
                  value={form.componentsCount}
                  onChange={e => setForm(f => ({ ...f, componentsCount: e.target.value }))}
                  placeholder="3"
                />
              </FormField>

              <FormField label="Wash Care Instructions">
                <input
                  value={form.washCare}
                  onChange={e => setForm(f => ({ ...f, washCare: e.target.value }))}
                  placeholder="Dry Clean / Spot Clean"
                />
              </FormField>

              <FormField label="Country of Origin">
                <input
                  value={form.countryOfOrigin}
                  onChange={e => setForm(f => ({ ...f, countryOfOrigin: e.target.value }))}
                  placeholder="India"
                />
              </FormField>
            </div>

            <FormField label="Garment Measurements Accord">
              <textarea
                rows={3}
                value={form.measurements}
                onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))}
                placeholder="Sherwani Length - 110 cm (43.3 In)&#10;Churidar Fabric - 250 cm (2.5 Mtrs)&#10;Draped Stole - 250 cm (2.5 Mtrs)"
              />
            </FormField>

            <FormField label="Set Includes Description">
              <input
                value={form.setIncludes}
                onChange={e => setForm(f => ({ ...f, setIncludes: e.target.value }))}
                placeholder="Hand-embroidered Sherwani, Churidar Fabric & Handcrafted Silk Stole"
              />
            </FormField>
          </div>

        </div>

        {/* RIGHT COLUMN: PRICING, DELIVERY & PUBLISH (Width 330px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Pricing & Stock Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 18,
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>
              Pricing & Stock
            </h3>

            <FormField label="Base Price (₹ INR) *">
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="290000"
                style={{ fontSize: 14, fontWeight: 700 }}
              />
            </FormField>

            <FormField label="Sale Price (₹ INR)">
              <input
                type="number"
                value={form.salePrice}
                onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                placeholder="275000 (Optional)"
              />
            </FormField>

            <FormField label="Total Inventory Stock">
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="8"
              />
            </FormField>
          </div>

          {/* Delivery Method & Status Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid var(--admin-border)',
            padding: 18,
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>
              Fulfillment & Visibility
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1C1917', display: 'block', marginBottom: 8 }}>
                Delivery Availability
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'both', label: 'Both (Home Delivery & Store Pickup)' },
                  { value: 'home', label: 'Home Delivery Only' },
                  { value: 'pickup', label: 'Store Pick-up Only' },
                ].map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={opt.value}
                      checked={form.deliveryMethod === opt.value}
                      onChange={() => setForm(f => ({ ...f, deliveryMethod: opt.value as any }))}
                      style={{ accentColor: 'var(--admin-accent)' }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid #F5F5F4' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.readyToShip}
                  onChange={e => setForm(f => ({ ...f, readyToShip: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                />
                <span style={{ fontSize: 13, color: '#1C1917', fontWeight: 500 }}>Ready to Ship Badge</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                />
                <span style={{ fontSize: 13, color: '#1C1917', fontWeight: 500 }}>Active in Public Storefront</span>
              </label>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '12px 16px', fontSize: 14 }}
          >
            {saving ? 'Publishing...' : (isEditing ? 'Save Changes' : 'Publish Product')}
          </button>

        </div>

      </div>
    </div>
  );
};
