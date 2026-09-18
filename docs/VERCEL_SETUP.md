# Vercel Setup

Panduan lengkap setup Vercel dari awal hingga deployment production.

---

## Akun & Project

| Item | Value |
|------|-------|
| Akun Vercel | `iniponsel01-design` (iniponsel01@gmail.com) |
| Team | `waroengss-archery` |
| Project ID | `prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD` |
| Team ID | `team_Qv9jFpl5WIx6OR3uiCwnv1YO` |
| Production URL | https://waroengss-archery.vercel.app |

> Token disimpan lokal di: `~/Library/Application Support/com.vercel.cli/auth.json`
> Jika token expired (error 403), buat token baru di Vercel → Account Settings → Tokens → Create.

---

## 1. Install Vercel CLI

```bash
npm install -g vercel
```

Verifikasi:
```bash
vercel --version
# Vercel CLI 59.x.x
```

---

## 2. Login CLI

```bash
vercel login
```

Pilih metode login sesuai akun (`iniponsel01-design` menggunakan GitHub atau email).

Alternatif, gunakan token langsung tanpa login interaktif:
```bash
export VERCEL_TOKEN=<token>
# atau tambahkan --token <token> di setiap perintah
```

Token dibuat di: Vercel Dashboard → Settings → Tokens → Create.

---

## 3. Link Project ke Local

Di folder project:
```bash
vercel link
```

Pilih:
- Scope: **waroengss-archery** (team)
- Link to existing project: **Yes**
- Project name: **waroengss-archery**

Ini membuat `.vercel/project.json`:
```json
{
  "projectId": "prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD",
  "orgId": "team_Qv9jFpl5WIx6OR3uiCwnv1YO",
  "projectName": "waroengss-archery"
}
```

---

## 4. Environment Variables

Tambahkan semua variabel berikut di **Vercel → Project → Settings → Environment Variables**.

Set setiap variabel untuk environment **Production** (dan Preview jika diperlukan).

### Wajib

| Key | Keterangan |
|-----|------------|
| `DATABASE_URL` | Supabase pooled URL (port 6543), `@` di password di-encode jadi `%40` |
| `DIRECT_URL` | Supabase direct URL (port 5432), `@` di password di-encode jadi `%40` |
| `JWT_SECRET` | Minimal 32 karakter acak — `openssl rand -base64 64` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Isi `service-account.json` sebagai satu baris JSON |

### Public (tampil ke browser)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_APP_URL` | `https://waroengss-archery.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Waroeng SS Archery Gallery` |
| `NEXT_PUBLIC_BRAND_NAME` | `Waroeng SS Archery` |

### Tambahan

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

### Cara Membuat `GOOGLE_SERVICE_ACCOUNT_JSON`

```bash
# Hasilkan satu baris dari file JSON
cat service-account.json | tr -d '\n'
```

Copy output dan paste sebagai nilai env var di Vercel.

---

## 5. Konfigurasi Project di Vercel Dashboard

Buka **Vercel → Project → Settings → General**:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `.` (kosong/default) |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install --legacy-peer-deps` |
| Node.js Version | 20.x |

> **Install Command** penting: harus `npm install --legacy-peer-deps` agar tidak gagal karena peer dependency conflict.

---

## 6. Disable Vercel Authentication (SSO)

Default Vercel team mengaktifkan SSO protection — hanya member tim yang bisa buka URL. Untuk situs publik, ini harus dimatikan:

1. Vercel → Project → **Settings → Security**
2. Cari **Vercel Authentication**
3. Toggle → **Off**
4. Klik **Save**

Jika tidak dimatikan, setiap pengunjung akan di-redirect ke halaman login Vercel.

---

## 7. Deploy

### Alur Deploy yang Digunakan

Karena build dilakukan di macOS lokal dan diupload ke Vercel (bukan build di server Vercel), alurnya:

```
1. vercel build --prod --yes        ← Build di local, output ke .vercel/output/
2. vercel deploy --prebuilt --prod  ← Upload .vercel/output/ ke Vercel
```

### Perintah Lengkap

```bash
# Step 1 — Build
VERCEL_TOKEN=<token> vercel build --prod --yes

# Step 2 — Deploy
vercel deploy --prebuilt --prod --token <token>
```

Output sukses:
```
✅ Build Completed in .vercel/output [~2m]
...
▲ Aliased   https://waroengss-archery.vercel.app
✓ Ready in 21s
```

### Kenapa Tidak Deploy Langsung?

Deploy langsung (`vercel --prod`) menyebabkan double path `src/src/` di webpack karena CLI mengupload seluruh folder termasuk `src/`, lalu Vercel menambahkan root directory lagi. Prebuilt deploy menghindari masalah ini.

---

## 8. Sync GitHub (Opsional — Auto Deploy)

Untuk auto-deploy saat push ke GitHub:

1. Vercel → Project → **Settings → Git**
2. **Connect Git Repository**
3. Pilih `iniponsel01-design/waroengss-archery`
4. Branch: `main`

Setelah terhubung, setiap push ke `main` akan trigger build otomatis di Vercel.

> Jika menggunakan auto-deploy, pastikan Vercel bisa resolve dependencies dengan benar — lihat bagian Install Command di atas.

---

## 9. Custom Domain (Opsional)

1. Vercel → Project → **Settings → Domains**
2. Klik **Add**
3. Masukkan domain (contoh: `gallery.waroengss.com`)
4. Ikuti instruksi DNS:
   - Tambah CNAME record: `gallery` → `cname.vercel-dns.com`
   - Atau A record: `@` → `76.76.19.61`
5. Tunggu propagasi DNS (bisa 1–24 jam)

Setelah domain aktif:
- Update `NEXT_PUBLIC_APP_URL` di Vercel env vars
- Redeploy

---

## Referensi Cepat

```bash
# Lihat deployment terbaru
vercel ls --token <token> --scope waroengss-archery

# Lihat env vars
vercel env ls --token <token> --scope waroengss-archery

# Tambah env var
echo "nilai" | vercel env add NAMA production --token <token>

# Pull env vars ke lokal
vercel env pull .env.local --token <token>

# Cek status deployment
vercel inspect <deployment-url> --token <token>
```
