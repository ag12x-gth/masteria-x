ALTER TABLE "companies" DROP COLUMN IF EXISTS "mcp_server_url";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "mcp_server_headers";
ALTER TABLE "ai_personas" ADD COLUMN "mcp_server_url" text;
ALTER TABLE "ai_personas" ADD COLUMN "mcp_server_headers" jsonb;
