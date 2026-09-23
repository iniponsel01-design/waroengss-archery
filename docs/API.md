# API Reference

## Public Endpoints

Tidak memerlukan autentikasi.

### Events

```
GET /api/events/:slug
GET /api/events/:slug/days
```

### Albums

```
GET /api/albums/:albumId/photos?cursor=&pageSize=48
```

Response (cursor pagination):
```json
{
  "data": [
    {
      "id": "cuid",
      "driveFileId": "...",
      "filename": "IMG_001.jpg",
      "displayName": "wss-2026-day1-sesi-pagi-0001",
      "thumbnailUrl": "https://drive.google.com/thumbnail?id=...&sz=800",
      "previewUrl": "https://drive.google.com/thumbnail?id=...&sz=2400",
      "width": 4032, "height": 3024
    }
  ],
  "hasNextPage": true,
  "nextCursor": "cuid123"
}
```

### Photos

```
GET /api/photos/:id
GET /api/photos/:id/download
```

### Search

```
GET /api/search?q=archer&eventSlug=wss-2026&dayNumber=3&albumSlug=pertandingan&page=1&pageSize=48
```

Parameter search:
- `q` — kata kunci (cocokkan `filename` ATAU `displayName`)
- `eventSlug` — wajib
- `dayNumber` — filter per hari (opsional)
- `albumSlug` — filter per album (opsional)
- `page`, `pageSize` — pagination (default 1, 48)

### QR Code

```
GET /api/qrcode?slug=wss-2026&format=svg
GET /api/qrcode?slug=wss-2026&format=png
```

---

## Admin Endpoints

Memerlukan cookie `wss_admin_token` (JWT).

### Auth

```
POST /api/admin/auth/login    { email, password }
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

### Events

```
GET    /api/admin/events
POST   /api/admin/events       { slug, title, description, location, startDate, endDate, ... }
GET    /api/admin/events/:id
PATCH  /api/admin/events/:id   { partial update }
DELETE /api/admin/events/:id
```

### Days

```
POST  /api/admin/days          { eventId, dayNumber, title, date, sortOrder }
PATCH /api/admin/days/:id      { title, description, date }
DELETE /api/admin/days/:id
```

### Album Groups (Sesi)

```
POST   /api/admin/album-groups          { eventDayId, name, slug, sortOrder }
PATCH  /api/admin/album-groups/:id      { name, slug, description, sortOrder, status }
DELETE /api/admin/album-groups/:id
```

Hapus grup → album di dalamnya lepas dari grup (albumGroupId → null), foto tidak terhapus.

### Albums

```
POST   /api/admin/albums                { eventDayId, albumGroupId?, name, slug, driveFolderId, sortOrder }
PATCH  /api/admin/albums/:id            { name, slug, driveFolderId, albumGroupId?, sortOrder, status }
DELETE /api/admin/albums/:id
```

`albumGroupId` nullable — kosongkan untuk album tanpa grup (langsung di Day).

`status`: `ACTIVE` | `HIDDEN` — album HIDDEN tidak tampil ke publik.

### Google Drive — Sync

```
POST /api/admin/drive/sync
  body: { albumId }
  response 202: { success: true, data: { jobId, status: "QUEUED" } }
```

Sync bersifat **async** — selalu return 202 segera. Gunakan GET dengan `jobId` untuk polling status.

Auto-cleanup zombie: jika ada job RUNNING >10 menit untuk album yang sama, otomatis di-mark FAILED sebelum membuat job baru.

```
GET /api/admin/drive/sync?jobId=xxx
  response: {
    success: true,
    data: {
      id, status, totalFiles, processedFiles, currentFile,
      addedFiles, updatedFiles, deletedFiles, skippedFiles, failedFiles,
      errorMessage, startedAt, completedAt
    }
  }

GET /api/admin/drive/sync?eventId=xxx&limit=20
  → list sync jobs untuk event tertentu
```

SyncJob status lifecycle: `QUEUED` → `RUNNING` → `COMPLETED` | `PARTIAL` | `FAILED`

### Google Drive — Sync Sub-folder (syncDayFolders)

```
POST /api/admin/drive/sync-day
  body: { eventDayId, dayFolderId }
```

Scan sub-folder Drive secara otomatis:
- **Mode A** (2 level): `dayFolder/GrupSesi/Album/foto` → buat AlbumGroup + Album
- **Mode B** (1 level): `dayFolder/Album/foto` → buat Album langsung (backward compatible)

### Google Drive — Test Connection

```
GET  /api/admin/drive/connect            Test koneksi + list root folders
GET  /api/admin/drive/connect?parentId   List sub-folder dalam parentId
```

### Banners & Ads

```
GET    /api/admin/banners
POST   /api/admin/banners       { title, position, type, isActive, ... }
PATCH  /api/admin/banners/:id
DELETE /api/admin/banners/:id

GET    /api/admin/adslots
POST   /api/admin/adslots       { name, position, adClient, adSlot }
PATCH  /api/admin/adslots/:id
DELETE /api/admin/adslots/:id
```

### Site Settings (Branding)

```
POST /api/admin/settings   { key, value }
```

Key yang didukung: `brand_name`, `brand_tagline`, `brand_website`, `brand_logo_url`,
`primary_color`, `footer_text`, `social_instagram`, `social_facebook`, `social_youtube`,
`social_tiktok`, `hero_title`, `hero_subtitle`, `hero_bg_url`

`primary_color` dalam format `#rrggbb` — langsung mengubah seluruh warna brand di UI publik tanpa deploy.

---

## Pagination

### Cursor (Gallery)

Digunakan untuk album photo gallery (infinite scroll):

```json
{ "data": [...], "hasNextPage": true, "nextCursor": "cuid123" }
```

Pass `cursor` di query params untuk halaman berikutnya.

### Page-based (Search, Sync Jobs)

```json
{ "data": [...], "total": 671, "page": 2, "pageSize": 48, "totalPages": 14 }
```

---

## Error Format

```json
{ "success": false, "error": "Pesan error", "details": [...] }
```

HTTP status codes: 400 (validasi), 401 (tidak login), 404 (tidak ada), 500 (server error), 202 (async job diterima).
