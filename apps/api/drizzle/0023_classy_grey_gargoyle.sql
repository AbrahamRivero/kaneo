CREATE TABLE "survey_category_config" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"survey_id" text NOT NULL,
	"category_config_id" text NOT NULL,
	"excelente" integer DEFAULT 0 NOT NULL,
	"bueno" integer DEFAULT 0 NOT NULL,
	"regular" integer DEFAULT 0 NOT NULL,
	"malo" integer DEFAULT 0 NOT NULL,
	"vacias" integer DEFAULT 0 NOT NULL,
	"aplicadas" integer DEFAULT 0 NOT NULL,
	"contestadas" integer DEFAULT 0 NOT NULL,
	"tabulacion" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"survey_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_aplicadas" integer DEFAULT 0 NOT NULL,
	"total_contestadas" integer DEFAULT 0 NOT NULL,
	"overall_muy_bueno" integer DEFAULT 0 NOT NULL,
	"overall_bueno" integer DEFAULT 0 NOT NULL,
	"overall_no_respondio" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_category_config" ADD CONSTRAINT "survey_category_config_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_rating" ADD CONSTRAINT "survey_rating_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."survey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_rating" ADD CONSTRAINT "survey_rating_category_config_id_survey_category_config_id_fk" FOREIGN KEY ("category_config_id") REFERENCES "public"."survey_category_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_suggestion" ADD CONSTRAINT "survey_suggestion_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."survey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey" ADD CONSTRAINT "survey_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey" ADD CONSTRAINT "survey_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;