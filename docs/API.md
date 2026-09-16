# API Reference

## Public Endpoints

Tidak memerlukan autentikasi.

### Events

```
GET /api/events/:slug
GET /api/events/:slug/days
GET /api/events/:slug/albums
GET /api/events/:slug/photos
```

### Albums

```
GET /api/albums/:albumId/photos?cursor=&pageSize=48
```

### Photos

```
GET /api/photos/:id
GET /api/photos/:id/download
```

### Search

```
GET /api/search?q=archer&eventSlug=archery-2026&page=1&pageSize=48
```

### QR Code

```
GET /api/qrcode?slug=archery-2026&format=svg
GET /api/qrcode?slug=archery-2026&format=png
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
POST   /api/admin/events          { slug, title, description, ... }
GET    /api/admin/events/:id
PATCH  /api/admin/events/:id      { partial update }
DELETE /api/admin/events/:id
```

### Days

```
POST /api/admin/days   { eventId, dayNumber, title, date, ... }
```

### Albums

```
POST /api/admin/albums   { eventDayId, name, slug, driveFolderId, ... }
```

### Google Drive

```
GET  /api/admin/drive/connect           Test connection + list folders
GET  /api/admin/drive/connect?parentId  List folders inside parentId
POST /api/admin/drive/sync   { albumId } Trigger sync
GET  /api/admin/drive/sync?eventId      List sync jobs
```

### Settings

```
POST /api/admin/settings   { key, value }
```

---

## Pagination

Gallery menggunakan **cursor pagination**:

```json
{
  "data": [...],
  "hasNextPage": true,
  "nextCursor": "cuid123"
}
```

Pass `cursor` di query params untuk halaman berikutnya.
