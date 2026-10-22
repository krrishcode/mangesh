ALTER TABLE orders MODIFY COLUMN user_id INT NULL;
--> statement-breakpoint
ALTER TABLE order_checkout_details MODIFY COLUMN user_id INT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS guest_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS guest_order_details (
  order_id INT PRIMARY KEY,
  session_hash VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  INDEX guest_session_idx (session_hash)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS google_identities (
  subject VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL UNIQUE
);
