# Database

PostgreSQL via Supabase. ORM: Prisma.

---

## Supabase Setup (Production)

### 1. Buat Project

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi:
   - **Name**: `waroengss-archery`
   - **Database Password**: buat password yang kuat, **catat**
   - **Region**: Southeast Asia (Singapore) — `ap-southeast-1`
3. Klik **Create new project**, tunggu 1–2 menit

### 2. Ambil Connection String

1. Di sidebar → **Settings → Database**
2. Scroll ke bagian **Connection string**
3. Pilih tab **URI**

Ambil dua string:

| Mode | Tab | Port | Untuk |
|------|-----|------|-------|
| **Transaction** (pooled) | Transaction | 6543 | `DATABASE_URL` (runtime app) |
| **Session** (direct) | Session | 5432 | `DIRECT_URL` (Prisma migrate) |

Format string yang dihasilkan Supabase:
```
postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

> **Jika password mengandung `@`:** encode menjadi `%40`
> Contoh: password `mypass@123` → tulis `mypass%40123` di connection string

Tambahkan parameter untuk `DATABASE_URL`:
```
?pgbouncer=true&connection_limit=1
```

Contoh final:
```
DATABASE_URL="postgresql://postgres.rmhtcxlrcuelxzszavhw:mypass%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.rmhtcxlrcuelxzszavhw:mypass%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### 3. Izinkan Koneksi Eksternal

1. **Settings → Database → Network**
2. Pastikan **"Allow all"** aktif, atau tambahkan IP Vercel

> Free tier Supabase secara default sudah allow external connections.

### 4. Push Schema

Setelah connection string terpasang di `.env` dan `.env.local`:

```bash
npm run db:push
```

Output sukses:
```
✔  Your database is now in sync with your Prisma schema.
```

### 5. Seed Data Awal

```bash
npm run db:seed
```

Ini membuat:
- Admin user default (`admin@waroengss.com` / `admin123456`)
- Site settings default

> ⚠️ Ganti password admin segera setelah login pertama!

### 6. Free Tier — Penting Diketahui

- Project **pause otomatis** setelah **1 minggu** tidak ada aktivitas database
- Untuk mengaktifkan kembali: buka [supabase.com](https://supabase.com) → klik project → klik **Restore project**
- Free tier: 500MB storage, 2 CPU, 1GB RAM

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
banners             Banner iklan per halaman dan posisi
ad_slots            Google AdSense slot configuration
audit_logs          Admin action audit trail
```

---

## Prisma Commands

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

## Konfigurasi Prisma untuk Vercel

`prisma/schema.prisma` harus menyertakan `binaryTargets` agar binary Prisma kompatibel dengan Linux (Vercel):

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
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
# 5. Di production, jalankan:
npm run db:migrate:deploy
```

---

## Reset Database (Development Only)

```bash
npx prisma migrate reset
npm run db:seed
```

⚠️ Ini menghapus **semua data**. Jangan jalankan di production.
