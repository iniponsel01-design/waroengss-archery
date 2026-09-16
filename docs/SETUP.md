# Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (atau PostgreSQL lokal)
- Google Cloud project dengan Drive API enabled

---

## 1. Clone & Install

```bash
git clone https://github.com/cakholissambal-stack/waroengss-archery.git
cd waroengss-archery
npm install
```

---

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` — lihat [ENVIRONMENT.md](./ENVIRONMENT.md) untuk detail setiap variabel.

---

## 3. Database Setup

### Menggunakan Supabase (direkomendasikan)

1. Buat project di [supabase.com](https://supabase.com)
2. Pergi ke **Settings → Database → Connection string**
3. Copy connection string mode **Transaction** untuk `DATABASE_URL`
4. Copy connection string mode **Session** untuk `DIRECT_URL`

```bash
# Push schema ke database
npm run db:push

# Seed data development
npm run db:seed
```

### Menggunakan PostgreSQL lokal

```bash
# Buat database
createdb waroengss_archery

# Set di .env.local
DATABASE_URL="postgresql://localhost:5432/waroengss_archery"
DIRECT_URL="postgresql://localhost:5432/waroengss_archery"

npm run db:push
npm run db:seed
```

---

## 4. Google Drive Setup

Lihat [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) untuk panduan lengkap.

Singkatnya:
1. Buat Service Account di Google Cloud Console
2. Enable Google Drive API
3. Download JSON key
4. Share folder Google Drive ke email service account
5. Set `GOOGLE_SERVICE_ACCOUNT_JSON` di environment

---

## 5. Jalankan Development

```bash
npm run dev
```

- App: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Prisma Studio: `npm run db:studio`

---

## 6. Buat Admin Pertama

Seed sudah membuat admin default:
- Email: `admin@waroengss.com`
- Password: `admin123456`

> ⚠️ Ganti password ini segera!

Untuk membuat admin baru via API (dengan setup token):
```bash
curl -X POST http://localhost:3000/api/admin/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "name": "Your Name",
    "password": "strongpassword",
    "setupToken": "your-setup-token"
  }'
```

---

## 7. Buat Event Pertama

1. Login ke admin panel
2. Buka **Events → Buat Event**
3. Isi detail event dan publish
4. Tambah hari (Days) dan album
5. Isi Drive Folder ID untuk setiap album
6. Jalankan Sync dari menu **Drive → Sync**
