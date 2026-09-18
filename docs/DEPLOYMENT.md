# Deployment Guide

## Overview

```
Local Build (macOS) → .vercel/output/ → vercel deploy --prebuilt → Vercel (Linux)
                                          ↑
                              GitHub push (holisahmad + iniponsel01-design fork)
```

Deployment dilakukan secara **manual** dengan build lokal terlebih dahulu, kemudian upload prebuilt output ke Vercel. Cara ini dipilih untuk menghindari masalah path yang muncul saat deploy langsung dari source.

Untuk setup Vercel dari awal (akun baru, project baru), lihat [VERCEL_SETUP.md](./VERCEL_SETUP.md).

---

## Repositories

| Repo | URL | Fungsi |
|------|-----|--------|
| Primary | `https://github.com/holisahmad/waroengss-archery` | Source of truth |
| Fork (Vercel) | `https://github.com/iniponsel01-design/waroengss-archery` | Terhubung ke akun Vercel |

Push ke keduanya setelah setiap perubahan:

```bash
# Push ke primary repo
git push origin main

# Push ke fork (Vercel account)
git push https://TOKEN@github.com/iniponsel01-design/waroengss-archery.git main --force
```

---

## Vercel Project

| Property | Value |
|----------|-------|
| Project ID | `prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD` |
| Team | `waroengss-archery` (team_Qv9jFpl5WIx6OR3uiCwnv1YO) |
| Production URL | https://waroengss-archery.vercel.app |
| Account | `iniponsel01-design` |

---

## Alur Deploy

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

> **Penting:** Jika password database mengandung `@`, encode menjadi `%40` di URL. Contoh: `pass@word` → `pass%40word`. Tanpa encoding ini Prisma tidak bisa terkoneksi.

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

Package-package berikut harus ada di `dependencies` (bukan `devDependencies`) agar tersedia saat `vercel build`:

```json
{
  "dependencies": {
    "prisma": "^5.22.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^20.17.6",
    "@types/bcryptjs": "^2.4.6",
    "@types/js-cookie": "^3.0.6",
    "@types/qrcode": "^1.5.5",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  }
}
```

---

## Proteksi Akses (SSO)

Vercel team bisa mengaktifkan SSO protection yang membuat deployment URL hanya bisa diakses oleh anggota tim. Jika situs tidak bisa dibuka oleh publik:

1. Buka Vercel → Project → **Settings → Security**
2. Cari **Vercel Authentication**
3. Disable

---

## Post-Deploy Checklist

```
[ ] Build selesai tanpa error
[ ] vercel deploy --prebuilt berhasil (✓ Ready)
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
- Izinkan koneksi dari luar (`Settings → Database → Network → Allow all` atau IP Vercel)

---

## Custom Domain (Opsional)

Di Vercel → Project → **Settings → Domains**:

```
gallery.waroengss.com  →  CNAME  →  cname.vercel-dns.com
```

Setelah domain aktif, update env var `NEXT_PUBLIC_APP_URL` dan redeploy.
