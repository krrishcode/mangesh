'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { MensProduct } from '../data/mensCollection';
import type { CatalogCategory } from '../lib/catalog';
import { effectivePrice } from '../lib/product';
import { useCartStore } from '../stores';
import { HeaderAccountMenu } from './HeaderAccountMenu';
import '../styles/header.css';

const EXPLORE_LINKS = [
  { name: 'Weddings', href: '/weddings' },
  { name: 'Runway', href: '/runway' },
  { name: 'Celebrity looks', href: '/celebrities' },
  { name: 'Contact Us', href: '/#contact-us' },
];
const ICON_PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 21v-2a7 7 0 0 1 14 0v2',
  bag: 'M8 9V7a4 4 0 0 1 8 0v2M5 9h14l1 12H4L5 9Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  close: 'm6 6 12 12M6 18 18 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm7 10 5 5 5-5',
};
function Icon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg
      className="site-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function SearchForm({
  id,
  query,
  onChange,
  onSubmit,
}: {
  id: string;
  query: string;
  onChange: (query: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form role="search" onSubmit={onSubmit} className="site-search-form">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search clothing, colour or fabric"
        autoComplete="off"
      />
      <button
        type="submit"
        className="site-icon-button"
        aria-label="Submit search"
      >
        <Icon name="search" />
      </button>
    </form>
  );
}

export function HeaderInteractive() {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [activePanel, setActivePanel] = useState<'menu' | 'search' | null>(
    null
  );
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<MensProduct[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const collectionLinks = categories
    .filter((category) => catalog.some((product) => product.categorySlug === category.slug))
    .map((category) => ({ name: category.name, href: '/collections/' + category.slug }));
  const shopLinks = [{ name: 'Shop all', href: '/shop' }, ...collectionLinks];
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const collectionsTriggerRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setCollectionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!collectionsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !collectionsRef.current?.contains(event.target)) {
        setCollectionsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [collectionsOpen]);

  useEffect(() => {
    if (catalogLoaded) return;
    let isCurrent = true;
    setIsLoading(true);
    fetch('/api/catalog')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load catalogue');
        return response.json();
      })
      .then((data: { products: MensProduct[]; categories: CatalogCategory[] }) => {
        if (isCurrent && Array.isArray(data.products))
          setCatalog(data.products);
        if (isCurrent && Array.isArray(data.categories)) setCategories(data.categories);
      })
      .catch(() => {
        if (isCurrent) setCatalogError('Search is temporarily unavailable. Please try again later.');
      })
      .finally(() => {
        if (!isCurrent) return;
        setCatalogLoaded(true);
        setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [catalogLoaded]);

  useEffect(() => {
    if (!activePanel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const initialFocus =
      activePanel === 'search'
        ? panelRef.current?.querySelector<HTMLInputElement>('input')
        : panelRef.current?.querySelector<HTMLButtonElement>('button');
    initialFocus?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePanel(null);
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button, input, [tabindex="0"]'
        ) || []
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getClientRects().length > 0
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [activePanel]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleResize = () => {
      if (desktop.matches)
        setActivePanel((panel) => (panel === 'menu' ? null : panel));
      else setCollectionsOpen(false);
    };
    desktop.addEventListener('change', handleResize);
    return () => desktop.removeEventListener('change', handleResize);
  }, []);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return catalog.filter((product) => {
      const searchable =
        `${product.title} ${product.category} ${product.color} ${product.craft} ${product.fabricContent || ''}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }, [catalog, query]);
  const openPanel = (panel: 'menu' | 'search', trigger: HTMLElement) => {
    setCollectionsOpen(false);
    setAccountOpen(false);
    openerRef.current = trigger;
    setActivePanel(panel);
  };
  const closePanel = () => setActivePanel(null);
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActivePanel('search');
  };
  const isCurrentPage = (href: string) => href === pathname;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-row">
            <div className="site-header-start">
              <button
                className="site-icon-button site-menu-trigger"
                onClick={(event) => openPanel('menu', event.currentTarget)}
                aria-label="Open menu"
                aria-expanded={activePanel === 'menu'}
                aria-controls={activePanel === 'menu' ? 'site-menu' : undefined}
                aria-haspopup="dialog"
              >
                <Icon name="menu" />
              </button>
              <button
                className="site-header-search site-header-action"
                onClick={(event) => openPanel('search', event.currentTarget)}
                aria-label="Search products"
                aria-haspopup="dialog"
                aria-expanded={activePanel === 'search'}
                aria-controls={activePanel === 'search' ? 'site-search' : undefined}
              >
                <Icon name="search" />
              </button>
            </div>
            <Link
              href="/"
              className="site-wordmark"
              aria-label="Mangesh Mahadev home"
            >
              <span className="site-wordmark-name">MANGESH MAHADEV</span>
              <span className="site-wordmark-detail">Couture & bespoke</span>
            </Link>
            <div className="site-header-end">
              <button
                className="site-icon-button site-mobile-search"
                onClick={(event) => openPanel('search', event.currentTarget)}
                aria-label="Search products"
                aria-haspopup="dialog"
                aria-expanded={activePanel === 'search'}
                aria-controls={activePanel === 'search' ? 'site-search' : undefined}
              >
                <Icon name="search" />
              </button>
              <HeaderAccountMenu open={accountOpen} hydrated={hasMounted} onOpenChange={(open) => {
                setAccountOpen(open);
                if (open) setCollectionsOpen(false);
              }} />
              <Link href="/account/wishlist" className="site-icon-button site-header-wishlist" aria-label="Wishlist">
                <Icon name="heart" />
              </Link>
              <Link
                href="/cart"
                className="site-header-action site-bag-link"
                aria-label={
                  hasMounted && itemCount
                    ? `Shopping bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                    : 'Shopping bag'
                }
              >
                <Icon name="bag" />
                <span className="site-bag-label">Bag</span>
                <span className="site-bag-count" aria-hidden="true">{hasMounted ? itemCount : 0}</span>
              </Link>
            </div>
          </div>
          <div className="site-navigation-row">
            <nav className="site-desktop-nav" aria-label="Main navigation">
              <Link href="/shop" aria-current={isCurrentPage('/shop') ? 'page' : undefined}>Shop all</Link>
              <div
                className="site-collections"
                ref={collectionsRef}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setCollectionsOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setCollectionsOpen(false);
                    collectionsTriggerRef.current?.focus();
                  }
                }}
              >
                <button
                  ref={collectionsTriggerRef}
                  className="site-collections-trigger"
                  aria-expanded={collectionsOpen}
                  aria-controls="site-collections"
                  data-current={pathname.startsWith('/collections/') || undefined}
                  onClick={() => { setAccountOpen(false); setCollectionsOpen((open) => !open); }}
                >
                  Collections <Icon name="chevron" />
                </button>
                <div id="site-collections" className="site-collections-dropdown" hidden={!collectionsOpen}>
                  <div className="site-collections-list">
                    <div className="site-collections-intro">
                      <h2>Explore the collection</h2>
                      <Link href="/shop" onClick={() => setCollectionsOpen(false)}>View all clothing <Icon name="arrow" /></Link>
                    </div>
                    {catalogError ? <p role="status">Collections are temporarily unavailable. Browse all clothing or try again later.</p> : isLoading ? <p role="status">Loading collections…</p> : (
                      <div className="site-collections-links">
                        {collectionLinks.map((link) => (
                          <Link key={link.href} href={link.href} onClick={() => setCollectionsOpen(false)} aria-current={isCurrentPage(link.href) ? 'page' : undefined}>
                            {link.name}<Icon name="arrow" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link className="site-collections-feature" href="/weddings" onClick={() => setCollectionsOpen(false)}>
                    <img src="https://cdn.mangeshmahadev.com/images/hero/sunlit-courtyard.webp" alt="" />
                    <span>The wedding edit <Icon name="arrow" /></span>
                  </Link>
                </div>
              </div>
              {EXPLORE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} aria-current={isCurrentPage(link.href) ? 'page' : undefined}>{link.name}</Link>
              ))}
            </nav>
            <Link className="site-appointment-link" href="/#bespoke-appointment">Personal Styling <Icon name="arrow" /></Link>
          </div>
        </div>
      </header>

      {activePanel && (
        <div
          className={`site-panel-overlay ${activePanel === 'search' ? 'site-search-overlay' : ''}`}
        >
          <div
            className="site-panel-backdrop"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id={activePanel === 'menu' ? 'site-menu' : 'site-search'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-panel-title"
            className={
              activePanel === 'menu' ? 'site-menu-panel' : 'site-search-panel'
            }
          >
            <div className="site-panel-heading">
              <h2 id="site-panel-title">
                {activePanel === 'menu' ? 'Explore Mangesh Mahadev' : 'Find your next piece'}
              </h2>
              <button
                className="site-icon-button"
                onClick={closePanel}
                aria-label={
                  activePanel === 'menu' ? 'Close menu' : 'Close search'
                }
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="site-panel-search">
              <SearchForm
                id={`site-${activePanel}-query`}
                query={query}
                onChange={setQuery}
                onSubmit={submitSearch}
              />
            </div>
            {activePanel === 'menu' ? (
              <>
                <div className="site-menu-content">
                  <nav aria-label="Shop navigation">
                    <h3 className="site-nav-caption">Shop</h3>
                    {shopLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closePanel}
                        aria-current={
                          isCurrentPage(link.href) ? 'page' : undefined
                        }
                        className="site-menu-link"
                      >
                        {link.name}
                        <Icon name="arrow" />
                      </Link>
                    ))}
                  </nav>
                  <nav
                    aria-label="Explore navigation"
                    className="site-menu-explore"
                  >
                    <h3 className="site-nav-caption">Explore</h3>
                    {EXPLORE_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closePanel}
                        aria-current={
                          isCurrentPage(link.href) ? 'page' : undefined
                        }
                        className="site-menu-link site-menu-secondary"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="site-menu-footer">
                  <Link className="site-appointment-link" href="/#bespoke-appointment" onClick={closePanel}>Personal Styling <Icon name="arrow" /></Link>
                  <div className="site-menu-account">
                    <Link
                      href="/account"
                      onClick={closePanel}
                      className="site-header-action"
                    >
                      <Icon name="user" />
                      Account & orders
                    </Link>
                    <span>INR · ₹</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="site-search-content">
                {catalogError && <p role="alert">{catalogError}</p>}
                {!query.trim() ? (
                  <nav aria-label="Browse categories">
                    <h3 className="site-nav-caption">Browse clothing</h3>
                    <div className="site-search-categories">
                      {shopLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closePanel}
                        >
                          {link.name}
                          <Icon name="arrow" />
                        </Link>
                      ))}
                    </div>
                  </nav>
                ) : (
                  <>
                    <p className="site-search-summary" role="status">
                      {isLoading
                        ? 'Searching…'
                        : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
                    </p>
                    {!isLoading && !results.length && (
                      <div className="site-search-empty">
                        <h3>No products found</h3>
                        <p>Try a different product, colour or fabric.</p>
                        <button
                          onClick={() => {
                            setQuery('');
                            panelRef.current
                              ?.querySelector<HTMLInputElement>('input')
                              ?.focus();
                          }}
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                    {!isLoading && (
                      <ul className="site-search-results">
                        {results.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={closePanel}
                            >
                              <img
                                src={product.imageFront}
                                alt=""
                                loading="lazy"
                              />
                              <span>
                                <span className="site-search-product-title">
                                  {product.title}
                                </span>
                                <span className="site-search-product-price">
                                  {effectivePrice(product) > 0
                                    ? `₹${effectivePrice(product).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                    : 'Price on request'}
                                </span>
                              </span>
                              <Icon name="arrow" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
