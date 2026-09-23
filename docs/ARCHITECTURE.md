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
                    │  Next.js 14 App   │
                    │  (Frontend+API)   │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
           ┌──────────────┐    ┌────────────────┐
           │  PostgreSQL  │    │  Google Drive  │
           │  (Supabase)  │    │  Photo Storage │
           └──────────────┘    └────────────────┘

GitHub (holisahmad) → push → GitHub (iniponsel01-design fork) → Vercel auto-deploy
```

## Key Principles

1. **Photos live in Google Drive** — DB stores metadata only (URL, size, dimensions)
2. **No visitor login** — all public gallery pages are unauthenticated
3. **Incremental sync** — Drive → classify in memory → batch INSERT/UPDATE/SKIP
4. **Server-side downloads** — credentials never reach the browser
5. **Storage abstraction** — `StorageProviderInterface` allows swapping Drive for S3/R2
6. **Display alias** — each photo gets a `displayName` (e.g. `wss-day1-sesi-pagi-0042`) without changing the original filename in Drive

---

## Data Model

```
Event
  └── EventDay (Day 1, Day 2, ...)
        ├── AlbumGroup (optional — Sesi Pagi, Sesi Siang, ...)
        │     └── Album → MediaFile (foto)
        └── Album (tanpa grup) → MediaFile (foto)
```

- **AlbumGroup** bersifat opsional. Album bisa langsung di bawah EventDay tanpa grup.
- **Album** punya `driveFolderId` — folder Google Drive yang di-sync.
- **MediaFile** menyimpan `thumbnailUrl`, `previewUrl`, `displayName`, dimensi, dll.
- **SyncJob** melacak setiap proses sync: status, progress, file yang sedang diproses.

---

## Layers

```
src/
├── app/           Next.js App Router pages & API routes
│   ├── e/         Public gallery pages (event, day, group, album, photo)
│   ├── admin/     Admin panel pages
│   └── api/       API routes
├── components/
│   ├── gallery/   Public UI (PhotoGallery, DayCard, GroupCard, AlbumCard, ...)
│   ├── admin/     Admin UI (DayManager, SyncManager, BrandingForm, ...)
│   └── shared/    Layout components (SiteHeader, SiteFooter, ...)
├── lib/
│   ├── auth/      JWT + session management
│   ├── db/        Prisma client singleton
│   ├── storage/   StorageProvider abstraction + Google Drive implementation
│   ├── sync/      Sync engine (Drive → DB) — batch optimized
│   ├── utils/     date, slug, cn, display-name, color-scale helpers
│   └── validation/Zod schemas
├── repositories/  Database access layer (event, media)
├── types/         Shared TypeScript types
└── config/        App configuration
```

---

## Data Flow — Visitor Views Album

```
Visitor GET /e/wss-2026/day/3/group/sesi-pagi
  → Next.js Server Component
  → eventRepository.findPublishedBySlug()
  → prisma.albumGroup.findFirst({ where: { slug, status: "ACTIVE" } })
  → prisma.album.findMany({ where: { albumGroupId, status: "ACTIVE" } })
  → renders AlbumCard grid with cover photos

Visitor GET /e/wss-2026/album/pertandingan
  → prisma.album.findFirst (include albumGroup for breadcrumb)
  → renders PhotoGallery (Client Component)
  → PhotoGallery fetches /api/albums/:id/photos (cursor pagination)
  → mediaRepository.listForGallery()
  → masonry grid <img> → Google Drive thumbnail URLs (sz=800)
```

---

## Data Flow — Admin Sync (Async)

```
Admin clicks Sync
  → POST /api/admin/drive/sync { albumId }
  → withAdminAuth middleware validates JWT cookie
  → cleanup zombie jobs (RUNNING > 10 menit) untuk album ini
  → guard: jika ada QUEUED/RUNNING job → return existing jobId (202)
  → prisma.syncJob.create (status: QUEUED)
  → return 202 { jobId } ← langsung, tidak blocking

Background (fire-and-forget):
  syncAlbumFromDrive()
    → googleDriveProvider.listFiles(folderId)         ← 1 Drive API call
    → load existing media dari DB sekali               ← 1 DB query
    → classify semua file di memory (tanpa DB hit per file):
        - NEW files    → batch createMany()             ← 1 DB query
        - MODIFIED     → parallel update (chunk 20)     ← ceil(N/20) queries
        - DELETED      → update status=DELETED          ← 1 per deleted file
        - SKIP         → tidak ada DB hit
    → update SyncJob: processedFiles, currentFile (per chunk)
    → SyncJob status → COMPLETED/PARTIAL/FAILED
    → revalidatePath untuk invalidate public ISR cache

Client polls GET /api/admin/drive/sync?jobId=xxx setiap 2 detik
  → dapat { status, totalFiles, processedFiles, currentFile }
  → tampil progress bar + nama file sedang diproses
```

---

## Data Flow — Admin Sync Sub-folder (syncDayFolders)

```
Admin POST /api/admin/drive/sync-day { eventDayId, dayFolderId }
  → googleDriveProvider.listFolders(dayFolderId)      ← list sub-folder level 1
  → untuk setiap sub-folder:
      if punya sub-folder lagi (Mode A):
        → upsert AlbumGroup (nama = folder name)
        → untuk tiap sub-sub-folder:
            → upsert Album
            → syncAlbumFromDrive()
      else (Mode B — backward compatible):
        → upsert Album langsung (tanpa grup)
        → syncAlbumFromDrive()
```

---

## URL Structure (Public)

```
/                                    → Homepage (list events)
/e/[eventSlug]                       → Event detail (list days)
/e/[eventSlug]/day/[dayNumber]       → Day detail (groups + flat albums)
/e/[eventSlug]/day/[N]/group/[slug]  → Group detail (list albums in group)
/e/[eventSlug]/album/[albumSlug]     → Album gallery (photo grid)
/e/[eventSlug]/photo/[photoId]       → Single photo page
/e/[eventSlug]/search                → Search across event
```

---

## Caching Strategy

| Page | Strategy | Revalidate |
|------|----------|-----------|
| Event list (homepage) | ISR | 300s |
| Event detail | ISR | 30s |
| Day detail | ISR | 30s |
| Album gallery | ISR | 120s |
| Search | force-dynamic | — |
| Admin pages | force-dynamic | — |

Setelah sync selesai, `revalidatePath` dipanggil untuk invalidate cache event + day pages segera.

---

## Security Model

- Admin routes protected by JWT cookie + Next.js middleware
- All secrets in Vercel Environment Variables only
- Download endpoint: server fetches from Drive with service account, streams to client
- Visitor has NO access to credentials, internal IDs, or admin data
- Rate limiting on auth, download, search endpoints
- Sync job guard: auto-cleanup zombie jobs (>10 menit) sebelum create job baru

---

## Brand Color (Runtime)

Warna brand tidak hardcoded di Tailwind — semua `brand-*` class menggunakan CSS variables:
```css
:root { --brand-500: #ec4899; ... }  /* default pink */
```

`layout.tsx` (async Server Component) load `primary_color` dari DB → generate skala 50–950 via `buildBrandCssVars()` → inject `<style>` di `<head>`. Ganti warna di Admin → Branding → langsung berlaku tanpa deploy ulang.
