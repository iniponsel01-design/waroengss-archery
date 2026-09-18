# Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (atau PostgreSQL lokal)
- Google Cloud project dengan Drive API enabled
- Vercel CLI: `npm install -g vercel`

---

## 1. Clone & Install

```bash
git clone https://github.com/holisahmad/waroengss-archery.git
cd waroengss-archery
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` diperlukan karena beberapa package memiliki peer dependency conflict.

---

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` — lihat [ENVIRONMENT.md](./ENVIRONMENT.md) untuk detail setiap variabel.

### Format DATABASE_URL yang Benar

Jika password mengandung karakter `@`, karakter tersebut **wajib** di-encode sebagai `%40`:

```bash
# SALAH — akan gagal terkoneksi
DATABASE_URL="postgresql://user:pass@word@@host:6543/db"

# BENAR — @ dalam password di-encode
DATABASE_URL="postgresql://user:pass%40word@host:6543/db"
```

Contoh format lengkap Supabase:
```
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## 3. Database Setup

### Menggunakan Supabase (direkomendasikan)

1. Buat project di [supabase.com](https://supabase.com)
2. Pergi ke **Settings → Database → Connection string**
3. Copy connection string mode **Transaction** (port 6543) untuk `DATABASE_URL`
4. Copy connection string mode **Session** (port 5432) untuk `DIRECT_URL`

```bash
# Push schema ke database
npm run db:push

# Seed data awal
npm run db:seed
```

### Menggunakan PostgreSQL lokal

```bash
createdb waroengss_archery

# Set di .env.local
DATABASE_URL="postgresql://localhost:5432/waroengss_archery"
DIRECT_URL="postgresql://localhost:5432/waroengss_archery"

npm run db:push
npm run db:seed
```

---

## 4. Google Drive Setup

Lihat [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) untuk panduan lengkap setup Google Cloud, service account, dan sharing folder.

Singkatnya:
1. Buat Service Account di Google Cloud Console
2. Enable Google Drive API
3. Download JSON key → simpan sebagai `service-account.json` di root project
4. Share folder Google Drive ke email service account
5. Set `GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json` di `.env.local`

> Di production (Vercel), gunakan `GOOGLE_SERVICE_ACCOUNT_JSON` berisi isi file JSON sebagai satu baris.

---

## 5. Jalankan Development

```bash
npm run dev
```

- App: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Prisma Studio: `npm run db:studio`

---

## 6. Login Admin

Seed sudah membuat admin default:
- Email: `admin@waroengss.com`
- Password: `admin123456`

> ⚠️ Ganti password ini segera setelah login pertama!

---

## 7. Buat Event Pertama

1. Login ke admin panel
2. Buka **Events → Buat Event**
3. Isi detail event dan publish
4. Tambah hari (Days) dan album
5. Isi Drive Folder ID untuk setiap album
6. Jalankan Sync dari menu **Drive → Sync**
