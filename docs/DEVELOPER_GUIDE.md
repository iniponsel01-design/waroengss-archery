# Developer Guide — Waroeng SS Archery Gallery

Panduan lengkap dari nol sampai live, dan cara update project setelahnya.
Dokumen ini adalah **titik masuk utama** untuk developer baru.

---

## Daftar Isi

1. [Stack & Arsitektur](#1-stack--arsitektur)
2. [Akun & Akses yang Dibutuhkan](#2-akun--akses-yang-dibutuhkan)
3. [Setup Lokal dari Nol](#3-setup-lokal-dari-nol)
4. [Setup Supabase](#4-setup-supabase)
5. [Setup Google Drive](#5-setup-google-drive)
6. [Setup GitHub — Dua Repo](#6-setup-github--dua-repo)
7. [Setup Vercel](#7-setup-vercel)
8. [Deploy Pertama ke Production](#8-deploy-pertama-ke-production)
9. [Setup Data Awal (One-time)](#9-setup-data-awal-one-time)
10. [Verifikasi Sistem Live](#10-verifikasi-sistem-live)
11. [Workflow Harian — Update & Redeploy](#11-workflow-harian--update--redeploy)
12. [Konfigurasi Teknis Penting](#12-konfigurasi-teknis-penting)
13. [Scripts Utilitas](#13-scripts-utilitas)

---

## 1. Stack & Arsitektur

```
GitHub ──────────────────────────────────────────────────┐
  holisahmad/waroengss-archery (primary)                 │
  iniponsel01-design/waroengss-archery (fork, Vercel)    │
                                                          ▼
                                                    VERCEL (sin1)
                                                    Next.js 14
                                                    App Router
                                                    /   |   \
                                             ┌─────┘   │   └─────┐
                                             ▼          ▼         ▼
                                         Supabase   Google    Visitor
                                         PostgreSQL   Drive    Browser
                                         (ORM:Prisma) (foto)
```

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Database | PostgreSQL (Supabase), ORM: Prisma |
| Storage foto | Google Drive (via Service Account) |
| Hosting | Vercel (region: Singapore `sin1`) |
| Auth | JWT cookie (bcrypt + jose) |
| UI | Tailwind CSS + Radix UI + Lucide React |
| Foto viewer | PhotoSwipe |

**Prinsip kunci:**
- Foto disimpan di Google Drive, database hanya menyimpan metadata
- Visitor tidak perlu login — semua gallery page publik
- Sync bersifat incremental: Drive → DB (INSERT/UPDATE/SKIP)
- Download foto melalui server (credentials tidak pernah ke browser)

---

## 2. Akun & Akses yang Dibutuhkan

Sebelum mulai, siapkan akses ke:

| Layanan | Akun | Fungsi |
|---------|------|--------|
| GitHub | `holisahmad` | Primary repo (source of truth) |
| GitHub | `iniponsel01-design` | Fork repo, terhubung ke Vercel |
| Vercel | `iniponsel01-design` | Hosting |
| Supabase | — | Database PostgreSQL |
| Google Cloud | — | Drive API + Service Account |

---

## 3. Setup Lokal dari Nol

### Clone & Install

```bash
git clone https://github.com/holisahmad/waroengss-archery.git
cd waroengss-archery
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` wajib karena ada konflik peer dependency di beberapa package.

### Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan nilai yang sesuai (lihat bagian Supabase dan Google Drive di bawah).

Buat juga file `.env` khusus untuk Prisma CLI:

```bash
# .env — hanya berisi database URLs, untuk Prisma CLI
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

> Prisma CLI (`db:push`, `db:seed`, `db:studio`) membaca `.env`, bukan `.env.local`.

### Jalankan Development

```bash
npm run dev
# App: http://localhost:3000
# Admin: http://localhost:3000/admin/login
```

---

## 4. Setup Supabase

### Buat Project

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Name: `waroengss-archery`, Region: **Singapore**, buat password yang kuat
3. Tunggu project aktif (~2 menit)

### Ambil Connection Strings

1. **Settings → Database → Connection string → URI**
2. Salin dua string:

| Untuk | Tab | Port |
|-------|-----|------|
| `DATABASE_URL` | Transaction | 6543 |
| `DIRECT_URL` | Session | 5432 |

**Format dan encode password:**

Jika password mengandung `@`, encode jadi `%40`:
```
# Password: mypass@123
# Tulis di URL: mypass%40123

DATABASE_URL="postgresql://postgres.PROJECT_REF:mypass%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:mypass%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Push Schema & Seed

```bash
npm run db:push    # buat semua tabel di Supabase
npm run db:seed    # buat admin default + site settings
```

Credential admin default: `admin@waroengss.com` / `admin123456`
> ⚠️ Ganti password ini setelah login pertama!

---

## 5. Setup Google Drive

### Buat Google Cloud Project & Service Account

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. **APIs & Services → Library** → cari `Google Drive API` → Enable
3. **APIs & Services → Credentials → Create Credentials → Service Account**
   - Name: `waroengss-gallery`
4. Tab **Keys → Add Key → JSON** → download file
5. Copy ke root project: `cp ~/Downloads/xxx.json ./service-account.json`

Catat email service account: `waroengss-gallery@PROJECT.iam.gserviceaccount.com`

### Set di Environment

**Lokal (development):**
```
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json
```

**Production (Vercel):**
```bash
# Minify JSON jadi satu baris
cat service-account.json | tr -d '\n'
# Paste output sebagai nilai GOOGLE_SERVICE_ACCOUNT_JSON di Vercel
```

### Share Folder Drive

Setiap folder album di Google Drive harus di-share ke email service account:
1. Klik kanan folder → Share
2. Masukkan email service account
3. Role: **Viewer**

### Test Koneksi

```bash
node scripts/test-drive.mjs
```

---

## 6. Setup GitHub — Dua Repo

Proyek menggunakan dua repo karena akun pemilik kode (`holisahmad`) berbeda dengan akun yang terhubung ke Vercel (`iniponsel01-design`).

### Buat Repo Primary (holisahmad)

```bash
# Inisialisasi di folder project
git init
git branch -M main
git remote add origin https://github.com/holisahmad/waroengss-archery.git
git add .
git commit -m "feat: initial commit"
git push -u origin main
```

### Fork ke Akun Vercel

1. Buka `github.com/holisahmad/waroengss-archery`
2. Klik **Fork** → Owner: `iniponsel01-design` → Create fork

### Buat Personal Access Token (PAT) untuk Fork

1. Login GitHub sebagai `iniponsel01-design`
2. Settings → Developer settings → **Personal access tokens → Tokens (classic)**
3. Generate new token → scope: `repo` → Generate
4. Simpan token

### Tambah Remote Fork

```bash
git remote add fork https://ghp_TOKEN@github.com/iniponsel01-design/waroengss-archery.git
```

### Push ke Dua Repo

```bash
# Push ke primary
git push origin main

# Push ke fork
git push fork main --force
```

Atau gunakan script:
```bash
bash scripts/sync-repos.sh
```

---

## 7. Setup Vercel

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login & Link Project

```bash
vercel login
# Pilih akun iniponsel01-design

vercel link
# Scope: waroengss-archery (team)
# Link to existing project: Yes → waroengss-archery
```

Ini membuat `.vercel/project.json`:
```json
{
  "projectId": "prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD",
  "orgId": "team_Qv9jFpl5WIx6OR3uiCwnv1YO",
  "projectName": "waroengss-archery"
}
```

### Konfigurasi Project di Dashboard

**Vercel → Project → Settings → General:**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `.` |
| Build Command | `prisma generate && next build` |
| Install Command | `npm install --legacy-peer-deps` |
| Output Directory | `.next` |
| Node.js Version | 20.x |

> Build command sudah ada di `vercel.json` — tidak perlu diisi manual jika file sudah ter-commit.

### Set Environment Variables

**Vercel → Project → Settings → Environment Variables**, tambahkan semua:

| Key | Environment |
|-----|-------------|
| `DATABASE_URL` | Production |
| `DIRECT_URL` | Production |
| `JWT_SECRET` | Production |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Production |
| `NEXT_PUBLIC_APP_URL` | Production |
| `NEXT_PUBLIC_APP_NAME` | Production |
| `NEXT_PUBLIC_BRAND_NAME` | Production |
| `NODE_ENV` | Production |

### Disable SSO Protection

**Vercel → Project → Settings → Security → Vercel Authentication → Off**

Jika tidak dimatikan, semua pengunjung akan di-redirect ke halaman login Vercel.

---

## 8. Deploy Pertama ke Production

Deploy menggunakan alur **build lokal → upload prebuilt**. Ini untuk menghindari masalah `src/src/` double path jika deploy langsung dari source.

```bash
# Step 1: Build lokal
VERCEL_TOKEN=<token> vercel build --prod --yes
# Output: ✅ Build Completed in .vercel/output [~2m]

# Step 2: Deploy prebuilt output
vercel deploy --prebuilt --prod --token <token>
# Output: ✓ Ready in 21s
#         ▲ Aliased https://waroengss-archery.vercel.app
```

> Token Vercel dibuat di: Dashboard → Settings → Tokens → Create

---

## 9. Setup Data Awal (One-time)

Setelah deploy pertama, setup struktur event di database.

### Jalankan Script Setup Drive

Script ini membuat records Event, EventDay, dan Album di database beserta mapping ke Google Drive folder ID:

```bash
# Pastikan database sudah terisi (db:push + db:seed sudah dijalankan)
node scripts/setup-drive-structure.mjs
```

Script akan membuat:
- 1 Event utama
- 7 EventDay (hari 1–7)
- 40 Album (mapping ke folder Drive masing-masing)

> Script ini **hanya dijalankan sekali** saat setup awal. Jika dijalankan ulang, data duplikat akan dibuat.

### Login ke Admin

1. Buka `https://waroengss-archery.vercel.app/admin/login`
2. Login: `admin@waroengss.com` / `admin123456`
3. **Ganti password segera** di Settings

### Jalankan Sync Foto

1. Admin → **Drive → Sync**
2. Klik **Sync All** atau sync per album
3. Tunggu status `COMPLETED`

### Publish Event

1. Admin → Events → pilih event
2. Ubah Status dari `Draft` ke `Published`
3. Save

---

## 10. Verifikasi Sistem Live

Cek semua komponen berfungsi:

```bash
# Cek halaman-halaman utama
curl -I https://waroengss-archery.vercel.app/           # → 200
curl -I https://waroengss-archery.vercel.app/e/SLUG     # → 200
curl -I https://waroengss-archery.vercel.app/admin/login # → 200
```

Checklist manual:
```
[ ] Homepage tampil daftar event
[ ] Halaman event (/e/slug) terbuka tanpa error 500
[ ] Foto tampil di gallery (setelah sync)
[ ] Download foto berfungsi
[ ] Admin login berhasil
[ ] Drive → Connections → test connection: OK
[ ] QR Code bisa dibuat dan di-scan
[ ] Test di mobile browser
[ ] SEO meta tags muncul saat share ke WhatsApp/Instagram
```

---

## 11. Workflow Harian — Update & Redeploy

### Untuk Update Kode (fitur baru / bugfix)

```bash
# 1. Buat perubahan di kode
# 2. Test lokal
npm run dev

# 3. Typecheck (TS errors tidak stop build di Vercel, tapi tetap cek)
npm run typecheck

# 4. Commit
git add .
git commit -m "feat: deskripsi perubahan"

# 5. Push ke kedua repo
git push origin main
git push fork main --force
# atau: bash scripts/sync-repos.sh

# 6. Build lokal
VERCEL_TOKEN=<token> vercel build --prod --yes

# 7. Deploy
vercel deploy --prebuilt --prod --token <token>
```

### Untuk Update Schema Database

```bash
# 1. Edit prisma/schema.prisma

# 2. Buat migration
npm run db:migrate -- --name nama_perubahan

# 3. Commit migration file
git add prisma/migrations/
git commit -m "db: add migration nama_perubahan"

# 4. Deploy migration ke production
npm run db:migrate:deploy

# 5. Deploy kode baru (langkah 5–7 di atas)
```

### Untuk Update Environment Variables

```bash
# Via CLI
echo "nilai_baru" | vercel env add NAMA_VAR production --token <token>

# Lalu redeploy agar env var baru aktif
VERCEL_TOKEN=<token> vercel build --prod --yes
vercel deploy --prebuilt --prod --token <token>
```

### Untuk Sync Foto Baru (tanpa deploy ulang)

Cukup login ke admin panel dan jalankan Sync. Tidak perlu deploy ulang — sync berjalan di server saat itu juga.

```
Admin → Drive → Sync → pilih album → Sync
```

### Untuk Update Banner / Iklan

Cukup lewat admin panel — tidak perlu deploy:
```
Admin → Appearance → Banners  (tambah/edit/hapus banner)
Admin → Appearance → Ads      (konfigurasi Google AdSense slot)
Admin → Appearance → Branding (warna, logo, social links)
```

---

## 12. Konfigurasi Teknis Penting

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": ".next",
  "regions": ["sin1"]
}
```

- `regions: ["sin1"]` = Singapore — dekat dengan pengguna Indonesia, latensi rendah
- `buildCommand` menjalankan `prisma generate` dulu — Prisma Client harus di-generate sebelum build
- `installCommand` pakai `--legacy-peer-deps` untuk resolve konflik dependency

### next.config.mjs

```javascript
typescript: { ignoreBuildErrors: true }   // TS error tidak stop build (workaround SIGSEGV di Vercel)
eslint: { ignoreDuringBuilds: true }       // ESLint error tidak stop build
images.remotePatterns: ["drive.google.com", "*.googleusercontent.com"]
experimental.serverComponentsExternalPackages: ["@prisma/client", "prisma"]
```

> TypeScript skip bukan berarti error diabaikan. Jalankan `npm run typecheck` secara manual sebelum deploy.

### prisma/schema.prisma — binaryTargets

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

- `native` = untuk macOS lokal (development)
- `rhel-openssl-3.0.x` = untuk Vercel/Linux (production)
- Tanpa `rhel-openssl-3.0.x`, deployment akan error: `Prisma Client was generated for "darwin"`

### Force Dynamic Pages

Dua halaman ini menggunakan `export const dynamic = "force-dynamic"` karena membaca `searchParams` (query string) saat render:

- `src/app/admin/login/page.tsx` — membaca param `?redirect=`
- `src/app/e/[eventSlug]/search/page.tsx` — membaca param `?q=&day=&album=`

Tanpa ini, Next.js akan coba pre-render statis dan error saat build.

### Dependencies di `dependencies` (bukan `devDependencies`)

Package-package berikut sengaja di `dependencies` agar tersedia saat `vercel build`:
- `prisma`, `@types/react`, `@types/react-dom`, `@types/node`, TypeScript types lainnya
- `typescript`, `tailwindcss`, `postcss`, `autoprefixer`

---

## 13. Scripts Utilitas

Semua script ada di folder `scripts/`:

| Script | Cara Jalankan | Fungsi | Kapan Dipakai |
|--------|--------------|--------|---------------|
| `setup-drive-structure.mjs` | `node scripts/setup-drive-structure.mjs` | Buat Event + Days + Albums di DB dengan mapping Drive folder ID | **Sekali saat setup awal** |
| `sync-repos.sh` | `bash scripts/sync-repos.sh` | Push ke `origin` dan `fork` sekaligus | Setiap kali push ke GitHub |
| `test-drive.mjs` | `node scripts/test-drive.mjs` | Test koneksi Google Drive API | Debugging koneksi Drive |
| `generate-icons.mjs` | `node scripts/generate-icons.mjs` | Generate PWA icons dari SVG | Saat ganti logo/ikon app |
| `check-deploy.py` | `python3 scripts/check-deploy.py` | Cek status deployment Vercel terbaru | Debugging deployment |
| `get-build-logs.py` | `python3 scripts/get-build-logs.py` | Ambil build logs dari Vercel | Debugging build error |
| `vercel-connect.py` | `python3 scripts/vercel-connect.py` | Hubungkan GitHub fork ke Vercel | Setup awal Vercel |
| `vercel-deploy-api.py` | `python3 scripts/vercel-deploy-api.py` | Deploy via REST API (tanpa CLI) | Backup deploy method |
| `vercel-reset.py` | `python3 scripts/vercel-reset.py` | ⚠️ Reset project Vercel dari awal | Hanya jika project korup |

> Script Python membaca Vercel token dari `~/Library/Application Support/com.vercel.cli/auth.json`.

---

## Referensi Dokumen

| Dokumen | Isi |
|---------|-----|
| [SETUP.md](./SETUP.md) | Setup lokal singkat |
| [DATABASE.md](./DATABASE.md) | Supabase setup + Prisma commands |
| [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) | Google Cloud + Drive setup lengkap |
| [GITHUB_SETUP.md](./GITHUB_SETUP.md) | GitHub dua repo + PAT + fork |
| [VERCEL_SETUP.md](./VERCEL_SETUP.md) | Vercel setup + deploy commands |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Alur deploy + konfigurasi Vercel |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Semua environment variables |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem + data flow |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Panduan admin panel |
| [API.md](./API.md) | API endpoints reference |
| [SECURITY.md](./SECURITY.md) | Security practices |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Error umum + solusi |
