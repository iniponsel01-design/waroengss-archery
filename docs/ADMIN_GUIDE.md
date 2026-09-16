# Admin Guide

Panduan penggunaan Admin Panel untuk non-teknis.

---

## Login

Buka: `https://your-domain.com/admin/login`

---

## Alur Kerja Dasar

```
1. Buat Event
2. Tambah Hari (Days)
3. Tambah Album ke setiap Hari
4. Hubungkan folder Google Drive ke Album
5. Jalankan Sync
6. Publish Event
7. Bagikan URL / QR Code
```

---

## Membuat Event

1. Admin → **Events → Buat Event**
2. Isi:
   - **Judul**: Nama event lengkap
   - **Slug**: URL event (auto-generate, bisa diedit)
   - **Lokasi**: Kota/tempat
   - **Tanggal Mulai & Selesai**
   - **Status**: Pilih `Draft` dulu, `Published` setelah siap
3. Klik **Buat Event**

---

## Menambah Hari dan Album

Setelah event dibuat, di halaman Edit Event:

1. Scroll ke bagian **Hari & Album**
2. Klik **Tambah Hari**
3. Isi nomor hari dan judul
4. Di dalam hari, klik **Tambah Album**
5. Isi nama album dan **Drive Folder ID**

**Cara mendapatkan Drive Folder ID:**
Buka folder di Google Drive → lihat URL:
```
https://drive.google.com/drive/folders/FOLDER_ID_ADA_DI_SINI
```

---

## Sync Foto dari Google Drive

1. Admin → **Drive → Sync**
2. Pilih album yang akan di-sync
3. Klik tombol **Sync**
4. Tunggu hingga status berubah ke `COMPLETED`
5. Jumlah foto baru akan ditampilkan

**Sync bersifat incremental** — hanya file baru/berubah yang diproses. Aman dijalankan berkali-kali.

---

## Publish Event

Di halaman Edit Event:
1. Ubah **Status** dari `Draft` ke `Published`
2. Klik Simpan

Event langsung dapat diakses publik di:
```
https://your-domain.com/e/nama-event
```

---

## QR Code

1. Admin → **Tools → QR Code**
2. Pilih event
3. QR Code otomatis ditampilkan
4. Download PNG atau SVG
5. Cetak dan pasang di venue

---

## Tips

- Jalankan sync setelah tim dokumentasi selesai upload foto
- Gunakan status `Draft` selama event berlangsung, `Published` setelah selesai
- QR Code bisa dibuat sebelum event mulai (URL sudah ada meski belum ada foto)
