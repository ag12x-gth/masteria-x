-- Primeiro, adicionar colunas como nullable
ALTER TABLE "ai_agent_executions" ALTER COLUMN "chat_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "user_query" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "response" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "request_id" text;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "agent_type" text;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "success" boolean;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "execution_time_ms" integer;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "used_fallback" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "used_cache" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "confidence" numeric(5, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "token_usage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "cost" numeric(10, 6) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ADD COLUMN "error_type" text;--> statement-breakpoint

-- Atualizar registros existentes com valores padrão
UPDATE "ai_agent_executions" SET 
  "request_id" = COALESCE("id", gen_random_uuid()::text),
  "agent_type" = COALESCE("agent_name", 'unknown'),
  "success" = true,
  "execution_time_ms" = 1000,
  "used_fallback" = COALESCE("used_fallback", false),
  "used_cache" = COALESCE("used_cache", false),
  "confidence" = COALESCE("confidence", 0),
  "token_usage" = COALESCE("token_usage", 0),
  "cost" = COALESCE("cost", 0)
WHERE "request_id" IS NULL OR "agent_type" IS NULL OR "success" IS NULL OR "execution_time_ms" IS NULL;--> statement-breakpoint

-- Tornar as colunas NOT NULL
ALTER TABLE "ai_agent_executions" ALTER COLUMN "request_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "agent_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "success" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "execution_time_ms" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "used_fallback" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "used_cache" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "confidence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "token_usage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_executions" ALTER COLUMN "cost" SET NOT NULL;--> statement-breakpoint

-- Remover a coluna antiga
ALTER TABLE "ai_agent_executions" DROP COLUMN "agent_name";