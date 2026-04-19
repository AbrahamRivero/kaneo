ALTER TABLE "age_group_tariff"
  ADD COLUMN "valid_from" timestamp NOT NULL DEFAULT NOW(),
  ADD COLUMN "valid_to" timestamp;

CREATE TABLE "reservation_age_group_tariff" (
  "id" text PRIMARY KEY,
  "reservation_id" text NOT NULL REFERENCES "reservation" ("id") ON DELETE CASCADE,
  "age_group_tariff_id" text REFERENCES "age_group_tariff" ("id") ON DELETE SET NULL,
  "group_name" text NOT NULL,
  "min_age" integer NOT NULL,
  "max_age" integer,
  "count" integer NOT NULL,
  "unit_price" integer NOT NULL,
  "total_price" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);
