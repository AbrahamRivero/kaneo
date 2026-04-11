ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_reservations' BEFORE 'create_services';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_services' BEFORE 'create_tariffs';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_tariffs' BEFORE 'create_rooms';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_rooms' BEFORE 'create_tasks';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_tasks' BEFORE 'create_projects';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_projects' BEFORE 'create_time_entries';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_time_entries' BEFORE 'create_labels';--> statement-breakpoint
ALTER TYPE "public"."scheduled_permission_action" ADD VALUE 'delete_labels' BEFORE 'import_issues';