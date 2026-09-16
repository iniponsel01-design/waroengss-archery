# Environment Variables

Semua environment variables didefinisikan di `.env.local` (development) atau Vercel Environment Variables (production).

**Jangan pernah commit `.env.local` ke Git.**

---

## Required Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection (untuk migrasi) | `postgresql://user:pass@host:5432/db` |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret untuk JWT signing | Generate: `openssl rand -base64 64` |

---

## Google Drive Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account credentials sebagai JSON string (production) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Path ke file JSON key (development, default: `./service-account.json`) |

Gunakan salah satu. Di production, selalu gunakan `GOOGLE_SERVICE_ACCOUNT_JSON` sebagai environment variable.

---

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL aplikasi |
| `NEXT_PUBLIC_APP_NAME` | `Waroeng SS Archery Gallery` | Nama aplikasi |
| `NEXT_PUBLIC_BRAND_NAME` | `Waroeng SS Archery` | Nama brand |
| `ADMIN_SETUP_TOKEN` | — | Token untuk membuat admin pertama via API |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |

---

## Cara Set di Vercel

1. Buka Vercel project → **Settings → Environment Variables**
2. Tambahkan setiap variabel
3. Set environment: **Production**, **Preview**, atau keduanya
4. Redeploy setelah menambah variabel baru

---

## .env.example

File `.env.example` sudah tersedia di root project sebagai template. Tidak mengandung nilai sensitif.
