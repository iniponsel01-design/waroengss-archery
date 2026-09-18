# Environment Variables

Semua environment variables didefinisikan di `.env.local` (development) atau Vercel Environment Variables (production).

**Jangan pernah commit `.env.local` atau `service-account.json` ke Git.**

---

## File Environment

| File | Digunakan oleh | Keterangan |
|------|----------------|------------|
| `.env.local` | Next.js (dev & build) | Semua variabel app |
| `.env` | Prisma CLI saja | Hanya `DATABASE_URL` dan `DIRECT_URL` |

> Prisma CLI (`db:push`, `db:seed`, `db:studio`) membaca `.env`, bukan `.env.local`. Karena itu kedua file harus ada dan nilainya sinkron.

---

## Required Variables

### Database

| Variable | Deskripsi | Port |
|----------|-----------|------|
| `DATABASE_URL` | Connection string pooled (untuk runtime app) | 6543 |
| `DIRECT_URL` | Connection string direct (untuk Prisma migrate) | 5432 |

Format Supabase:
```
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

> **Karakter khusus di password:** Jika password mengandung `@`, encode menjadi `%40`. Karakter lain yang perlu di-encode: `#` → `%23`, `%` → `%25`, `?` → `%3F`.

### Authentication

| Variable | Deskripsi |
|----------|-----------|
| `JWT_SECRET` | Secret untuk signing JWT session token |

Generate JWT_SECRET:
```bash
openssl rand -base64 64
```

---

## Google Drive Variables

| Variable | Digunakan di | Deskripsi |
|----------|-------------|-----------|
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Development | Path ke file JSON key, default: `./service-account.json` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Production (Vercel) | Isi file JSON sebagai string satu baris |

Cara membuat nilai `GOOGLE_SERVICE_ACCOUNT_JSON` untuk Vercel:
```bash
# macOS/Linux — output satu baris tanpa whitespace
cat service-account.json | tr -d '\n'
```

Paste hasil output tersebut sebagai nilai environment variable di Vercel.

---

## Public Variables (NEXT_PUBLIC_*)

Variabel dengan prefix `NEXT_PUBLIC_` akan tersedia di browser (client-side).

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL lengkap aplikasi |
| `NEXT_PUBLIC_APP_NAME` | `Waroeng SS Archery Gallery` | Nama aplikasi (dipakai di metadata) |
| `NEXT_PUBLIC_BRAND_NAME` | `Waroeng SS Archery` | Nama brand (dipakai di header/footer) |

Di production, `NEXT_PUBLIC_APP_URL` harus diisi dengan URL Vercel yang aktif:
```
NEXT_PUBLIC_APP_URL=https://waroengss-archery.vercel.app
```

---

## Optional Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `NODE_ENV` | `development` | Set ke `production` di Vercel |
| `ADMIN_SETUP_TOKEN` | — | Token untuk membuat admin pertama via API |

---

## Template `.env.local`

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.REF:PASS%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.REF:PASS%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Auth
JWT_SECRET="ganti-dengan-secret-yang-kuat"

# Google Drive (development — pakai file)
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Waroeng SS Archery Gallery"
NEXT_PUBLIC_BRAND_NAME="Waroeng SS Archery"
```

## Template `.env` (untuk Prisma CLI)

```bash
# Sama dengan .env.local, hanya bagian database
DATABASE_URL="postgresql://postgres.REF:PASS%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.REF:PASS%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## Set di Vercel

Via dashboard:
1. Buka Vercel → Project → **Settings → Environment Variables**
2. Klik **Add New**
3. Isi Key, Value, pilih environment (Production / Preview / Development)
4. Klik **Save**
5. **Redeploy** agar perubahan aktif

Via CLI:
```bash
echo "nilai" | vercel env add NAMA_VARIABEL production --token <token>
```
