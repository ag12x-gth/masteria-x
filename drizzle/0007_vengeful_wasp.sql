ALTER TABLE "conversations" ADD COLUMN "ai_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_leads" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "kanban_leads" ADD COLUMN "notes" text;