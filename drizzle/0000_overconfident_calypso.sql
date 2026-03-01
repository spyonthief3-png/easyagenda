CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blackouts` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`period_id` integer,
	`room_id` text,
	`reason` text NOT NULL,
	`block_id` text,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`period_id` integer NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'CONFIRMED' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issue_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`patrimony_number` text,
	`description` text NOT NULL,
	`photo_url` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`resolution_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`resolved_at` text,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location_id` text NOT NULL,
	`room_type_id` text NOT NULL,
	`capacity` integer NOT NULL,
	`resources` text NOT NULL,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`photo_url` text,
	`password_hash` text,
	`role` text DEFAULT 'USER' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);