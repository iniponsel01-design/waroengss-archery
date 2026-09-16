# Security

## Credential Protection

- Semua secrets hanya ada di **Vercel Environment Variables**
- `.env.local` dan `service-account.json` ada di `.gitignore`
- Jangan pernah commit credentials ke Git
- Google service account hanya diberi akses **Viewer** ke folder Drive

## Authentication

- Admin: JWT cookie (`HttpOnly`, `Secure`, `SameSite=Lax`)
- Token expires: 7 hari
- Password hashed dengan **bcrypt** (cost factor 12)
- Visitor: tidak ada autentikasi

## Download Security

Foto didownload melalui `/api/photos/:id/download` yang:
1. Memvalidasi foto ada di DB dan statusnya ACTIVE
2. Mengambil file dari Drive menggunakan service account (server-side)
3. Meneruskan ke client sebagai stream
4. Tidak pernah mengekspos credentials ke browser

## Public Data vs Private Data

| Public | Private |
|--------|---------|
| Event metadata | Admin credentials |
| Photo URLs (thumbnail/preview) | Database URL |
| Album info | Google credentials |
| Download via API | Sync job internals |

## What Visitors Cannot Access

- Admin panel routes (`/admin/*`) → redirect ke login
- Admin API routes (`/api/admin/*`) → 401 tanpa cookie
- Database credentials → hanya di server
- Google credentials → hanya di server
- Unpublished events → 404

## Recommendations for Production

1. Set `JWT_SECRET` yang panjang dan random
2. Ganti password admin default segera
3. Aktifkan Vercel Authentication untuk preview deployments
4. Review audit logs secara berkala
5. Rotate service account key setiap 6-12 bulan
