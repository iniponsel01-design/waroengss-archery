-- Migration: tambah processed_files dan current_file ke sync_jobs
-- processed_files: jumlah file yang sudah diproses (untuk progress bar %)
-- current_file   : nama file yang sedang diproses saat ini (untuk display realtime)

ALTER TABLE "sync_jobs"
  ADD COLUMN IF NOT EXISTS "processed_files" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "current_file"    TEXT;
