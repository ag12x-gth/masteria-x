ALTER TABLE "ai_personas" ADD COLUMN "mcp_server_url" text;--> statement-breakpoint
ALTER TABLE "ai_personas" ADD COLUMN "mcp_server_headers" jsonb;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "mcp_server_url";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "mcp_server_headers";