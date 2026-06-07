ALTER TABLE "survey_rating" RENAME COLUMN "excelente" TO "excellent";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "bueno" TO "good";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "regular" TO "average";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "malo" TO "bad";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "vacias" TO "empty";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "aplicadas" TO "applied";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "contestadas" TO "answered";--> statement-breakpoint
ALTER TABLE "survey_rating" RENAME COLUMN "tabulacion" TO "score";--> statement-breakpoint
ALTER TABLE "survey" RENAME COLUMN "total_aplicadas" TO "total_applied";--> statement-breakpoint
ALTER TABLE "survey" RENAME COLUMN "total_contestadas" TO "total_answered";--> statement-breakpoint
ALTER TABLE "survey" RENAME COLUMN "overall_muy_bueno" TO "overall_very_good";--> statement-breakpoint
ALTER TABLE "survey" RENAME COLUMN "overall_bueno" TO "overall_good";--> statement-breakpoint
ALTER TABLE "survey" RENAME COLUMN "overall_no_respondio" TO "overall_no_answer";