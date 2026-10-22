CREATE TABLE IF NOT EXISTS order_checkout_details (
  order_id int NOT NULL PRIMARY KEY,
  user_id int NOT NULL,
  request_key varchar(64) NOT NULL UNIQUE,
  request_hash varchar(64) NOT NULL,
  shipping_address text,
  fulfilment enum('home','pickup') NOT NULL,
  payment_method varchar(32) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  shipping_amount decimal(10,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS order_item_variants (
  order_item_id int NOT NULL PRIMARY KEY,
  size varchar(64) NOT NULL,
  color varchar(100) NOT NULL,
  sku varchar(100),
  image_url text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS revoked_sessions (
  token_hash varchar(64) NOT NULL PRIMARY KEY,
  expires_at timestamp NOT NULL
);
