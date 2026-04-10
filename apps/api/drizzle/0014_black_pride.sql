ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_reservations' BEFORE 'edit_reservations';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_services' BEFORE 'edit_services';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_tariffs' BEFORE 'edit_tariffs';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_rooms' BEFORE 'edit_rooms';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_tasks';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_tasks';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_projects';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_projects';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_time_entries';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_time_entries';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'create_labels';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_labels';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'import_issues';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_github_integration';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'manage_notifications';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'edit_comments';--> statement-breakpoint
ALTER TABLE "scheduled_permission" DROP COLUMN "is_active";