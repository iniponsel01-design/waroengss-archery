-- Migration: tambah AlbumGroup (sub-folder opsional antara EventDay dan Album)
-- Album lama tanpa grup tetap valid (album_group_id nullable)

-- 1. Enum status untuk AlbumGroup
CREATE TYPE "AlbumGroupStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- 2. Tabel album_groups
CREATE TABLE "album_groups" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
  "event_day_id"   TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "description"    TEXT,
  "cover_photo_id" TEXT,
  "sort_order"     INTEGER NOT NULL DEFAULT 0,
  "status"         "AlbumGroupStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "album_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "album_groups_event_day_id_slug_key" UNIQUE ("event_day_id", "slug"),
  CONSTRAINT "album_groups_event_day_id_fkey"
    FOREIGN KEY ("event_day_id") REFERENCES "event_days"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "album_groups_event_day_id_idx" ON "album_groups" ("event_day_id");

-- 3. Tambah kolom album_group_id ke albums (nullable — backward compatible)
ALTER TABLE "albums"
  ADD COLUMN IF NOT EXISTS "album_group_id" TEXT;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_album_group_id_fkey"
    FOREIGN KEY ("album_group_id") REFERENCES "album_groups"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "albums_album_group_id_idx" ON "albums" ("album_group_id");

-- 4. Auto-update updated_at via trigger (sama dengan tabel lain)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "album_groups_updated_at"
  BEFORE UPDATE ON "album_groups"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
