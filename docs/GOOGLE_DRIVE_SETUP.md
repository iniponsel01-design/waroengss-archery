# Google Drive Setup

Platform ini menggunakan Google Drive sebagai penyimpanan foto event melalui **Service Account** — bukan OAuth user login.

---

## 1. Buat Google Cloud Project

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru (atau gunakan yang sudah ada)
3. Aktifkan **Google Drive API**:
   - APIs & Services → Enable APIs → cari "Google Drive API" → Enable

---

## 2. Buat Service Account

1. APIs & Services → **Credentials** → Create Credentials → **Service Account**
2. Isi nama (contoh: `waroengss-gallery`)
3. Klik **Create and Continue** → skip role → Done
4. Klik service account yang baru dibuat
5. Tab **Keys** → Add Key → **Create new key** → JSON → Download

File JSON yang didownload berisi credentials. **Jangan commit file ini ke Git.**

---

## 3. Konfigurasi Credentials

### Development (lokal)

Copy file JSON ke root project dengan nama `service-account.json`:

```bash
cp ~/Downloads/waroengss-gallery-xxxx.json ./service-account.json
```

File ini sudah ada di `.gitignore`.

Set di `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json
```

### Production (Vercel)

1. Buka file JSON di text editor
2. Copy seluruh isi sebagai satu baris (minify)
3. Set di Vercel Environment Variables:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

---

## 4. Berikan Akses ke Folder Google Drive

Service Account tidak otomatis bisa akses Drive Anda. Anda perlu berbagi folder:

1. Buka Google Drive
2. Klik kanan folder event → **Share**
3. Tambahkan email service account (format: `name@project.iam.gserviceaccount.com`)
4. Berikan akses **Viewer** (cukup untuk membaca foto)
5. Klik Send

---

## 5. Dapatkan Folder ID

Folder ID ada di URL Google Drive:

```
https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Q
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        ini Folder ID
```

---

## 6. Hubungkan ke Album

Di admin panel:
1. Edit event → pilih album
2. Isi **Drive Folder ID** dengan ID folder yang sudah di-share
3. Klik **Sync** untuk mengimpor metadata foto

---

## Struktur Folder Disarankan

```
EVENT-ARCHERY-2026/           ← Share folder ini ke service account
├── DAY-01/
│   ├── QUALIFICATION/        ← Satu album = satu folder
│   ├── PRACTICE/
│   └── AWARD/
├── DAY-02/
│   ├── QUALIFICATION/
│   └── MATCH/
└── ...
```

---

## Troubleshooting

**Error: "File not found" saat sync**
→ Pastikan folder sudah di-share ke email service account

**Error: "Invalid credentials"**
→ Periksa `GOOGLE_SERVICE_ACCOUNT_JSON` atau `service-account.json`

**Foto tidak muncul setelah sync**
→ Pastikan file di Drive berformat JPEG/PNG/WEBP
→ Cek riwayat sync di admin panel untuk error detail
