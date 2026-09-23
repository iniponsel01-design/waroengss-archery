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

**Penyebab:** Build di macOS, Vercel jalan di Linux.

**Solusi:** Pastikan `prisma/schema.prisma` punya:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Lalu rebuild:
```bash
VTOKEN=<vercel_token>
VERCEL_TOKEN="$VTOKEN" vercel build --prod --yes
vercel deploy --prebuilt --prod --token "$VTOKEN"
```

---

### Error: `Not authorized` saat `vercel deploy`

**Penyebab:** Token Vercel di `~/.kiro/settings/...` atau auth.json milik akun yang salah. Project terhubung ke akun `iniponsel01-design` tapi token yang tersimpan milik akun lain.

**Solusi:** Gunakan alur push git yang benar (tidak perlu token manual):
```bash
git push origin main          # holisahmad (source of truth)
git push fork main --force    # iniponsel01-design (trigger Vercel)
```

Vercel auto-deploy dari fork. Tidak perlu `vercel deploy` manual untuk deploy rutin.

---

### Deployment URL redirect ke Vercel login

**Penyebab:** SSO protection aktif di Vercel team/project.

**Solusi:**
1. Vercel → Project → **Settings → Security**
2. Disable **Vercel Authentication**
3. Simpan

---

### Error 500 di halaman event setelah deploy

```bash
curl https://waroengss-archery.vercel.app/api/debug-db
```

Response yang diharapkan: `"dbStatus": "connected"`.

---

### `src/src/` double path error saat deploy

**Solusi:** Gunakan build lokal → deploy prebuilt:
```bash
VTOKEN=$(python3 -c "import json; print(json.load(open('/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
VERCEL_TOKEN="$VTOKEN" vercel build --prod --yes
vercel deploy --prebuilt --prod --token "$VTOKEN"
```

---

## Database

### `PrismaClientInitializationError: Can't reach database server`

**Penyebab paling umum:** Password database mengandung `@` tapi tidak di-encode.

**Format URL yang benar:**
```
# Password: Madraonline254@
# Harus ditulis:
DATABASE_URL="postgresql://user:Madraonline254%40@host:6543/db"
#                                            ^^^
#                           @ di-encode jadi %40
```

Berlaku untuk `DATABASE_URL` (port 6543) dan `DIRECT_URL` (port 5432).

---

### Supabase free tier paused

Free tier Supabase pause setelah 1 minggu tidak aktif.
- Buka [supabase.com](https://supabase.com) → project → klik **Restore**
- Tunggu 1–2 menit sampai aktif kembali
- Test: `curl https://waroengss-archery.vercel.app/api/debug-db`

---

### Migration gagal di production

Gunakan `DIRECT_URL` (port 5432, bukan pooled 6543) untuk migration:
```bash
PGPASSWORD='password' psql \
  --host=aws-0-ap-southeast-1.pooler.supabase.com \
  --port=5432 \
  --username=postgres.PROJECT_REF \
  --dbname=postgres \
  -f prisma/migrations/NAMA_MIGRATION/migration.sql
```

---

## Google Drive

### `Error: invalid_grant` atau `credentials not found`

- Periksa `GOOGLE_SERVICE_ACCOUNT_JSON` di Vercel env vars
- Harus satu baris: `cat service-account.json | tr -d '\n'`
- `service-account.json` sudah ada di `.gitignore` — jangan pernah commit

### Foto tidak muncul setelah sync

1. Pastikan folder Drive di-share ke email service account (minimal **Viewer**)
2. Cek Drive Folder ID di album — salin langsung dari URL Google Drive
3. Lihat riwayat sync di Admin → Drive → Sync untuk error message

### Sync menampilkan `0 total · +0 baru`

Folder Drive berhasil diakses tapi kosong atau tidak ada file gambar (JPG/PNG/WEBP).
Periksa apakah foto sudah benar-benar di-upload ke folder tersebut.

### Download foto gagal

Service account harus punya akses baca file (bukan hanya folder). Re-share folder ke service account.

---

## Sync

### Sync berjalan lama

Normal untuk album besar. Estimasi:
- Album 500 foto: ~5–10 detik (batch optimized)
- Album 500 foto (sync pertama, insert semua): ~15–30 detik

Progress bar menampilkan nama file yang sedang diproses secara realtime.

### Sync timeout di browser ("⏳ Sync berjalan di background")

Ini **bukan error** — sync sudah dimulai di server, browser hanya berhenti menunggu. Data akan lengkap. Refresh halaman setelah 1–2 menit.

Penyebab: Vercel serverless function timeout ~30 detik, tapi sync album besar bisa lebih lama. Sync tetap berjalan di background.

### Foto tidak bertambah meski sudah sync (stuck di angka lama)

**Kemungkinan penyebab: zombie sync job.**

Cek di database:
```sql
SELECT id, status, started_at,
       EXTRACT(EPOCH FROM (NOW() - started_at))::int AS running_seconds
FROM sync_jobs
WHERE status IN ('QUEUED', 'RUNNING')
ORDER BY created_at DESC;
```

Jika ada job RUNNING dengan `running_seconds` > 600 (10 menit), itu zombie. Matikan:
```sql
UPDATE sync_jobs
SET status = 'FAILED',
    completed_at = NOW(),
    error_message = 'Zombie job — dibersihkan manual'
WHERE status IN ('QUEUED', 'RUNNING')
  AND started_at < NOW() - INTERVAL '10 minutes';
```

Setelah itu sync ulang dari admin — sistem otomatis buat job baru.

**Catatan:** Mulai versi terbaru, auto-cleanup zombie berjalan otomatis saat Sync diklik. Kasus ini hanya bisa terjadi jika ada job lama dari versi sebelumnya.

### Sync PARTIAL (ada foto gagal)

Beberapa foto gagal diinsert. Lihat `error_message` di riwayat sync. Penyebab umum:
- Unique constraint (sudah diperbaiki dengan `upsert`) — jalankan sync ulang
- Drive API rate limit — tunggu beberapa menit lalu sync ulang

---

## Admin Panel

### Tidak bisa login

```bash
npm run db:seed
# Credential default: admin@waroengss.com / admin123456
```

### Session expired terus-menerus

- Periksa `JWT_SECRET` — harus sama di semua deployment
- Jangan ubah `JWT_SECRET` di production kecuali mau logout semua user

### Admin redirect loop

1. Clear cookie browser (site settings → clear data)
2. Buka ulang `/admin/login`

### Warna brand tidak berubah setelah disimpan

- Tunggu 1–2 detik, lalu hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Warna berlaku via CSS variable yang di-inject di `<head>` — tidak butuh deploy
- Jika masih tidak berubah, cek `site_settings` table di database

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

### Prisma Client tidak update setelah schema berubah

```bash
npm run db:generate
# Restart dev server
```

### `npm install` gagal dengan dependency conflict

```bash
npm install --legacy-peer-deps
```

### TypeScript error tapi build tetap berhasil

Project dikonfigurasi `ignoreBuildErrors: true` di `next.config.mjs` (workaround SIGSEGV di Vercel). Jalankan typecheck manual:
```bash
npx tsc --noEmit
```
