# Admin Guide

Panduan penggunaan Admin Panel untuk non-teknis.

---

## Login

Buka: `https://waroengss-archery.vercel.app/admin/login`

---

## Alur Kerja Dasar

```
1. Buat Event
2. Tambah Hari (Days)
3. Tambah Grup Sesi (opsional) di dalam Day
4. Tambah Album ke setiap Hari atau Grup
5. Hubungkan folder Google Drive ke Album
6. Jalankan Sync
7. Publish Event
8. Bagikan URL / QR Code
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

### Struktur Album (dua pilihan)

#### Pilihan A — Langsung (tanpa sesi)

Cocok untuk hari yang sederhana:
```
Day 1
  └── Qualification    (Album → foto)
  └── Opening Ceremony (Album → foto)
```

#### Pilihan B — Dengan Grup Sesi (sub-folder)

Cocok untuk hari yang terbagi beberapa sesi:
```
Day 3
  ├── Sesi Pagi        (Grup)
  │     ├── Pertandingan (Album → foto)
  │     └── UPP          (Album → foto)
  └── Sesi Siang       (Grup)
        ├── Pertandingan (Album → foto)
        └── UPP          (Album → foto)
```

**Cara membuat Grup:**
1. Di dalam Day, klik **Tambah Grup** (tombol biru)
2. Isi nama grup dan slug
3. Setelah grup dibuat, klik **Tambah Album** dan pilih grup tujuan dari dropdown

**Catatan:** Album yang tidak di-assign ke grup tetap tampil langsung di bawah Day (Pilihan A). Kedua pilihan bisa dicampur dalam satu Day.

---

## Mengatur Urutan & Visibilitas Album

Di halaman Edit Event → Hari & Album:

- **Ubah urutan**: Klik tombol ↑↓ di sebelah kanan setiap album
- **Sembunyikan album**: Klik tombol 👁 (album tidak tampil ke publik tapi data tetap ada)
- **Tampilkan kembali**: Klik tombol 👁 lagi (album kembali tampil)
- **Sembunyikan grup**: Klik tombol 👁 di header grup (menyembunyikan seluruh grup beserta album di dalamnya)

---

## Cara mendapatkan Drive Folder ID

Buka folder di Google Drive → lihat URL:
```
https://drive.google.com/drive/folders/FOLDER_ID_ADA_DI_SINI
```
Salin bagian setelah `/folders/`.

**Penting:** Pastikan folder Drive sudah di-share ke email Service Account (minimal Viewer).

---

## Sync Foto dari Google Drive

### Mode 1 — Sync per Album (dari halaman Edit Event)

Di dalam album row, klik tombol **Sync**.

- Status sync ditampilkan realtime: progress bar + nama file sedang diproses
- Sync bersifat **incremental** — hanya file baru/berubah yang diproses, file lama tidak diulang
- Aman dijalankan berkali-kali

### Mode 2 — Sync dari halaman Drive Sync

Admin → **Drive → Sync**:

- Daftar semua album yang terhubung Drive (dengan info Day › Grup › Nama Album)
- Tombol **Sync Semua** — sync semua album sekaligus secara berurutan
- Filter per event di bagian atas
- Progress bar 2 level: progress album + progress file dalam album aktif

### Mode 3 — Sync Sub-folder Otomatis (syncDayFolders)

Jika struktur folder Drive mencerminkan grup sesi (2 level):
```
Day 3/
  Sesi Pagi/
    Pertandingan/  ← foto-foto
    UPP/           ← foto-foto
  Sesi Siang/
    Pertandingan/
    UPP/
```

API `POST /api/admin/drive/sync-day` akan otomatis:
- Membuat AlbumGroup dari sub-folder level 1
- Membuat Album dari sub-folder level 2
- Sync semua foto

---

## Diagnosis Sync

**Sync berjalan lama:** Normal untuk album 500+ foto. Progress bar menampilkan nama file yang sedang diproses.

**Sync menampilkan "⏳ Sync berjalan di background":** Sync sudah dimulai di server. Refresh halaman setelah beberapa menit untuk melihat hasilnya.

**Foto tidak bertambah setelah sync:** Kemungkinan penyebab:
1. Folder Drive belum di-share ke Service Account
2. Folder Drive ID salah — cek ulang di field Drive Folder ID album
3. Ada job sync stuck (zombie) — hubungi developer untuk cleanup

**Sync menampilkan "Sync timeout":** Ini bukan error data — sync sudah selesai di server tapi browser timeout menunggu. Refresh halaman untuk melihat data terbaru.

---

## Publish Event

Di halaman Edit Event:
1. Ubah **Status** dari `Draft` ke `Published`
2. Klik Simpan

Event langsung dapat diakses publik di:
```
https://waroengss-archery.vercel.app/e/nama-event
```

---

## Branding & Tampilan

Admin → **Appearance → Branding**:

- **Nama Brand**: tampil di header, footer, PWA
- **Warna Utama**: pilih dari color picker atau preset warna — perubahan langsung berlaku tanpa deploy ulang
- **Logo**: URL gambar logo (PNG/SVG transparan)
- **Social Media**: Instagram, Facebook, YouTube, TikTok — tampil di footer
- **Hero Section**: judul, subjudul, gambar background halaman utama

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
- Album yang di-hide tidak tampil ke publik tapi tetap ada di DB — bisa di-unhide kapan saja
- Nama album boleh sama di sesi/grup berbeda (misal "Pertandingan" di Sesi Pagi dan Sesi Siang) — slug harus berbeda
