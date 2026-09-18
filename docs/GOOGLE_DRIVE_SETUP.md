# Google Drive Setup

Platform ini menggunakan Google Drive sebagai penyimpanan foto event melalui **Service Account** — bukan OAuth user login. Service account bertindak sebagai "robot" yang membaca foto dari folder Drive yang sudah di-share.

---

## 1. Buat Google Cloud Project

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project di pojok kiri atas → **New Project**
3. Isi nama project (contoh: `waroengss-archery`)
4. Klik **Create**, tunggu hingga project aktif

---

## 2. Aktifkan Google Drive API

1. Di sidebar kiri → **APIs & Services → Library**
2. Cari `Google Drive API`
3. Klik → **Enable**

---

## 3. Buat Service Account

1. **APIs & Services → Credentials → + Create Credentials → Service Account**
2. Isi:
   - **Service account name**: `waroengss-gallery`
   - **Service account ID**: otomatis terisi
3. Klik **Create and Continue**
4. Bagian "Grant this service account access to project" → skip, klik **Continue**
5. Bagian "Grant users access" → skip, klik **Done**

### Download JSON Key

1. Di halaman Credentials → klik service account yang baru dibuat
2. Tab **Keys → Add Key → Create new key → JSON**
3. File JSON otomatis didownload (contoh: `waroengss-archery-abc123.json`)

> **Jangan commit file ini ke Git.** Sudah ada di `.gitignore`.

Catat email service account, formatnya:
```
waroengss-gallery@waroengss-archery-XXXXX.iam.gserviceaccount.com
```

---

## 4. Konfigurasi Credentials di App

### Development (lokal)

```bash
# Copy ke root project dengan nama standar
cp ~/Downloads/waroengss-archery-*.json ./service-account.json
```

Set di `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json
```

### Production (Vercel)

1. Buka file `service-account.json` di text editor
2. Minify menjadi satu baris:
```bash
cat service-account.json | tr -d '\n'
```
3. Copy output tersebut
4. Di Vercel → Project → **Settings → Environment Variables**
5. Tambahkan:
   - Key: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: paste JSON satu baris tadi
   - Environment: Production

---

## 5. Siapkan Struktur Folder di Google Drive

Buat struktur folder sesuai event. Contoh untuk satu event 2 hari:

```
ARCHERY-EVENT-2026/               ← Folder utama event
├── Hari-1-Kualifikasi/
│   ├── Album-Pagi/               ← Setiap folder = satu album di app
│   └── Album-Siang/
└── Hari-2-Final/
    ├── Album-Upacara/
    └── Album-Pertandingan/
```

> Foto harus berada langsung di dalam folder album, bukan di subfolder lagi.
> Format yang didukung: JPEG, PNG, WEBP.

---

## 6. Berikan Akses ke Folder

Setiap folder yang ingin di-sync **harus** di-share ke email service account:

1. Buka Google Drive
2. Klik kanan folder → **Share** (atau buka folder → klik ikon orang di atas)
3. Di kolom "Add people and groups", masukkan email service account
4. Ubah role ke **Viewer**
5. Klik **Send**

> Cukup share folder level album. Tidak perlu share folder parent.

---

## 7. Dapatkan Folder ID

Folder ID ada di URL saat membuka folder di browser:

```
https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                               ini Folder ID
```

---

## 8. Hubungkan ke Album di Admin

1. Login admin → **Events** → pilih event
2. Buka hari yang sesuai → klik album
3. Isi field **Drive Folder ID** dengan ID folder
4. Klik **Save**
5. Pergi ke **Drive → Sync** → klik Sync pada album tersebut

---

## Test Koneksi

Di admin panel → **Drive → Connections** → Test Connection.

Atau via script lokal:
```bash
node scripts/test-drive.mjs
```

Output sukses:
```
✅ Service account terhubung
📁 Folder found: ARCHERY-EVENT-2026
```

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `invalid_grant` | JSON key tidak valid atau expired | Download ulang JSON key dari Google Cloud |
| `File not found` saat sync | Folder belum di-share | Share folder ke email service account |
| `Invalid credentials` di Vercel | `GOOGLE_SERVICE_ACCOUNT_JSON` salah format | Pastikan JSON dalam satu baris tanpa newline |
| Foto 0 setelah sync | File bukan gambar / ada di subfolder | Pindahkan foto langsung ke folder album |
| Download foto gagal | Service account tidak punya akses file | Share folder dengan minimal akses Viewer |
