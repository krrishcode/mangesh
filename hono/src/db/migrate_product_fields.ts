import { connectionPool } from './index.js';

export async function migrateProductFields() {
  console.log('Adding extended couture product fields to products table...');
  const conn = await connectionPool.getConnection();
  try {
    const fields = [
      { name: 'image_front', type: 'TEXT' },
      { name: 'image_detail', type: 'TEXT' },
      { name: 'color', type: 'VARCHAR(100)' },
      { name: 'color_hex', type: 'VARCHAR(50)' },
      { name: 'craft', type: 'TEXT' },
      { name: 'badge', type: 'VARCHAR(100)' },
      { name: 'sizes', type: 'TEXT' },
      { name: 'in_stock_sizes', type: 'TEXT' },
      { name: 'ready_to_ship', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'editorial_story', type: 'TEXT' },
      { name: 'style_number', type: 'VARCHAR(100)' },
      { name: 'measurements', type: 'TEXT' },
      { name: 'fabric_content', type: 'TEXT' },
      { name: 'components_count', type: 'INT DEFAULT 1' },
      { name: 'set_includes', type: 'TEXT' },
      { name: 'wash_care', type: 'VARCHAR(255)' },
      { name: 'country_of_origin', type: "VARCHAR(100) DEFAULT 'India'" },
      { name: 'manufacturer_address', type: 'TEXT' },
      { name: 'returns_policy', type: 'TEXT' },
      { name: 'disclaimer', type: 'TEXT' },
      { name: 'delivery_method', type: "VARCHAR(50) DEFAULT 'both'" },
      { name: 'color_variants', type: 'TEXT' },
      { name: 'gallery', type: 'TEXT' },
    ];

    for (const f of fields) {
      const [rows]: any = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
        [f.name]
      );
      if (rows.length === 0) {
        console.log(`Adding column: ${f.name}`);
        await conn.query(`ALTER TABLE products ADD COLUMN \`${f.name}\` ${f.type}`);
      } else {
        console.log(`Column ${f.name} already exists.`);
      }
    }
    console.log('Migration completed successfully!');
  } finally {
    conn.release();
  }
}

migrateProductFields().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
