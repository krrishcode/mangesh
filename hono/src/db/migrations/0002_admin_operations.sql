CREATE TABLE `designers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `designers_id` PRIMARY KEY(`id`),
  CONSTRAINT `designers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `collections_id` PRIMARY KEY(`id`),
  CONSTRAINT `collections_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `media` (
  `id` int AUTO_INCREMENT NOT NULL,
  `url` varchar(1000) NOT NULL,
  `alt_text` varchar(255),
  `kind` enum('image','video','document') NOT NULL DEFAULT 'image',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int,
  `rating` int NOT NULL,
  `title` varchar(255),
  `body` text,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `order_id` int NOT NULL,
  `provider` varchar(64) NOT NULL,
  `reference` varchar(255),
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `order_id` int NOT NULL,
  `carrier` varchar(128),
  `tracking_number` varchar(255),
  `status` enum('pending','label_created','in_transit','delivered') NOT NULL DEFAULT 'pending',
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `setting_key` varchar(128) NOT NULL,
  `value` text,
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `admin_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `admin_settings_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `actor_id` int NOT NULL,
  `action` varchar(128) NOT NULL,
  `entity_type` varchar(64) NOT NULL,
  `entity_id` int,
  `details` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
