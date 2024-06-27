CREATE TABLE `media_directories` (
	`id` integer PRIMARY KEY NOT NULL,
	`path` text,
	`created_at` integer,
	`updated_at` integer,
	`last_scanned_at` integer,
	`scan_frequency` integer
);
