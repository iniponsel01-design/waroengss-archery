# Troubleshooting

## Deploy ke Vercel

### Error: `prisma: command not found` saat `vercel build`

**Penyebab:** `prisma` ada di `devDependencies`, Vercel tidak install dev deps.

**Solusi:** Pastikan `prisma` ada di `dependencies` di `package.json`:
```json
{
  "dependencies": {
    "prisma": "^5.22.0"
  }
}
```

---

### Error: `It looks like you're trying to use TypeScript but do not have @types/react`

**Penyebab:** TypeScript type packages ada di `devDependencies`.

**Solusi:** Pindahkan ke `dependencies`:
```json
{
  "dependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^20.17.6",
    "typescript": "^5.6.3"
  }
}
```

---

### Error: `Prisma Client was generated for "darwin", but deployment required "rhel-openssl-3.0.x"`

**Penyebab:** Build dilakukan di macOS, tapi Vercel jalan di Linux. Prisma binary tidak kompatibel.

**Solusi:** Tambahkan `binaryTargets` di `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Lalu rebuild:
```bash
npm run db:generate
vercel build --prod --yes
vercel deploy --prebuilt --prod --token <token>
```

---

### Deployment URL redirect ke Vercel login

**Penyebab:** SSO protection aktif di Vercel team/project — hanya member tim yang bisa akses.

**Solusi:**
1. Buka Vercel → Project → **Settings → Security**
2. Disable **Vercel Authentication**
3. Simpan

---

### Error 500 di halaman event setelah deploy

Debug dengan cek koneksi database:
```bash
curl https://waroengss-archery.vercel.app/api/debug-db
```

Response yang diharapkan: `"dbStatus": "connected"`.

Jika error, lihat bagian Database di bawah.

---

### `src/src/` double path error saat deploy

**Penyebab:** Deploy langsung dari source (`vercel --prod`) menyebabkan path ganda.

**Solusi:** Selalu gunakan alur build lokal → deploy prebuilt:
```bash
vercel build --prod --yes
vercel deploy --prebuilt --prod --token <token>
```

---

## Database

### `PrismaClientInitializationError: Can't reach database server`

Kemungkinan penyebab:
1. `DATABASE_URL` atau `DIRECT_URL` salah format
2. Password mengandung `@` tapi tidak di-encode

**Cek format URL:**
```bash
# Password "mypass@123" harus ditulis:
postgresql://user:mypass%40123@host:6543/db
#                        ^^^
#              @ di-encode jadi %40
```

**Cek Supabase:**
- Free tier Supabase pause setelah 1 minggu tidak aktif — aktifkan kembali dari dashboard
- Settings → Database → Network → pastikan allow external connections

---

### `Error: P1001 - Can't reach database`

```bash
# Test koneksi dari lokal
npm run db:studio
# Jika Studio bisa buka, berarti koneksi OK
```

---

### Migration gagal di production

```bash
# Pastikan DIRECT_URL dipakai (bukan pooled)
# DIRECT_URL menggunakan port 5432, bukan 6543
npm run db:migrate:deploy
```

---

### `Error: P2025 - Record not found`

Data tidak ada di DB. Jalankan seed:
```bash
npm run db:seed
```

---

## Google Drive

### `Error: invalid_grant` atau `credentials not found`

- Periksa `GOOGLE_SERVICE_ACCOUNT_JSON` di Vercel env vars
- Pastikan JSON valid — tidak boleh ada newline, harus satu baris
- Cara generate satu baris: `cat service-account.json | tr -d '\n'`

### Foto tidak muncul setelah sync

- Pastikan folder Drive sudah di-share ke email service account
- Format email: `name@project-id.iam.gserviceaccount.com`
- Akses minimal: **Viewer**
- Subfolder tidak di-scan otomatis — buat album terpisah untuk setiap subfolder

### Download foto gagal

- Service account harus punya akses baca file (bukan hanya folder)
- Cek Vercel function logs untuk error detail

---

## Admin Panel

### Tidak bisa login

```bash
# Pastikan seed sudah dijalankan
npm run db:seed
# Credential default: admin@waroengss.com / admin123456
```

### Session expired terus-menerus

- Periksa `JWT_SECRET` — harus sama di semua deployment
- Jangan ubah `JWT_SECRET` di production kecuali mau logout semua user

### Admin redirect loop

1. Clear cookie browser (site settings → clear data)
2. Buka ulang `/admin/login`

---

## Build & Development

### `Cannot find module '@prisma/client'`

```bash
npm run db:generate
# Restart dev server
```

### Port 3000 sudah dipakai

```bash
npm run dev -- -p 3001
```

### Hot reload tidak bekerja

```bash
rm -rf .next
npm run dev
```

### Prisma Client tidak update setelah schema berubah

```bash
npm run db:generate
# Restart dev server
```

### `npm install` gagal dengan dependency conflict

```bash
npm install --legacy-peer-deps
```
