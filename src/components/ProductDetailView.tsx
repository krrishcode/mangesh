'use client';
import { SupportEmailLink } from './SupportEmailLink';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { MensProduct } from '../data/mensCollection';
import { effectivePrice, productVariants } from '../lib/product';
import { useCartStore } from '../stores';
import '../styles/product-detail.css';

interface ProductDetailProps {
  product: MensProduct;
  relatedProducts?: MensProduct[];
}


const formatPrice = (price: number) =>
  price > 0 ? `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Price on request';

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>;
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const variants = useMemo(() => productVariants(product), [product]);
  const [selectedColor, setSelectedColor] = useState(variants[0].color);
  const [selectedSize, setSelectedSize] = useState(variants[0].inStockSizes[0] || '');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<'image' | 'size' | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeVariant = variants.find((variant) => variant.color === selectedColor) || variants[0];
  const galleryImages = [...new Set([
    activeVariant.imageFront || product.imageFront,
    ...(product.gallery?.length ? product.gallery : [product.imageDetail]),
  ].filter(Boolean))];
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];
  const currentPrice = effectivePrice(product);
  const description = product.description?.trim().split(/\n\s*\n/)[0];
  const canPurchase = product.stock > 0 && currentPrice > 0 && activeVariant.inStockSizes.includes(selectedSize);
  const deliveryOption = product.deliveryMethod;
  const canHome = deliveryOption === 'both' || deliveryOption === 'home';
  const canPickup = deliveryOption === 'both' || deliveryOption === 'pickup';
  const suggestions = (relatedProducts ?? []).slice(0, 4);
  const categoryHref = product.categorySlug ? `/collections/${product.categorySlug}` : '/shop';
  const facts: Array<[string, string | number | undefined]> = [
    ['Product code', product.styleNumber || product.sku], ['Fabric', product.fabricContent || product.fabric],
    ['Detail', product.craft], ['Includes', product.setIncludes], ['Measurements', product.measurements],
    ['Care', product.washCare], ['Made in', product.countryOfOrigin], ['Manufacturer', product.manufacturerAddress],
  ];

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!modal || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [modal]);

  function changeColor(color: string) {
    const variant = variants.find((item) => item.color === color)!;
    setSelectedColor(color);
    setSelectedSize(variant.inStockSizes.includes(selectedSize) ? selectedSize : variant.inStockSizes[0] || '');
    setActiveImageIndex(0);
  }

  function addSelectedProduct() {
    if (!canPurchase) return;
    return addItem({ product_id: product.id, color: selectedColor, size: selectedSize, max_quantity: product.stock, quantity: 1, price: currentPrice,
      title: product.title,
      image_url: activeVariant.imageFront || product.imageFront });
  }

  async function shareProduct() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Product link copied.');
    } catch { setMessage('Copy the page address to share this product.'); }
  }

  return (
    <div className="product-page">
      <div className="product-page-inner">
        <nav aria-label="Breadcrumb" className="product-breadcrumb">
          <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
          <Link href={categoryHref}>{product.category}</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{product.title}</span>
        </nav>
        <div className="product-layout">
          <section className="product-gallery" aria-label="Product images">
            <div className="product-thumbnails">
              {galleryImages.map((image, index) => (
                <button key={image} type="button" onClick={() => setActiveImageIndex(index)}
                  aria-label={`View image ${index + 1}`} aria-pressed={activeImageIndex === index} className="product-thumbnail">
                  <img src={image} alt="" loading={index ? 'lazy' : 'eager'} />
                </button>
              ))}
            </div>
            <div className="product-image-wrap">
              <button type="button" className="product-main-image" onClick={() => setModal('image')}
                aria-label={`Enlarge image ${activeImageIndex + 1} of ${product.title}`}>
                <img src={activeImage} alt={`${product.title} in ${selectedColor}, view ${activeImageIndex + 1}`} fetchPriority="high" />
              </button>
              {galleryImages.length > 1 && <span className="product-image-count">{activeImageIndex + 1} / {galleryImages.length}</span>}
            </div>
          </section>
          <section className="product-information" aria-labelledby="product-title">
            <div className="product-heading-row">
              <Link href={categoryHref} className="product-category">{product.category}</Link>
              <button type="button" className="product-share" aria-label="Copy product link" onClick={shareProduct}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 16V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2" /></svg>
              </button>
            </div>
            <h1 id="product-title">{product.title}</h1>
            {product.setIncludes && <p className="product-summary">{product.setIncludes}</p>}
            <div className="product-price-block">
              <p className="product-price">{formatPrice(currentPrice)}{currentPrice < product.price && <del>{formatPrice(product.price)}</del>}</p>
              {currentPrice > 0 && <p className="product-tax-note">Inclusive of all taxes</p>}
              {description && <p className="product-description">{description}</p>}
            </div>
            <fieldset className="product-options">
              <legend>Colour <span>{selectedColor}</span></legend>
              <div className="product-swatches">
                {variants.map((variant) => (
                  <button key={variant.color} type="button" aria-label={`Colour: ${variant.color}`} aria-pressed={selectedColor === variant.color}
                    onClick={() => changeColor(variant.color)} className="product-swatch"
                    style={{ '--swatch-color': variant.colorHex || 'transparent' } as CSSProperties}>
                    <span />{!variant.colorHex && <span className="product-swatch-name">{variant.color}</span>}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="product-options product-size-options">
              <legend>Size {selectedSize && <span>{selectedSize}</span>}</legend>
              <button type="button" className="product-text-link product-size-guide" onClick={() => setModal('size')}>Size &amp; fit</button>
              <div className="product-sizes">
                {activeVariant.sizes.map((size) => (
                  <button key={size} type="button" aria-label={`Size ${size}`} aria-pressed={selectedSize === size}
                    disabled={!activeVariant.inStockSizes.includes(size)} onClick={() => setSelectedSize(size)}>{size}</button>
                ))}
              </div>
              {!activeVariant.inStockSizes.length && <p className="product-availability">This colour is currently unavailable.</p>}
            </fieldset>
            <div className="product-purchase-actions">
              <button type="button" className="product-action product-action-outline" disabled={!canPurchase}
                onClick={() => setMessage(addSelectedProduct() ? 'Added to your bag.' : 'All available stock is already in your bag.')}>Add to Cart</button>
              <button type="button" className="product-action product-action-primary" disabled={!canPurchase}
                onClick={() => { if (addSelectedProduct()) router.push('/checkout'); else setMessage('All available stock is already in your bag.'); }}>Buy Now</button>
            </div>
            {currentPrice <= 0 && <p className="product-pricing-note"><SupportEmailLink className="product-text-link">Contact us for pricing</SupportEmailLink></p>}
            {(canHome || canPickup) && <p className="product-fulfilment">
              {canHome && canPickup ? 'Home delivery and store pickup available.' : canHome ? 'Home delivery available.' : 'Store pickup available.'}
            </p>}
            <div className="product-accordions">
              <details className="product-accordion">
                <summary>Product details<span aria-hidden="true" /></summary>
                <dl className="product-facts">{facts.filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}</dl>
              </details>
              <details className="product-accordion">
                <summary>Delivery &amp; returns<span aria-hidden="true" /></summary>
                <div className="product-accordion-content">
                  <p>{product.returnsPolicy || 'Contact our team to confirm delivery dates and return eligibility before ordering.'}</p>
                  <p>For delivery enquiries, <SupportEmailLink className="product-text-link">email us</SupportEmailLink>.</p>
                </div>
              </details>
              <details className="product-accordion">
                <summary>Need assistance?<span aria-hidden="true" /></summary>
                <div className="product-accordion-content">
                  <p>For sizing, fit or product questions, speak to our team.</p>
                  <div className="product-contact-links">
                    <a className="product-text-link" href="tel:+919999313366">+91 99993 13366</a>
                    <SupportEmailLink className="product-text-link">Email us</SupportEmailLink>
                    <a className="product-text-link" href={`https://wa.me/919999313366?text=${encodeURIComponent(`Hello, I have a question about ${product.title}.`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  </div>
                </div>
              </details>
            </div>
            <p className="product-colour-note">Colours may vary slightly depending on your screen.</p>
          </section>
        </div>
        {suggestions.length > 0 && <section className="product-related" aria-labelledby="related-products-title">
          <div className="product-related-heading"><h2 id="related-products-title">You may also like</h2><Link href="/shop" className="product-text-link">View all</Link></div>
          <div className="product-related-grid">
            {suggestions.map((item) => <Link key={item.id} href={`/products/${item.id}`} className="product-related-card">
              <div className="product-related-image"><img src={item.imageFront} alt={item.title} loading="lazy" /></div>
              <h3>{item.title}</h3><p>{formatPrice(item.salePrice && item.salePrice < item.price ? item.salePrice : item.price)}</p>
            </Link>)}
          </div>
        </section>}
      </div>
      {modal && <dialog ref={dialogRef} className={`product-dialog product-dialog-${modal}`} aria-labelledby="product-dialog-title"
        onClose={() => setModal(null)} onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}
        onKeyDown={(event) => {
          if (modal !== 'image' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          setActiveImageIndex((index) => (index + (event.key === 'ArrowRight' ? 1 : -1) + galleryImages.length) % galleryImages.length);
        }}>
        <div className="product-dialog-panel">
          <div className="product-dialog-header">
            <h2 id="product-dialog-title">{modal === 'image' ? product.title : 'Size & fit'}</h2>
            <button type="button" className="product-dialog-close" aria-label="Close" onClick={() => setModal(null)}><CloseIcon /></button>
          </div>
          {modal === 'image' ? <>
            <img className="product-enlarged-image" src={activeImage} alt={`${product.title}, view ${activeImageIndex + 1}`} />
            {galleryImages.length > 1 && <div className="product-dialog-pagination">
              <button type="button" onClick={() => setActiveImageIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length)}>Previous</button>
              <span>{activeImageIndex + 1} / {galleryImages.length}</span>
              <button type="button" onClick={() => setActiveImageIndex((index) => (index + 1) % galleryImages.length)}>Next</button>
            </div>}
          </> : <div className="product-fit-content">
            <p>{product.title}</p>
            <dl className="product-facts">
              <div><dt>Sizes</dt><dd>{activeVariant.sizes.join(', ') || 'Contact us for availability'}</dd></div>
              {product.measurements && <div><dt>Measurements</dt><dd>{product.measurements}</dd></div>}
            </dl>
            <p>For help choosing a size or arranging a fitting, <SupportEmailLink className="product-text-link">contact our team</SupportEmailLink>.</p>
          </div>}
        </div>
      </dialog>}
      <div className="product-status" role="status" aria-live="polite">
        {message && <p>{message} {message === 'Added to your bag.' && <Link href="/cart">View bag</Link>}</p>}
      </div>
    </div>
  );
}
