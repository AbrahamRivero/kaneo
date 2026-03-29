-- Create reservation_day_tariff table (new)
CREATE TABLE IF NOT EXISTS "reservation_day_tariff" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"date" text NOT NULL,
	"room_tariff_id" text,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservation_day_tariff_reservation_id_reservation_id_fk'
    ) THEN
        ALTER TABLE "reservation_day_tariff" ADD CONSTRAINT "reservation_day_tariff_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservation_day_tariff_room_tariff_id_room_tariff_id_fk'
    ) THEN
        ALTER TABLE "reservation_day_tariff" ADD CONSTRAINT "reservation_day_tariff_room_tariff_id_room_tariff_id_fk" FOREIGN KEY ("room_tariff_id") REFERENCES "public"."room_tariff"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

-- Check if gastronomic_service was already renamed to service
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastronomic_service') THEN
        ALTER TABLE "gastronomic_service" RENAME TO "service";
    END IF;
END $$;

-- Rename columns in reservation_service if they still exist as old names
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservation_service' AND column_name = 'gastronomic_service_id') THEN
        ALTER TABLE "reservation_service" RENAME COLUMN "gastronomic_service_id" TO "service_id";
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservation_service' AND column_name = 'quantity') THEN
        ALTER TABLE "reservation_service" RENAME COLUMN "quantity" TO "pax";
    END IF;
END $$;

-- Update foreign key reference - drop old if exists, add new
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservation_service_gastronomic_service_id_gastronomic_service_id_fk'
    ) THEN
        ALTER TABLE "reservation_service" DROP CONSTRAINT "reservation_service_gastronomic_service_id_gastronomic_service_id_fk";
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservation_service_service_id_service_id_fk'
    ) THEN
        ALTER TABLE "reservation_service" ADD CONSTRAINT "reservation_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Drop old columns from reservation if they exist
ALTER TABLE "reservation" DROP COLUMN IF EXISTS "adult_pax";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN IF EXISTS "children_pax";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN IF EXISTS "total_pax";
