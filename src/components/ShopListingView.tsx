'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MensProduct } from '../data/mensCollection';
import { useCartStore } from '../stores';
import { effectivePrice, productVariants } from '../lib/product';
import { useWishlist } from '../lib/useWishlist';

interface ShopListingViewProps {
  products: MensProduct[];
  initialCategory?: string;
}

const formatPrice = (price: number) =>
  `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const focusStyle =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-strong';

function CloseIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M6 18 18 6" />
    </svg>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="border-b border-[#E2DDD6] py-5">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden ${focusStyle}`}
      >
        {title}
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

export const ShopListingView: React.FC<ShopListingViewProps> = ({
  products,
  initialCategory,
}) => {
  const maxPrice = Math.max(
    10000,
    Math.ceil(
      Math.max(0, ...products.map((product) => effectivePrice(product))) / 10000
    ) * 10000
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || 'All'
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState(maxPrice);
  const [onlyReadyToShip, setOnlyReadyToShip] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const wishlist = useWishlist();
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const quickAddPanelRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const { categories, colors, sizes, crafts } = useMemo(
    () => ({
      categories: [
        'All',
        ...new Set(products.map((product) => product.category).filter(Boolean)),
      ],
      colors: Array.from(
        new Map(
          products
            .filter((product) => product.color)
            .map((product) => [product.color, product.colorHex])
        ).entries()
      ).sort(([a], [b]) => a.localeCompare(b)),
      sizes: [...new Set(products.flatMap((product) => product.sizes))].sort(
        (a, b) => {
          const letterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
          const aIndex = letterSizes.indexOf(a);
          const bIndex = letterSizes.indexOf(b);
          return aIndex >= 0 && bIndex >= 0
            ? aIndex - bIndex
            : a.localeCompare(b, undefined, { numeric: true });
        }
      ),
      crafts: [
        ...new Set(products.map((product) => product.craft).filter(Boolean)),
      ].sort(),
    }),
    [products]
  );

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (quickAddId) {
      quickAddPanelRef.current?.querySelector<HTMLButtonElement>('button[data-size]')?.focus();
    }
  }, [quickAddId]);

  const closeQuickAdd = (productId: string) => {
    setQuickAddId(null);
    document.getElementById(`quick-add-trigger-${productId}`)?.focus();
  };

  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterDrawerOpen(false);
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, input, summary, a[href], [tabindex="0"]'
        ) || []
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getClientRects().length > 0
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      filterTriggerRef.current?.focus();
    };
  }, [isFilterDrawerOpen]);

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };
  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedCrafts([]);
    setPriceLimit(maxPrice);
    setOnlyReadyToShip(false);
  };
  const handleQuickAdd = (product: MensProduct, size: string) => {
    const added = addItem({
      product_id: product.id, color: productVariants(product)[0]?.color || '', size, max_quantity: product.stock,
      quantity: 1,
      price: effectivePrice(product),
      title: product.title,
      image_url: product.imageFront,
    });
    closeQuickAdd(product.id);
    setToastMessage(added ? 'Added to bag' : 'All available stock is already in your bag.');
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          if (
            selectedCategory !== 'All' &&
            product.category !== selectedCategory
          )
            return false;
          if (selectedColors.length && !selectedColors.includes(product.color))
            return false;
          if (
            selectedSizes.length &&
            !selectedSizes.some((size) => productVariants(product).some(variant => variant.inStockSizes.includes(size)))
          )
            return false;
          if (selectedCrafts.length && !selectedCrafts.includes(product.craft))
            return false;
          if (effectivePrice(product) > priceLimit) return false;
          if (onlyReadyToShip && !product.readyToShip) return false;
          return true;
        })
        .sort((a, b) => {
          if (sortBy === 'price-low' || sortBy === 'price-high') {
            if (effectivePrice(a) <= 0 && effectivePrice(b) > 0) return 1;
            if (effectivePrice(b) <= 0 && effectivePrice(a) > 0) return -1;
            return sortBy === 'price-low'
              ? effectivePrice(a) - effectivePrice(b)
              : effectivePrice(b) - effectivePrice(a);
          }
          if (sortBy === 'newest') return Number(b.id) - Number(a.id);
          return 0;
        }),
    [
      products,
      selectedCategory,
      selectedColors,
      selectedSizes,
      selectedCrafts,
      priceLimit,
      onlyReadyToShip,
      sortBy,
    ]
  );

  const activeFilters = [
    ...(selectedCategory === 'All'
      ? []
      : [
          { label: selectedCategory, remove: () => setSelectedCategory('All') },
        ]),
    ...selectedColors.map((color) => ({
      label: color,
      remove: () => toggleSelection(color, setSelectedColors),
    })),
    ...selectedSizes.map((size) => ({
      label: `Size ${size}`,
      remove: () => toggleSelection(size, setSelectedSizes),
    })),
    ...selectedCrafts.map((craft) => ({
      label: craft,
      remove: () => toggleSelection(craft, setSelectedCrafts),
    })),
    ...(onlyReadyToShip
      ? [{ label: 'Ready to ship', remove: () => setOnlyReadyToShip(false) }]
      : []),
    ...(priceLimit < maxPrice
      ? [
          {
            label: `Up to ${formatPrice(priceLimit)}`,
            remove: () => setPriceLimit(maxPrice),
          },
        ]
      : []),
  ];
  const productCount = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`;

  return (
    <div className="min-h-screen bg-white pb-16 text-[#333333] font-sans-clean tracking-normal">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">{wishlist.error && <p role="alert" className="pt-4 text-sm">{wishlist.error} <button className="underline" onClick={wishlist.reload}>Try again</button></p>}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 pt-6 text-sm font-normal text-[#706B65]"
        >
          <Link href="/" className={`hover:text-primary-foreground ${focusStyle}`}>
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">
            {selectedCategory === 'All' ? 'Clothing' : selectedCategory}
          </span>
        </nav>
        <div className="flex items-baseline justify-between gap-4 pb-7 pt-5 sm:pt-7">
          <h1 className="text-2xl font-normal tracking-[0.02em] sm:text-[32px]">
            {selectedCategory === 'All' ? 'All clothing' : selectedCategory}
          </h1>
          <span
            aria-live="polite"
            className="shrink-0 text-sm font-normal text-[#706B65]"
          >
            {productCount}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-y border-[#DED8D0] py-3">
          <div className="flex items-center gap-6">
            <button
              ref={filterTriggerRef}
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isFilterDrawerOpen}
              className={`inline-flex min-h-10 items-center gap-2 text-sm font-medium hover:text-primary-foreground ${focusStyle}`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 17h16M8 4v6M16 14v6" />
              </svg>
              Filters{activeFilters.length > 0 && ` (${activeFilters.length})`}
            </button>
            <label className="hidden cursor-pointer items-center gap-2.5 text-sm font-normal sm:flex">
              <input
                type="checkbox"
                checked={onlyReadyToShip}
                onChange={(event) => setOnlyReadyToShip(event.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Ready to ship
            </label>
          </div>
          <div className="flex items-center gap-5">
            <div
              role="group"
              aria-label="Products per row"
              className="hidden items-center gap-1 lg:flex"
            >
              {([2, 3, 4] as const).map((columns) => (
                <button
                  key={columns}
                  onClick={() => setGridColumns(columns)}
                  aria-label={`${columns} columns`}
                  aria-pressed={gridColumns === columns}
                  className={`flex h-9 w-9 items-center justify-center ${focusStyle} ${gridColumns === columns ? 'text-[#333333]' : 'text-[#A39B92] hover:text-[#333333]'}`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    {Array.from({ length: columns }, (_, index) => (
                      <rect
                        key={index}
                        x={2 + index * (20 / columns)}
                        y="4"
                        width={20 / columns - 2}
                        height="16"
                      />
                    ))}
                  </svg>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm font-normal">
              <span className="hidden text-[#706B65] sm:inline">Sort by</span>
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className={`min-h-10 max-w-[160px] cursor-pointer border-0 bg-transparent py-2 pr-1 text-sm text-[#333333] ${focusStyle}`}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="newest">Newest first</option>
              </select>
            </label>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-5">
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={filter.remove}
                aria-label={`Remove filter: ${filter.label}`}
                className={`inline-flex items-center gap-2 border border-[#DED8D0] px-3 py-2 text-sm font-normal hover:border-primary ${focusStyle}`}
              >
                {filter.label}
                <CloseIcon className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className={`px-2 py-2 text-sm font-normal underline underline-offset-4 ${focusStyle}`}
            >
              Clear all
            </button>
          </div>
        )}
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-xl font-normal">No products found</h2>
            <p className="mb-6 mt-3 text-sm font-normal text-[#706B65]">
              Try changing or clearing your filters.
            </p>
            <button
              onClick={clearAllFilters}
              className={`border border-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary-dark hover:text-white ${focusStyle}`}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-x-4 gap-y-9 pt-7 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:gap-x-7 ${gridColumns === 2 ? 'lg:grid-cols-2' : gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
          >
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.ids.includes(product.id);
              const availableSizes = productVariants(product)[0]?.inStockSizes || [];
              const hasDetailImage = Boolean(
                product.imageDetail &&
                product.imageDetail !== product.imageFront
              );
              return (
                <article key={product.id}>
                  <div className="relative mb-3 aspect-[2/3] overflow-hidden bg-[#ECE8E1]">
                    <Link
                      href={`/products/${product.id}`}
                      aria-label={`View ${product.title}`}
                      className={`group block h-full w-full ${focusStyle}`}
                    >
                      <img
                        src={product.imageFront}
                        alt={product.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                      {hasDetailImage && (
                        <img
                          src={product.imageDetail}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover object-top opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                        />
                      )}
                    </Link>
                    <button
                      onClick={() =>
                        wishlist.toggle(product.id)
                      }
                      aria-label={`${isWishlisted ? 'Remove' : 'Save'} ${product.title} ${isWishlisted ? 'from' : 'to'} wishlist`}
                      aria-pressed={isWishlisted} disabled={wishlist.loading || wishlist.busy !== null || Boolean(wishlist.error)}
                      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center bg-white text-primary-foreground ${focusStyle}`}
                    >
                      <svg
                        className="h-[18px] w-[18px]"
                        fill={isWishlisted ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                      </svg>
                    </button>
                    {quickAddId === product.id && (
                      <div
                        id={`quick-add-${product.id}`}
                        ref={quickAddPanelRef}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') closeQuickAdd(product.id);
                        }}
                        className="absolute inset-x-0 bottom-0 border-t border-[#DED8D0] bg-white p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-normal">
                            Select size
                          </span>
                          <button
                            onClick={() => closeQuickAdd(product.id)}
                            aria-label="Close size selection"
                            className={`p-1 ${focusStyle}`}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              data-size={size}
                              onClick={() => handleQuickAdd(product, size)}
                              aria-label={`Add ${product.title}, size ${size}, to bag`}
                              className={`min-h-9 min-w-9 border border-[#CFC7BD] px-2 text-sm hover:border-primary hover:bg-primary-dark hover:text-white ${focusStyle}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <h2 className="min-h-[42px] text-sm font-normal leading-[21px] sm:text-sm">
                    <Link
                      href={`/products/${product.id}`}
                      className={`hover:text-primary-foreground ${focusStyle}`}
                    >
                      {product.title}
                    </Link>
                  </h2>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                    <span className="text-sm font-medium sm:text-sm">
                      {effectivePrice(product) > 0
                        ? formatPrice(effectivePrice(product))
                        : 'Price on request'}
                    </span>
                    {effectivePrice(product) > 0 && availableSizes.length > 0 && (
                      <button
                        onClick={() =>
                          setQuickAddId(
                            quickAddId === product.id ? null : product.id
                          )
                        }
                        aria-expanded={quickAddId === product.id}
                        id={`quick-add-trigger-${product.id}`}
                        aria-controls={`quick-add-${product.id}`}
                        className={`py-1 text-sm font-normal text-[#625D57] underline underline-offset-4 hover:text-primary-foreground ${focusStyle}`}
                      >
                        Quick add
                        <span className="sr-only"> {product.title}</span>
                      </button>
                    )}
                  </div>
                  {product.readyToShip && (
                    <p className="mt-1 text-sm font-normal text-[#706B65]">
                      Ready to ship
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-filters-title"
            className="relative flex h-full w-full max-w-[400px] flex-col bg-white"
          >
            <div className="flex items-center justify-between border-b border-[#DED8D0] px-6 py-5">
              <h2 id="shop-filters-title" className="text-xl font-normal">
                Filters
              </h2>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close filters"
                className={`p-2 ${focusStyle}`}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              <FilterSection title="Category">
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex cursor-pointer items-center justify-between gap-4 text-sm font-normal"
                    >
                      {category === 'All' ? 'All clothing' : category}
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Price">
                <label
                  htmlFor="shop-price-limit"
                  className="mb-4 flex justify-between text-sm font-normal text-[#706B65]"
                >
                  <span>Maximum price</span>
                  <span>{formatPrice(priceLimit)}</span>
                </label>
                <input
                  id="shop-price-limit"
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="10000"
                  value={priceLimit}
                  onChange={(event) =>
                    setPriceLimit(Number(event.target.value))
                  }
                  className="w-full accent-primary"
                />
              </FilterSection>
              <FilterSection title="Colour">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {colors.map(([color, hex]) => (
                    <label
                      key={color}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() =>
                          toggleSelection(color, setSelectedColors)
                        }
                        className="h-3.5 w-3.5 shrink-0 accent-primary"
                      />
                      {hex && (
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: hex }}
                          aria-hidden="true"
                        />
                      )}
                      {color}
                    </label>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Size">
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      aria-pressed={selectedSizes.includes(size)}
                      onClick={() => toggleSelection(size, setSelectedSizes)}
                      className={`min-h-10 min-w-10 border px-2 text-sm ${focusStyle} ${selectedSizes.includes(size) ? 'border-primary bg-primary text-white' : 'border-[#DED8D0] hover:border-primary'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Craft">
                <div className="space-y-3">
                  {crafts.map((craft) => (
                    <label
                      key={craft}
                      className="flex cursor-pointer items-start justify-between gap-4 text-sm font-normal leading-5"
                    >
                      {craft}
                      <input
                        type="checkbox"
                        checked={selectedCrafts.includes(craft)}
                        onChange={() =>
                          toggleSelection(craft, setSelectedCrafts)
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                    </label>
                  ))}
                </div>
              </FilterSection>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-6 text-sm font-normal">
                Ready to ship
                <input
                  type="checkbox"
                  checked={onlyReadyToShip}
                  onChange={(event) => setOnlyReadyToShip(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
            <div className="flex items-center gap-5 border-t border-[#DED8D0] p-6">
              <button
                onClick={clearAllFilters}
                className={`shrink-0 text-sm font-normal underline underline-offset-4 ${focusStyle}`}
              >
                Clear all
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className={`min-h-12 flex-1 bg-primary px-3 py-3 text-sm font-medium text-white hover:bg-primary-dark hover:text-white ${focusStyle}`}
              >
                Show {productCount}
              </button>
            </div>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite">
        {toastMessage && (
          <div className="fixed bottom-5 right-4 z-50 flex items-center gap-6 border border-[#DED8D0] bg-white px-5 py-4 text-sm sm:right-6">
            <span>{toastMessage}</span>
            <Link
              href="/cart"
              className={`text-primary-foreground underline underline-offset-4 ${focusStyle}`}
            >
              View bag
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
