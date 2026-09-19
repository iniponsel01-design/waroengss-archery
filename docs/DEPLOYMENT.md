# Deployment Guide

## Overview

```
Edit kode lokal
      ↓
git push origin main          → github.com/holisahmad/waroengss-archery
      ↓
git push fork main --force    → github.com/iniponsel01-design/waroengss-archery
      ↓
Vercel auto-detect push       → build & deploy otomatis (~3–5 menit)
      ↓
https://waroengss-archery.vercel.app  live
```

Ada dua cara deploy:
- **Auto-deploy** (default): push ke fork → Vercel build otomatis di server
- **Manual (prebuilt)**: build lokal → upload `.vercel/output/` → deploy ~25 detik

Untuk setup Vercel dari awal (akun baru, project baru), lihat [VERCEL_SETUP.md](./VERCEL_SETUP.md).

---

## Repositories

| Repo | URL | Akun | Fungsi |
|------|-----|------|--------|
| Primary | `https://github.com/holisahmad/waroengss-archery` | holisahmad | Source of truth |
| Fork (Vercel) | `https://github.com/iniponsel01-design/waroengss-archery` | iniponsel01-design | Terhubung ke Vercel, trigger auto-deploy |

Untuk setup lengkap GitHub (inisialisasi repo, fork, PAT, remote config), lihat [GITHUB_SETUP.md](./GITHUB_SETUP.md).

---

## Vercel Project

| Property | Value |
|----------|-------|
| Project ID | `prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD` |
| Team | `waroengss-archery` (team_Qv9jFpl5WIx6OR3uiCwnv1YO) |
| Production URL | https://waroengss-archery.vercel.app |
| Account | `iniponsel01-design` (iniponsel01@gmail.com) |
| GitHub connected | `iniponsel01-design/waroengss-archery` branch `main` |

---

## Git Author Config

Commit author **harus** cocok dengan email akun GitHub yang terhubung ke Vercel (`iniponsel01@gmail.com`), jika tidak Vercel menolak deployment dengan error "commit author email is not valid".

Pastikan git config lokal di project sudah benar:

```bash
# Cek config lokal saat ini
git config --local user.email
git config --local user.name

# Set jika belum benar
git config --local user.email "iniponsel01@gmail.com"
git config --local user.name "iniponsel01-design"
```

> Config ini bersifat lokal (hanya berlaku di folder project ini), tidak mengubah config global.

---

## Cara 1 — Auto-Deploy (Recommended)

Push ke fork → Vercel otomatis build dan deploy. Tidak perlu token atau CLI.

```bash
# 1. Commit perubahan
git add .
git commit -m "feat: deskripsi perubahan"

# 2. Push ke primary repo (holisahmad)
git push origin main

# 3. Push ke fork (trigger Vercel auto-deploy)
git push fork main --force
```

Atau pakai script sekaligus:

```bash
bash scripts/sync-repos.sh "feat: deskripsi perubahan"
```

Script ini otomatis commit + push ke `origin` + push ke `fork`.

**Waktu build:** ~3–5 menit (install deps + prisma generate + next build di server Vercel)

Pantau progress di: https://vercel.com/waroengss-archery/waroengss-archery

---

## Cara 2 — Manual Prebuilt (Backup / Deploy Cepat)

Pakai ini jika butuh deploy cepat (~25 detik) atau auto-deploy gagal.

### Langkah 1 — Pastikan `.vercel/project.json` ada

```json
{
  "projectId": "prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD",
  "orgId": "team_Qv9jFpl5WIx6OR3uiCwnv1YO",
  "projectName": "waroengss-archery"
}
```

Jika belum ada, jalankan `vercel link` dan pilih project yang sesuai.

### Langkah 2 — Build lokal

```bash
VERCEL_TOKEN=<token> vercel build --prod --yes
```

Output sukses:
```
✅ Build Completed in .vercel/output [~2m]
```

### Langkah 3 — Deploy prebuilt output

```bash
vercel deploy --prebuilt --prod --token <token>
```

Output sukses:
```
▲ Aliased   https://waroengss-archery.vercel.app
✓ Ready in 21s
```

> Token Vercel: buat di Vercel → Account Settings → Tokens → Create.
> Jika token error 403 (expired), buat token baru dan update di `~/Library/Application Support/com.vercel.cli/auth.json`.

---

## Perbandingan Dua Cara Deploy

| | Auto-Deploy | Manual Prebuilt |
|-|-------------|-----------------|
| Cara | Push ke fork | `vercel build` + `vercel deploy` |
| Waktu | ~3–5 menit | ~2 menit build + ~25 detik deploy |
| Token Vercel | Tidak perlu | Perlu |
| Kapan dipakai | Deploy rutin | Deploy cepat / darurat |

---

## Environment Variables di Vercel

Set melalui Vercel dashboard atau CLI. Semua wajib untuk environment Production:

| Variable | Keterangan |
|----------|------------|
| `DATABASE_URL` | Supabase pooled (port 6543), password `@` di-encode jadi `%40` |
| `DIRECT_URL` | Supabase direct (port 5432), password `@` di-encode jadi `%40` |
| `JWT_SECRET` | Secret JWT, generate: `openssl rand -base64 64` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Isi `service-account.json` sebagai satu baris JSON |
| `NEXT_PUBLIC_APP_URL` | `https://waroengss-archery.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Waroeng SS Archery Gallery` |
| `NEXT_PUBLIC_BRAND_NAME` | `Waroeng SS Archery` |
| `NODE_ENV` | `production` |

> **Penting:** Jika password database mengandung `@`, encode menjadi `%40` di URL. Tanpa ini Prisma tidak bisa terkoneksi.

### Update env var via CLI

```bash
# List semua env vars
vercel env ls --token <token> --scope waroengss-archery

# Tambah env var baru
echo "nilai" | vercel env add NAMA_VAR production --token <token>
```

---

## Prisma — Konfigurasi untuk Vercel

`prisma/schema.prisma` harus menyertakan `binaryTargets` agar Prisma Client berjalan di Linux (Vercel) meski di-generate dari macOS:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Tanpa ini, deployment akan gagal dengan error:
```
Prisma Client was generated for "darwin", but deployment required "rhel-openssl-3.0.x"
```

---

## Dependencies — Catatan Penting

Package-package berikut harus ada di `dependencies` (bukan `devDependencies`) agar tersedia saat Vercel build:

```json
{
  "dependencies": {
    "prisma": "^5.22.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^20.17.6",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  }
}
```

---

## Proteksi Akses (SSO)

Vercel team bisa mengaktifkan SSO protection — hanya member tim yang bisa akses URL. Jika situs tidak bisa dibuka publik:

1. Vercel → Project → **Settings → Security**
2. Cari **Vercel Authentication** → Disable

---

## Post-Deploy Checklist

```
[ ] Build selesai tanpa error (auto atau manual)
[ ] https://waroengss-archery.vercel.app terbuka (HTTP 200)
[ ] Homepage menampilkan daftar event
[ ] Halaman event (/e/[slug]) terbuka tanpa error 500
[ ] Admin login berfungsi (/admin/login)
[ ] Database terhubung (cek via admin dashboard)
[ ] Google Drive sync berjalan
[ ] Foto tampil di gallery
[ ] Download foto berfungsi
[ ] Test di mobile browser
```

---

## Supabase — Hal yang Perlu Diperhatikan

- Free tier Supabase akan **pause** setelah 1 minggu tidak aktif → aktifkan kembali dari dashboard
- Gunakan port **6543** (pooler) untuk `DATABASE_URL` dan port **5432** untuk `DIRECT_URL`
- Izinkan koneksi dari luar: `Settings → Database → Network → Allow all`

---

## Custom Domain

Di Vercel → Project → **Settings → Domains**:

```
archery.waroengss.com  →  CNAME  →  cname.vercel-dns.com
```

Setelah domain aktif:
1. Update env var `NEXT_PUBLIC_APP_URL` ke `https://archery.waroengss.com`
2. Redeploy (auto atau manual)
