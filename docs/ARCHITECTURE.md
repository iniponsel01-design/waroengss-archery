# Architecture

## Overview

```
                    ┌───────────────────┐
                    │      VISITOR      │
                    │  No Login Needed  │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      VERCEL       │
                    │  Next.js App      │
                    │  (Frontend+API)   │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
           ┌──────────────┐    ┌────────────────┐
           │  PostgreSQL  │    │  Google Drive  │
           │  (Supabase)  │    │  Photo Storage │
           └──────────────┘    └────────────────┘

GitHub → Version Control + CI/CD trigger → Vercel
```

## Key Principles

1. **Photos live in Google Drive** — DB stores metadata only
2. **No visitor login** — all public gallery pages are unauthenticated
3. **Incremental sync** — Drive → compare with DB → INSERT/UPDATE/SKIP
4. **Server-side downloads** — credentials never reach the browser
5. **Storage abstraction** — `StorageProviderInterface` allows swapping Drive for S3/R2

## Layers

```
src/
├── app/           Next.js App Router pages & API routes
├── components/    React components (gallery, admin, shared, ui)
├── lib/           Core library code
│   ├── auth/      JWT + session management
│   ├── db/        Prisma client singleton
│   ├── storage/   StorageProvider abstraction + Google Drive impl
│   ├── sync/      Sync engine (Drive → DB)
│   ├── utils/     Date, slug, cn helpers
│   └── validation/Zod schemas
├── repositories/  Database access layer
├── services/      Business logic (future)
├── types/         Shared TypeScript types
└── config/        App configuration
```

## Data Flow — Visitor Views Photo

```
Visitor GET /e/archery-2026/album/qualification
  → Next.js page (Server Component)
  → eventRepository.findPublishedBySlug()
  → prisma.album.findFirst()
  → renders PhotoGallery (Client Component)
  → PhotoGallery fetches /api/albums/:id/photos
  → mediaRepository.listForGallery() (cursor pagination)
  → returns {thumbnailUrl, previewUrl, id}
  → renders masonry grid of <img> pointing to Google Drive thumbnails
```

## Data Flow — Admin Sync

```
Admin clicks Sync
  → POST /api/admin/drive/sync { albumId }
  → withAdminAuth middleware validates JWT cookie
  → startAlbumSync(album)
  → prisma.syncJob.create (status: QUEUED)
  → syncAlbumFromDrive()
    → googleDriveProvider.listFiles(folderId)
    → compare with existing mediaFiles in DB
    → INSERT new / UPDATE modified / mark DELETED
  → syncJob status → COMPLETED
  → Admin sees updated counts
```

## Security Model

- Admin routes protected by JWT cookie + Next.js middleware
- All secrets in Vercel Environment Variables only
- Download endpoint: server fetches from Drive with service account, streams to client
- Visitor has NO access to credentials, internal IDs, or admin data
- Rate limiting on auth, download, search endpoints
