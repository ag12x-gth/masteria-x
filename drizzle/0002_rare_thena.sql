CREATE TABLE "ai_agent_executions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"tool_name" text,
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"user_query" text NOT NULL,
	"response" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_chat_id_ai_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ai_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lists" ADD CONSTRAINT "contact_lists_name_company_id_unique" UNIQUE("name","company_id");--> statement-breakpoint

-- Custom SQL to delete duplicate tags before adding the unique constraint
DELETE FROM "tags"
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY name, company_id ORDER BY created_at) as rn
        FROM "tags"
    ) t
    WHERE t.rn > 1
);
--> statement-breakpoint

ALTER TABLE "tags" ADD CONSTRAINT "tags_name_company_id_unique" UNIQUE("name","company_id");