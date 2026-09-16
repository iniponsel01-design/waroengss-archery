# Troubleshooting

## Build Errors

### `Cannot find module '@prisma/client'`
```bash
npm run db:generate
```

### `Type error: ...` saat build
```bash
npm run typecheck
```
Periksa error dan perbaiki sebelum deploy.

---

## Database

### `Error: P1001 - Can't reach database`
- Periksa `DATABASE_URL` dan `DIRECT_URL` di `.env.local`
- Cek apakah Supabase project aktif (free tier sleep setelah inaktif)

### `Error: P2025 - Record not found`
- Data tidak ada di DB — jalankan `npm run db:seed` untuk development data

### Migration gagal di production
```bash
# Pastikan DIRECT_URL terpasang (bukan pooled URL)
npm run db:migrate:deploy
```

---

## Google Drive

### `Error: invalid_grant` atau `credentials not found`
- Periksa `GOOGLE_SERVICE_ACCOUNT_JSON` atau file `service-account.json`
- Pastikan JSON valid (tidak terpotong)

### `Error: File not found` / foto tidak muncul setelah sync
- Pastikan folder Drive sudah di-share ke email service account
- Format email service account: `name@project-id.iam.gserviceaccount.com`
- Pastikan akses minimal **Viewer**

### Sync selesai tapi foto 0
- Cek apakah folder berisi file gambar (JPEG/PNG/WEBP)
- Subfolder tidak di-scan otomatis — setiap subfolder harus dijadikan album terpisah

### Download gagal
- Cek log Vercel Functions untuk error detail
- Service account harus punya akses baca file, bukan hanya folder

---

## Admin Panel

### Tidak bisa login
- Pastikan database seeding sudah dijalankan: `npm run db:seed`
- Credential default: `admin@waroengss.com` / `admin123456`

### Session expired terus
- Periksa `JWT_SECRET` — harus sama antara deployment

### Admin redirect loop
- Clear cookie browser
- Pastikan middleware berjalan dengan benar

---

## Vercel

### Build gagal di Vercel
1. Cek Vercel build logs
2. Pastikan semua environment variables sudah diset
3. Pastikan `DATABASE_URL` bisa diakses dari Vercel (allow external connections di Supabase)

### `NEXT_PUBLIC_APP_URL` tidak sesuai
- Update di Vercel Environment Variables sesuai domain production

### Function timeout
- Google Drive API calls bisa lambat untuk folder besar
- Pertimbangkan memecah sync per album, bukan per event sekaligus

---

## Development

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
