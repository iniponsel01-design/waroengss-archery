-- Migration: tambah index albumId dan albumId+status di sync_jobs
-- Dibutuhkan untuk:
-- 1. Guard duplicate job (findFirst by albumId+status) agar tidak full scan
-- 2. Query riwayat sync per album lebih efisien

CREATE INDEX IF NOT EXISTS "sync_jobs_album_id_idx"
  ON "sync_jobs" ("album_id");

CREATE INDEX IF NOT EXISTS "sync_jobs_album_id_status_idx"
  ON "sync_jobs" ("album_id", "status");
