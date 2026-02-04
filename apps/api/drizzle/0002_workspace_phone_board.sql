ALTER TABLE "workspace" ADD COLUMN "phone_board_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "phone_board_data" jsonb;
