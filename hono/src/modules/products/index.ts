import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { products, categories } from '../../db/schema/index.js';
import { eq, or } from 'drizzle-orm';

export const productsModule = new Hono();

// List all active products
productsModule.get('/', async (c) => {
  try {
    const allProducts = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        price: products.price,
        salePrice: products.salePrice,
        stock: products.stock,
        sku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.name,
        isActive: products.isActive,
        imageFront: products.imageFront,
        imageDetail: products.imageDetail,
        color: products.color,
        colorHex: products.colorHex,
        craft: products.craft,
        badge: products.badge,
        sizes: products.sizes,
        inStockSizes: products.inStockSizes,
        readyToShip: products.readyToShip,
        editorialStory: products.editorialStory,
        styleNumber: products.styleNumber,
        measurements: products.measurements,
        fabricContent: products.fabricContent,
        componentsCount: products.componentsCount,
        setIncludes: products.setIncludes,
        washCare: products.washCare,
        countryOfOrigin: products.countryOfOrigin,
        manufacturerAddress: products.manufacturerAddress,
        returnsPolicy: products.returnsPolicy,
        disclaimer: products.disclaimer,
        deliveryMethod: products.deliveryMethod,
        colorVariants: products.colorVariants,
        gallery: products.gallery,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true));

    return c.json({ success: true, data: allProducts });
  } catch (error: any) {
    return c.json({ success: true, data: [], note: 'Database ready for migration' });
  }
});

// Get single product by ID or Slug or SKU
productsModule.get('/:identifier', async (c) => {
  const identifier = c.req.param('identifier');
  const numericId = Number(identifier);

  try {
    const query = db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        price: products.price,
        salePrice: products.salePrice,
        stock: products.stock,
        sku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.name,
        isActive: products.isActive,
        imageFront: products.imageFront,
        imageDetail: products.imageDetail,
        color: products.color,
        colorHex: products.colorHex,
        craft: products.craft,
        badge: products.badge,
        sizes: products.sizes,
        inStockSizes: products.inStockSizes,
        readyToShip: products.readyToShip,
        editorialStory: products.editorialStory,
        styleNumber: products.styleNumber,
        measurements: products.measurements,
        fabricContent: products.fabricContent,
        componentsCount: products.componentsCount,
        setIncludes: products.setIncludes,
        washCare: products.washCare,
        countryOfOrigin: products.countryOfOrigin,
        manufacturerAddress: products.manufacturerAddress,
        returnsPolicy: products.returnsPolicy,
        disclaimer: products.disclaimer,
        deliveryMethod: products.deliveryMethod,
        colorVariants: products.colorVariants,
        gallery: products.gallery,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

    let rows;
    if (!isNaN(numericId)) {
      if (numericId === 102) {
        // Support legacy/demo product 102 mapping to MM-SHR-102 or ID 102
        rows = await query.where(or(eq(products.id, 102), eq(products.sku, 'MM-SHR-102'))).limit(1);
      } else {
        rows = await query.where(eq(products.id, numericId)).limit(1);
      }
    } else {
      rows = await query.where(or(eq(products.slug, identifier), eq(products.sku, identifier))).limit(1);
    }

    if (!rows || rows.length === 0) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    return c.json({ success: true, data: rows[0] });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
