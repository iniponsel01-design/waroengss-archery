# Database

PostgreSQL via Supabase. ORM: Prisma.

---

## Schema Summary

```
admin_users         Admin accounts (email, password_hash, role)
events              Event metadata (slug, title, dates, status)
event_days          Days within an event (day_number, title, date)
albums              Albums within a day (slug, name, drive_folder_id)
media_files         Photo metadata (drive_file_id, urls, dimensions)
featured_media      Cover/featured photos for events
storage_connections Google Drive connection config per event
sync_jobs           Sync history and status
site_settings       Key-value site configuration
audit_logs          Admin action audit trail
```

---

## Commands

```bash
# Generate Prisma client setelah schema berubah
npm run db:generate

# Push schema ke DB tanpa migration file (dev only)
npm run db:push

# Buat migration file baru
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed data development
npm run db:seed

# Buka Prisma Studio GUI
npm run db:studio
```

---

## Indexes

Index penting sudah didefinisikan di schema:

- `events.slug` — public URL lookup
- `events.status` — filter published events
- `media_files.album_id` — gallery pagination
- `media_files.drive_file_id` — sync dedup check
- `sync_jobs.event_id` — sync history per event

---

## Migration Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Buat migration
npm run db:migrate -- --name add_photographer_field

# 3. Prisma otomatis membuat file di prisma/migrations/
# 4. Commit migration file ke Git
# 5. Di production: npm run db:migrate:deploy
```

---

## Reset Database (Development Only)

```bash
npx prisma migrate reset
npm run db:seed
```

⚠️ Ini menghapus semua data. Jangan jalankan di production.
