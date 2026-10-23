import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  salePrice: string | null;
  stock: number;
  sku: string;
  categoryId: number | null;
  categoryName?: string | null;
  isActive: boolean;
  imageFront: string | null;
  imageDetail: string | null;
  color: string | null;
  colorHex: string | null;
  craft: string | null;
  badge: string | null;
  sizes: string | null;
  inStockSizes: string | null;
  readyToShip: boolean;
  editorialStory: string | null;
  styleNumber: string | null;
  measurements: string | null;
  fabricContent: string | null;
  componentsCount: number;
  setIncludes: string | null;
  washCare: string | null;
  countryOfOrigin: string | null;
  manufacturerAddress: string | null;
  returnsPolicy: string | null;
  disclaimer: string | null;
  deliveryMethod?: 'both' | 'home' | 'pickup' | string | null;
  colorVariants?: string | null;
  createdAt: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface ProductsViewProps {
  onNavigate?: (route: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const goTo = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.history.pushState({}, '', `/admin/${route}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchApi<{ data: Product[] }>('/admin/products'),
      fetchApi<{ data: CategoryOption[] }>('/admin/categories'),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (p: Product) => {
    await fetchApi(`/admin/products/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    load();
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.styleNumber && p.styleNumber.toLowerCase().includes(search.toLowerCase())) ||
      (p.color && p.color.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      String(p.categoryId) === selectedCategory ||
      (p.categoryName && p.categoryName.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const columns: Column<Product>[] = [
    {
      key: 'imageFront',
      label: 'Image',
      width: '64px',
      sortable: false,
      render: (p) => (
        <div style={{
          width: 44,
          height: 56,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#F5F5F4',
          border: '1px solid #E7E5E4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {p.imageFront ? (
            <img
              src={p.imageFront}
              alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span style={{ fontSize: 10, color: '#A8A29E', fontWeight: 600 }}>NO IMG</span>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Product Details',
      render: (p) => {
        let variantCount = 1;
        try {
          if (p.colorVariants) {
            const arr = JSON.parse(p.colorVariants);
            if (Array.isArray(arr)) variantCount = arr.length;
          }
        } catch {}

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => goTo(`products/edit/${p.id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1C1917',
                  textAlign: 'left',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#4A0E17')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#1C1917')}
              >
                {p.title}
              </button>
              {p.badge && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: '#FAF8F5',
                  color: '#4A0E17',
                  border: '1px solid #E8D6D9',
                }}>
                  {p.badge}
                </span>
              )}
              {p.readyToShip && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}>
                  READY TO SHIP
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#78716C', marginTop: 3, display: 'flex', gap: 12 }}>
              <span>SKU: <strong style={{ color: '#44403C' }}>{p.sku}</strong></span>
              {p.styleNumber && <span>Style: <strong style={{ color: '#44403C' }}>{p.styleNumber}</strong></span>}
              <span>Colors: <strong style={{ color: '#44403C' }}>{variantCount} colorway{variantCount > 1 ? 's' : ''}</strong></span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'categoryName',
      label: 'Category',
      width: '120px',
      render: (p) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 500,
          background: '#F5F5F4',
          color: '#44403C',
        }}>
          {p.categoryName || 'Sherwanis'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price (INR)',
      width: '130px',
      render: (p) => (
        <div>
          <span style={{ fontWeight: 600, color: '#1C1917' }}>
            ₹{Number(p.price).toLocaleString('en-IN')}
          </span>
          {p.salePrice && (
            <div style={{ fontSize: 11, color: '#DC2626', marginTop: 1 }}>
              ₹{Number(p.salePrice).toLocaleString('en-IN')} (Sale)
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      width: '80px',
      render: (p) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 600,
          background: p.stock <= 5 ? '#FEE2E2' : '#DCFCE7',
          color: p.stock <= 5 ? '#991B1B' : '#166534',
        }}>
          {p.stock} units
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '80px',
      render: (p) => (
        <button
          className={`admin-toggle ${p.isActive ? 'on' : ''}`}
          title={p.isActive ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
          onClick={(e) => { e.stopPropagation(); toggleActive(p); }}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '120px',
      render: (p) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={(e) => { e.stopPropagation(); goTo(`products/edit/${p.id}`); }}
            title="Edit on dedicated full page"
          >
            Edit
          </button>
          <button
            className="admin-btn admin-btn-danger admin-btn-sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
            title="Delete product"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#1C1917' }}>Products Catalogue</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>
            {filteredProducts.length} of {products.length} couture garments mapped from backend
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => goTo('products/new')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
        background: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: 8,
        border: '1px solid var(--admin-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, SKU, style or color..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 13,
              width: '100%',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#78716C' }}>Category:</span>
          <select
            className="admin-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        emptyMessage={search || selectedCategory !== 'all' ? 'No products match your filters' : 'No products in catalogue'}
      />
    </div>
  );
};
