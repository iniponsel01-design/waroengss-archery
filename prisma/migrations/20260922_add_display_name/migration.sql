-- Migration: add display_name to media_files
-- Jalankan: npx prisma db execute --file prisma/migrations/20260922_add_display_name/migration.sql
-- Atau via Supabase SQL editor

ALTER TABLE "media_files"
  ADD COLUMN IF NOT EXISTS "display_name" TEXT;

CREATE INDEX IF NOT EXISTS "media_files_display_name_idx"
  ON "media_files" ("display_name");
