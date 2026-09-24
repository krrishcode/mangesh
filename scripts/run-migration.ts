import mysql from 'mysql2/promise';

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'srv2218.hstgr.io',
    user: 'u770723413_mangeshmahadev',
    password: '1Igk#Wu/M',
    database: 'u770723413_mangeshmahadev'
  });

  const queries = [
    "ALTER TABLE users ADD COLUMN phone varchar(32) NULL;",
    `CREATE TABLE addresses (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, user_id int NOT NULL, label enum('shipping','billing') NOT NULL DEFAULT 'shipping', is_default boolean NOT NULL DEFAULT false, full_name varchar(255) NOT NULL, phone varchar(32) NOT NULL, line1 varchar(255) NOT NULL, line2 varchar(255), city varchar(128) NOT NULL, state varchar(128) NOT NULL, postal_code varchar(16) NOT NULL, country varchar(128) NOT NULL DEFAULT 'India', created_at timestamp NOT NULL DEFAULT (now()));`,
    `CREATE TABLE appointments (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, user_id int NOT NULL, location varchar(255) NOT NULL, occasion varchar(255) NOT NULL, scheduled_at timestamp NOT NULL, status enum('upcoming','completed','cancelled') NOT NULL DEFAULT 'upcoming', notes text, created_at timestamp NOT NULL DEFAULT (now()), updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP);`,
    `CREATE TABLE order_items (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, order_id int NOT NULL, product_id int, title varchar(255) NOT NULL, quantity int NOT NULL DEFAULT 1, price decimal(10,2) NOT NULL);`,
    `CREATE TABLE password_reset_tokens (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, user_id int NOT NULL, token_hash varchar(255) NOT NULL UNIQUE, expires_at timestamp NOT NULL, used_at timestamp, created_at timestamp NOT NULL DEFAULT (now()));`,
    `CREATE TABLE user_measurements (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, user_id int NOT NULL UNIQUE, chest decimal(5,2), waist decimal(5,2), hip decimal(5,2), shoulder decimal(5,2), sleeve_length decimal(5,2), inseam decimal(5,2), unit enum('inches','cm') NOT NULL DEFAULT 'inches', updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP);`,
    `CREATE TABLE wishlist_items (id int AUTO_INCREMENT NOT NULL PRIMARY KEY, user_id int NOT NULL, product_id int NOT NULL, created_at timestamp NOT NULL DEFAULT (now()));`
  ];

  for (const q of queries) {
    try {
      await conn.query(q);
      console.log('OK:', q.slice(0, 50));
    } catch (err: any) {
      if (!err.message.includes('Duplicate') && !err.message.includes('already exists')) {
        console.error('Failed:', q.slice(0, 50), err.message);
      } else {
        console.log('Skipped duplicate');
      }
    }
  }

  await conn.end();
}

migrate();
