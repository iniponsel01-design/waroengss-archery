# GitHub Setup

Proyek ini menggunakan **dua repository GitHub** karena akun GitHub pemilik kode (`holisahmad`) berbeda dengan akun GitHub yang terhubung ke Vercel (`iniponsel01-design`).

---

## Struktur Repository

| Nama | URL | Akun | Fungsi |
|------|-----|------|--------|
| Primary (asli) | `https://github.com/holisahmad/waroengss-archery` | holisahmad | Source of truth, push utama |
| Fork (Vercel) | `https://github.com/iniponsel01-design/waroengss-archery` | iniponsel01-design | Terhubung ke akun Vercel |

---

## Setup Awal (Pertama Kali)

### 1. Inisialisasi Git di Project

```bash
cd /Users/macbookpro/www/waroengss-archery
git init
git branch -M main
```

### 2. Tambah Remote Primary

```bash
git remote add origin https://github.com/holisahmad/waroengss-archery.git
```

### 3. Buat Repository di GitHub (holisahmad)

1. Buka [github.com/new](https://github.com/new) — login sebagai `holisahmad`
2. Repository name: `waroengss-archery`
3. Visibility: **Public**
4. Jangan centang "Initialize this repository"
5. Klik **Create repository**

### 4. Push Pertama ke Primary

```bash
git add .
git commit -m "feat: initial commit"
git push -u origin main
```

### 5. Buat Fork di Akun Vercel

1. Buka `https://github.com/holisahmad/waroengss-archery`
2. Klik **Fork** (pojok kanan atas)
3. Owner: pilih `iniponsel01-design`
4. Repository name: `waroengss-archery` (biarkan sama)
5. Klik **Create fork**

### 6. Tambah Remote Fork

```bash
git remote add fork https://github.com/iniponsel01-design/waroengss-archery.git
```

Verifikasi remote:
```bash
git remote -v
# origin  https://github.com/holisahmad/waroengss-archery.git (fetch)
# origin  https://github.com/holisahmad/waroengss-archery.git (push)
# fork    https://github.com/iniponsel01-design/waroengss-archery.git (fetch)
# fork    https://github.com/iniponsel01-design/waroengss-archery.git (push)
```

---

## Personal Access Token (PAT) untuk Fork

Push ke fork (`iniponsel01-design`) memerlukan autentikasi akun tersebut. Gunakan Personal Access Token (PAT).

### Cara Buat PAT

1. Login ke GitHub sebagai `iniponsel01-design`
2. Klik avatar → **Settings → Developer settings**
3. **Personal access tokens → Tokens (classic)**
4. Klik **Generate new token (classic)**
5. Isi:
   - Note: `waroengss-archery-deploy`
   - Expiration: pilih sesuai kebutuhan (atau No expiration)
   - Scope: centang **`repo`** (full control of private repositories)
6. Klik **Generate token**
7. **Copy token segera** — hanya tampil sekali

Token yang digunakan: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

> **Jangan commit token ke Git.**

### Cara Push ke Fork dengan PAT

```bash
# Format: https://TOKEN@github.com/USERNAME/REPO.git
git push https://ghp_TOKEN@github.com/iniponsel01-design/waroengss-archery.git main --force
```

---

## Workflow Push Harian

Setiap kali ada perubahan yang perlu dideploy:

```bash
# 1. Commit perubahan
git add .
git commit -m "feat: deskripsi perubahan"

# 2. Push ke primary repo (holisahmad)
git push origin main

# 3. Push ke fork (iniponsel01-design) untuk sync dengan Vercel
git push https://ghp_TOKEN@github.com/iniponsel01-design/waroengss-archery.git main --force
```

> `--force` digunakan pada fork karena fork mungkin tidak selalu in-sync dengan primary.

### Simpan Token di Git Config (Lokal)

Agar tidak mengetik token setiap kali, bisa simpan di URL remote:

```bash
# Update remote fork dengan token embedded
git remote set-url fork https://ghp_TOKEN@github.com/iniponsel01-design/waroengss-archery.git

# Setelah itu cukup:
git push fork main --force
```

> ⚠️ Token embedded di URL remote tersimpan di `.git/config` (plaintext). Pastikan folder project tidak bisa diakses orang lain.

---

## Menghubungkan Fork ke Vercel

Setelah fork ada, hubungkan ke Vercel project agar bisa digunakan sebagai source (opsional — diperlukan untuk auto-deploy):

1. Login Vercel sebagai `iniponsel01-design`
2. Buka project **waroengss-archery**
3. **Settings → Git → Connect Git Repository**
4. Pilih **GitHub** → authorize jika diminta
5. Cari dan pilih `iniponsel01-design/waroengss-archery`
6. Branch production: `main`
7. Klik **Connect**

Setelah terhubung, setiap push ke `iniponsel01-design/waroengss-archery` akan trigger auto-deploy di Vercel.

---

## Cek Status Remote & Branch

```bash
# Lihat semua remote
git remote -v

# Lihat branch local dan tracking-nya
git branch -vv

# Lihat log singkat
git log --oneline -5

# Cek apakah ada perubahan yang belum di-push
git status
```

---

## Jika Token PAT Expired / Perlu Diganti

1. Buat PAT baru di GitHub (`iniponsel01-design`) — ikuti langkah di atas
2. Update remote URL:
```bash
git remote set-url fork https://ghp_TOKEN_BARU@github.com/iniponsel01-design/waroengss-archery.git
```
3. Atau gunakan langsung saat push:
```bash
git push https://ghp_TOKEN_BARU@github.com/iniponsel01-design/waroengss-archery.git main --force
```

---

## Ringkasan Perintah

```bash
# Setup sekali (pertama kali)
git remote add origin https://github.com/holisahmad/waroengss-archery.git
git remote add fork   https://ghp_TOKEN@github.com/iniponsel01-design/waroengss-archery.git

# Push rutin setelah commit
git push origin main                                                          # ke primary
git push fork main --force                                                    # ke fork (Vercel)

# Verifikasi
git remote -v                                                                 # lihat semua remote
git log --oneline -3                                                          # lihat commit terakhir
```
