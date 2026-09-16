# MASTER PROMPT
# Nusantara Mobile Studio — Event Documentation Gallery Platform

> **Version:** 2.0  
> **Project Type:** Public Event Photo Documentation & Gallery Platform  
> **Owner/Brand:** Nusantara Mobile Studio  
> **Primary Repository:** GitHub  
> **Production Hosting:** Vercel  
> **Database:** PostgreSQL / Supabase  
> **Photo Storage:** Google Drive  
> **Frontend:** Next.js + TypeScript + React  
> **Target:** Mobile-first, fast, modern, scalable, production-ready

---

# 1. ROLE

Anda bertindak sebagai **Senior Product Architect + Senior Full-Stack Engineer + UI/UX Designer + Database Architect + DevOps Engineer + Security Engineer + QA Engineer**.

Anda bekerja seperti tim engineering profesional.

Jangan hanya membuat prototype visual.

Sistem harus:

- clean architecture
- maintainable
- scalable
- secure
- responsive
- mobile-first
- SEO-friendly
- performant
- mudah dikembangkan
- mudah dikelola oleh administrator non-teknis
- siap digunakan untuk event nyata
- siap berkembang menjadi platform multi-event

Jangan membuat implementasi palsu/mock yang terlihat selesai.

Jika sebuah fitur belum dapat diimplementasikan secara benar, dokumentasikan dependency dan alasannya.

---

# 2. PRODUCT VISION

Bangun platform dokumentasi foto event yang memungkinkan peserta/pengunjung melihat dan mengunduh foto dokumentasi event tanpa harus login.

Contoh penggunaan:

> Sebuah event berlangsung selama 5 hari.

Setiap hari tim dokumentasi mengunggah foto ke Google Drive.

Peserta cukup menerima satu URL:

```text
https://gallery.example.com/e/nama-event
```

Peserta membuka URL tersebut dan dapat:

```text
Event
  ↓
Hari / Day
  ↓
Album / Kategori
  ↓
Foto
  ↓
Preview
  ↓
Download
```

Tidak ada:

- visitor login
- visitor registration
- payment
- checkout
- purchase
- membership

Fokus utama:

> **Membuat dokumentasi foto event mudah ditemukan, mudah dilihat, dan mudah diunduh.**

---

# 3. IMPORTANT ARCHITECTURE DECISION

Gunakan arsitektur:

```text
                    ┌───────────────────┐
                    │      VISITOR      │
                    │  No Login Needed  │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      VERCEL       │
                    │    Next.js App    │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌─────────────────┐   ┌──────────────────┐
           │   PostgreSQL    │   │   Google Drive   │
           │    / Supabase   │   │  Photo Storage   │
           └─────────────────┘   └──────────────────┘
```

GitHub berfungsi sebagai:

```text
Source Code
Version Control
CI/CD Source
Documentation
```

Vercel berfungsi sebagai:

```text
Production Application
Frontend
Backend/API
Server-side Logic
```

PostgreSQL/Supabase:

```text
Metadata
Events
Days
Albums
Photo Records
Users
Sync Jobs
Settings
```

Google Drive:

```text
Original Photo Storage
```

---

# 4. VERY IMPORTANT: DO NOT USE GITHUB AS STORAGE

Jangan menyimpan foto event di:

- GitHub repository
- PostgreSQL
- Vercel filesystem

Foto tetap berada di Google Drive.

Database hanya menyimpan metadata.

Contoh:

```text
drive_file_id
filename
mime_type
size
width
height
modified_time
thumbnail_url
preview_url
download_url
album_id
event_day_id
status
```

---

# 5. DO NOT QUERY GOOGLE DRIVE ON EVERY VISITOR REQUEST

Jangan membuat sistem seperti:

```text
Visitor
 ↓
Google Drive API
 ↓
Photo
```

untuk setiap request.

Gunakan:

```text
Google Drive
      ↓
Sync Worker
      ↓
PostgreSQL
      ↓
Vercel Application
      ↓
Visitor
```

Tujuannya:

- mengurangi API calls
- meningkatkan performance
- mengurangi latency
- menghindari quota problem
- memungkinkan pagination
- memungkinkan search
- memungkinkan filtering
- memungkinkan caching

Google Drive adalah:

> Source of photo files.

Database adalah:

> Source of application metadata/index.

---

# 6. PRODUCT NAME

Gunakan nama sementara:

```text
Nusantara Event Gallery
```

Tetapi buat sistem branding configurable sehingga nama dapat diubah dari Admin.

Brand default:

```text
Nusantara Mobile Studio
```

Website:

```text
https://holisahmad.github.io/nusantaramobilestudio/
```

Website company tersebut tidak perlu dipindahkan.

Platform gallery merupakan aplikasi terpisah.

---

# 7. TARGET USERS

## 7.1 Visitor

Visitor:

- tidak perlu login
- membuka event URL
- melihat event
- memilih hari
- memilih album
- melihat foto
- membuka fullscreen
- download foto
- share foto
- menggunakan mobile device

---

## 7.2 Admin

Admin dapat:

- login
- membuat event
- edit event
- publish/unpublish event
- membuat event day
- membuat album
- menghubungkan Google Drive folder
- menjalankan sync
- melihat status sync
- mengatur cover
- mengatur branding
- mengatur SEO
- melihat jumlah foto
- mengelola visibility

---

## 7.3 Documentation Team

Documentation team pada V1 tidak harus mempunyai akun khusus.

Mereka cukup:

```text
Upload photos → Google Drive
```

Kemudian sistem melakukan sync.

Contoh struktur Google Drive:

```text
EVENT-ARCHERY-2026/
│
├── DAY-01/
│   ├── QUALIFICATION/
│   ├── PRACTICE/
│   └── AWARD/
│
├── DAY-02/
│   ├── QUALIFICATION/
│   └── MATCH/
│
├── DAY-03/
├── DAY-04/
└── DAY-05/
```

---

# 8. PUBLIC URL STRUCTURE

Gunakan URL yang bersih.

Contoh:

```text
/e/archery-national-2026
```

Day:

```text
/e/archery-national-2026/day/1
```

Album:

```text
/e/archery-national-2026/day/1/qualification
```

Photo:

```text
/e/archery-national-2026/photo/abc123
```

Jangan menggunakan URL berdasarkan Google Drive ID sebagai public URL.

---

# 9. PUBLIC EVENT PAGE

Halaman event harus terasa seperti website event profesional.

Contoh:

```text
┌──────────────────────────────────┐
│          EVENT COVER             │
│                                  │
│       ARCHERY NATIONAL 2026      │
│       Yogyakarta                 │
│       12–16 September 2026       │
│                                  │
│       [Explore Photos]           │
└──────────────────────────────────┘
```

Kemudian:

```text
EVENT OVERVIEW

5 DAYS
24 ALBUMS
18,452 PHOTOS
```

Lalu:

```text
EVENT DAYS

DAY 01
Qualification

DAY 02
Match

DAY 03
Final

...
```

---

# 10. UI/UX DIRECTION

Jangan membuat UI seperti file manager Google Drive.

Jangan membuat tampilan seperti:

```text
Folder
Folder
Folder
File
File
File
```

Gunakan pendekatan:

> Premium Editorial Photography Gallery.

Inspirasi UX:

- modern photography portfolio
- event media gallery
- editorial layout
- masonry gallery
- justified gallery
- immersive fullscreen viewer

Tetapi jangan menyalin desain website tertentu.

Buat desain original.

---

# 11. DESIGN PRINCIPLES

Prioritas:

1. Easy to use
2. Fast
3. Visual
4. Mobile-first
5. Minimal
6. Professional
7. Accessible

Visitor harus dapat menemukan foto dengan maksimal beberapa tap.

Contoh:

```text
Open URL
 ↓
Select DAY
 ↓
Select ALBUM
 ↓
Browse
 ↓
Open PHOTO
 ↓
Download
```

---

# 12. PHOTO GRID

Gunakan:

- masonry grid atau justified gallery
- responsive columns
- lazy loading
- progressive image loading
- thumbnail
- preview
- original download

Desktop:

```text
4–6 columns
```

Tablet:

```text
3–4 columns
```

Mobile:

```text
2 columns
```

Jangan langsung memuat file original untuk gallery grid.

---

# 13. IMAGE PIPELINE

Gunakan konsep:

```text
ORIGINAL
   │
   ├── Thumbnail
   │
   ├── Preview
   │
   └── Original
```

Gallery menggunakan:

```text
thumbnail
```

Photo viewer menggunakan:

```text
preview
```

Download menggunakan:

```text
original
```

Jika Google Drive menyediakan mekanisme thumbnail/preview yang sesuai, gunakan mekanisme tersebut.

Jangan meng-copy seluruh foto ke database/server.

---

# 14. PHOTO VIEWER

Photo viewer harus mendukung:

- fullscreen
- next
- previous
- swipe
- pinch zoom pada mobile
- keyboard navigation desktop
- download
- share
- close
- image counter

Contoh:

```text
              ┌───────────────┐
              │               │
              │     PHOTO     │
              │               │
              │               │
              └───────────────┘

       ←                         →

             127 / 4,823

     [Download] [Share] [Close]
```

---

# 15. DOWNLOAD

Visitor dapat:

```text
Download Photo
```

Tanpa login.

Jangan mengirimkan credential Google Drive ke browser.

Gunakan server-side mechanism yang aman.

Pertimbangkan:

- signed URL
- controlled redirect
- Google Drive download endpoint
- proxy jika diperlukan

Jangan expose:

```text
Google Service Account credentials
OAuth refresh token
Database credentials
```

ke client.

---

# 16. SEARCH

Implementasikan search berdasarkan metadata.

Search dapat mencari:

```text
filename
album
day
category
```

Contoh:

```text
Search:
"archer_001"
```

atau:

```text
Search:
"Final"
```

Jangan search langsung ke Google Drive untuk setiap query visitor.

Gunakan PostgreSQL.

---

# 17. FILTER

Tambahkan filter:

```text
All
Day
Album
Category
```

Future:

```text
Date
Photographer
Tag
Location
```

---

# 18. FAVORITES

V1 dapat menggunakan:

```text
LocalStorage
```

sehingga visitor dapat menandai foto favorit tanpa akun.

Contoh:

```text
♡ Favorite
```

Data favorite tidak harus disimpan di database pada V1.

---

# 19. SHARE

Foto dapat dibagikan menggunakan:

```text
Web Share API
```

Fallback:

```text
Copy Link
```

Share URL harus mengarah ke halaman foto.

---

# 20. QR CODE

Admin dapat membuat QR Code untuk event.

Contoh:

```text
SCAN TO VIEW EVENT PHOTOS

        █████████
        ██     ██
        ██ QR  ██
        ██     ██
        █████████

archery-national-2026
```

QR Code dapat digunakan:

- banner
- meja registrasi
- venue
- poster
- merchandise
- social media

---

# 21. ADMIN DASHBOARD

Admin dashboard harus mempunyai sidebar:

```text
Dashboard

Events
├── All Events
├── Create Event

Media
├── Days
├── Albums
├── Photos

Google Drive
├── Connections
├── Sync
├── Sync History

Appearance
├── Branding
├── Theme

SEO
├── Metadata
├── Social Preview

Tools
├── QR Code
├── Cache

System
├── Admin Users
├── Settings
├── Logs
```

---

# 22. ADMIN DASHBOARD — EVENT

Event fields:

```text
id
slug
title
description
location
start_date
end_date
timezone
cover_photo_id
status
published_at
created_at
updated_at
```

Status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 23. EVENT DAY

Fields:

```text
id
event_id
day_number
title
description
date
cover_photo_id
sort_order
status
created_at
updated_at
```

Example:

```text
Day 01
12 September 2026

Qualification
```

---

# 24. ALBUM

Fields:

```text
id
event_day_id
name
slug
description
cover_photo_id
drive_folder_id
sort_order
status
created_at
updated_at
```

---

# 25. MEDIA FILE

Fields:

```text
id
event_id
event_day_id
album_id

drive_file_id

filename
mime_type
file_size

width
height

thumbnail_url
preview_url
download_url

drive_modified_at

status

created_at
updated_at
```

Status:

```text
ACTIVE
HIDDEN
DELETED
```

---

# 26. GOOGLE DRIVE INTEGRATION

Buat abstraction:

```typescript
interface StorageProvider {
  connect(): Promise<void>

  listFolders(): Promise<Folder[]>

  listFiles(folderId: string): Promise<File[]>

  getFile(fileId: string): Promise<File>

  getThumbnail(fileId: string): Promise<string>

  getPreview(fileId: string): Promise<string>

  getDownloadUrl(fileId: string): Promise<string>

  syncFolder(folderId: string): Promise<SyncResult>
}
```

Implementasi pertama:

```text
GoogleDriveStorageProvider
```

Future:

```text
S3StorageProvider
CloudflareR2StorageProvider
WasabiStorageProvider
```

Jangan mengikat seluruh application logic langsung ke Google Drive SDK.

---

# 27. GOOGLE DRIVE CONNECTION

Admin harus dapat:

```text
Connect Google Drive
```

Kemudian:

```text
Select Event
      ↓
Select Drive Folder
      ↓
Map Folder
      ↓
Sync
```

Admin dapat melihat:

```text
Connected
Last Sync
Files Found
Files Added
Files Updated
Files Removed
Errors
```

---

# 28. SYNC SYSTEM

Sync harus bersifat incremental.

Jangan selalu:

```text
DELETE ALL
IMPORT ALL
```

Gunakan:

```text
drive_file_id
modified_time
checksum/hash jika tersedia
```

Flow:

```text
Google Drive
      ↓
Discover Files
      ↓
Compare DB
      ↓
New?
      ├── YES → INSERT
      │
      └── NO
           ↓
       Modified?
           ├── YES → UPDATE
           └── NO → SKIP
```

File yang dihapus dari Drive:

```text
ACTIVE → DELETED
```

Jangan langsung hard delete kecuali admin memilihnya.

---

# 29. SYNC JOB

Buat entity:

```text
sync_jobs
```

Fields:

```text
id
event_id
album_id
provider
status

started_at
completed_at

total_files
added_files
updated_files
deleted_files
failed_files

error_message
created_at
```

Status:

```text
QUEUED
RUNNING
COMPLETED
PARTIAL
FAILED
```

---

# 30. AUTOMATIC SYNC

V1:

```text
Manual Sync
```

Future:

```text
Scheduled Sync
```

Contoh:

```text
Every 15 minutes
Every 30 minutes
Every 1 hour
```

Jika deployment environment tidak mendukung long-running workers, gunakan:

- cron
- scheduled function
- queue
- background job provider

Jangan membuat proses sync yang bergantung pada browser admin tetap terbuka.

---

# 31. DATABASE

Gunakan:

```text
PostgreSQL
```

Direkomendasikan:

```text
Supabase PostgreSQL
```

Database harus menyimpan metadata aplikasi.

Minimal tables:

```text
admin_users
events
event_days
albums
media_files
media_categories
categories
featured_media
storage_connections
sync_jobs
site_settings
audit_logs
```

---

# 32. DATABASE RELATIONSHIP

```text
ADMIN USER
    │
    └── audit_logs

EVENT
 │
 ├── EVENT DAYS
 │      │
 │      └── ALBUMS
 │              │
 │              └── MEDIA FILES
 │
 ├── FEATURED MEDIA
 │
 └── SYNC JOBS
```

---

# 33. MULTI-EVENT

Architecture harus sejak awal mendukung:

```text
Event A
Event B
Event C
Event D
...
```

Contoh:

```text
/e/archery-national-2026

/e/music-festival-2026

/e/sports-day-2026

/e/company-gathering-2026
```

Jangan membuat sistem yang hanya bekerja untuk satu event.

---

# 34. EVENT ISOLATION

Data event harus terisolasi.

Visitor:

```text
/e/event-a
```

tidak boleh melihat media:

```text
event-b
```

Semua query media harus mempunyai filter:

```text
event_id
```

dan validasi relasi.

---

# 35. ADMIN AUTHENTICATION

Visitor:

```text
NO LOGIN
```

Admin:

```text
LOGIN REQUIRED
```

Gunakan authentication yang aman.

Password:

```text
HASHED
```

Jangan menyimpan plaintext password.

Tambahkan:

- session management
- secure cookies
- CSRF protection bila diperlukan
- rate limiting
- login throttling
- logout
- optional 2FA architecture

---

# 36. SECURITY

Jangan pernah expose:

```text
DATABASE_URL
GOOGLE_CLIENT_SECRET
GOOGLE_SERVICE_ACCOUNT
OAUTH_REFRESH_TOKEN
API_SECRET
ADMIN_SECRET
```

ke frontend.

Semua secrets berada di:

```text
Vercel Environment Variables
```

atau secret manager.

`.env`:

```text
.env.local
```

harus masuk:

```text
.gitignore
```

Jangan commit:

```text
.env
*.pem
*.key
service-account.json
credentials.json
```

---

# 37. PUBLIC DATABASE SECURITY

Database tidak berarti harus public.

Public:

```text
Event page
Photo gallery
Photo metadata yang memang ditampilkan
```

Private:

```text
Database credentials
Admin data
Google credentials
Sync jobs
Internal logs
System settings
```

Visitor tidak boleh mempunyai direct database credentials.

---

# 38. API DESIGN

Gunakan API/service layer yang jelas.

Contoh:

```text
GET /api/events/:slug

GET /api/events/:slug/days

GET /api/events/:slug/albums

GET /api/events/:slug/photos

GET /api/photos/:id

GET /api/photos/:id/download
```

Admin:

```text
POST   /api/admin/events
PATCH  /api/admin/events/:id
DELETE /api/admin/events/:id

POST /api/admin/sync
GET  /api/admin/sync/jobs

POST /api/admin/albums
PATCH /api/admin/albums/:id
```

Jangan membuat API yang membocorkan internal data.

---

# 39. PAGINATION

Jangan load:

```text
10,000 photos
```

sekaligus.

Gunakan:

```text
cursor pagination
```

atau pagination yang sesuai.

Contoh:

```text
20–60 photos per request
```

Load berikutnya ketika diperlukan.

Gunakan:

```text
Infinite Scroll
```

atau:

```text
Load More
```

sesuai UX terbaik.

---

# 40. LARGE EVENT SUPPORT

Sistem harus dirancang untuk event dengan:

```text
1,000 photos
10,000 photos
50,000 photos
100,000+ photos
```

Jangan mengasumsikan jumlah foto kecil.

Optimalkan:

- database indexing
- pagination
- caching
- image loading
- API queries
- Drive API calls
- sync
- frontend rendering

---

# 41. DATABASE INDEXING

Buat index minimal:

```text
events.slug
events.status

event_days.event_id
event_days.sort_order

albums.event_day_id
albums.drive_folder_id

media_files.event_id
media_files.event_day_id
media_files.album_id
media_files.drive_file_id
media_files.status
media_files.drive_modified_at
```

Tambahkan index search bila diperlukan.

---

# 42. CACHING

Gunakan caching untuk:

```text
event metadata
day list
album list
photo metadata
```

Jangan melakukan query database yang sama secara tidak perlu.

Gunakan mekanisme caching Next.js/Vercel yang sesuai.

Pastikan cache dapat di-invalidasi setelah sync.

Flow:

```text
Drive Sync
    ↓
Database Update
    ↓
Cache Invalidation
    ↓
Visitor sees new photos
```

---

# 43. SEO

Setiap event harus mempunyai:

```text
title
description
canonical URL
Open Graph image
Twitter/X card metadata
```

Contoh:

```text
Archery National Championship 2026
Event Documentation Gallery
Yogyakarta
```

Photo page juga harus mempunyai metadata yang sesuai.

---

# 44. SOCIAL SHARING

Ketika URL event dibagikan:

```text
https://gallery.example.com/e/archery-national-2026
```

harus menghasilkan preview:

```text
[EVENT COVER]

Archery National Championship 2026
Event Documentation Gallery
```

---

# 45. ACCESSIBILITY

Minimal:

```text
WCAG-aware implementation
```

Gunakan:

- semantic HTML
- alt text
- keyboard navigation
- focus state
- readable contrast
- accessible buttons
- aria-label
- reduced-motion support

---

# 46. RESPONSIVE DESIGN

Target:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Prioritas:

```text
Mobile First
```

Pastikan gallery nyaman digunakan pada:

```text
Android
iPhone
Tablet
Desktop
```

---

# 47. PWA

Pertimbangkan PWA pada V1/V1.1:

```text
Add to Home Screen
App-like experience
Offline shell
```

Namun foto tidak harus offline.

---

# 48. BRANDING SYSTEM

Admin dapat mengatur:

```text
Logo
Primary Color
Secondary Color
Background
Typography
Event Accent
Footer
Social Links
```

Default:

```text
Nusantara Mobile Studio
```

Jangan hard-code seluruh branding.

---

# 49. DARK MODE

Support:

```text
Light
Dark
System
```

Untuk photography gallery, dark mode harus menjadi pengalaman visual yang serius, bukan sekadar mengganti background.

---

# 50. HOME PAGE PLATFORM

Platform dapat memiliki:

```text
/
```

berisi:

```text
Nusantara Event Gallery

Latest Events
Featured Events
Search Events
```

Namun visitor event dapat langsung masuk melalui:

```text
/e/:eventSlug
```

---

# 51. EVENT DISCOVERY

V1:

```text
Direct Event URL
```

Future:

```text
Public Event Directory
```

dengan:

```text
Search
Filter
Date
Location
Category
```

---

# 52. ADMIN EVENT PUBLISHING

Event dapat:

```text
Draft
Published
Archived
```

Event Draft:

```text
Tidak dapat diakses public
```

Event Published:

```text
Dapat diakses public
```

Event Archived:

```text
Tidak muncul di discovery
```

tetapi dapat tetap memiliki URL jika kebijakan produk mengizinkan.

---

# 53. EVENT COVER

Setiap event harus memiliki cover.

Admin dapat:

```text
Select Photo as Cover
```

atau future:

```text
Upload Cover
```

Jika cover belum tersedia:

```text
gunakan placeholder yang elegan
```

Jangan tampilkan broken image.

---

# 54. ALBUM COVER

Album juga memiliki cover.

Prioritas:

```text
Admin selected cover
        ↓
First available photo
        ↓
Placeholder
```

---

# 55. EMPTY STATES

Jangan tampilkan halaman kosong.

Contoh:

```text
Photos are coming soon.

The documentation team is still uploading photos.
Please check again later.
```

Untuk bahasa Indonesia:

```text
Foto sedang diproses.

Tim dokumentasi masih mengunggah foto.
Silakan cek kembali beberapa saat lagi.
```

---

# 56. ERROR HANDLING

Buat error state yang ramah.

Contoh:

```text
Event not found
```

```text
Album unavailable
```

```text
Photo unavailable
```

```text
Temporary server error
```

Jangan menampilkan:

```text
SQL error
Google API error
stack trace
secret
internal ID
```

kepada visitor.

---

# 57. PERFORMANCE TARGET

Target:

```text
Fast initial load
Fast mobile interaction
Low JavaScript payload
Optimized images
Lazy loading
Caching
Pagination
```

Gunakan:

- Server Components bila sesuai
- Client Components hanya ketika diperlukan
- dynamic import
- lazy loading
- optimized image strategy
- caching

Jangan menggunakan library besar jika tidak diperlukan.

---

# 58. VERCEL DEPLOYMENT

Production:

```text
GitHub
   ↓
Vercel
   ↓
Production
```

Setiap push ke main:

```text
Build
 ↓
Test
 ↓
Deploy
```

Preview deployment:

```text
Pull Request
 ↓
Vercel Preview
```

---

# 59. ENVIRONMENT

Minimal:

```text
DATABASE_URL=
DIRECT_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GOOGLE_SERVICE_ACCOUNT=
```

Tambahkan hanya variable yang benar-benar diperlukan.

Buat:

```text
.env.example
```

tanpa secret.

---

# 60. GITHUB

Repository harus memiliki:

```text
README.md
ARCHITECTURE.md
SETUP.md
ENVIRONMENT.md
GOOGLE_DRIVE_SETUP.md
DATABASE.md
DEPLOYMENT.md
ADMIN_GUIDE.md
API.md
SECURITY.md
TROUBLESHOOTING.md
```

GitHub repository boleh public jika owner menginginkannya.

Tetapi:

> Public repository ≠ public secrets.

---

# 61. GITIGNORE

Pastikan minimal:

```text
.env
.env.local
.env.*.local

node_modules
.next
.vercel

*.pem
*.key

service-account.json
credentials.json
```

---

# 62. DATABASE MIGRATION

Gunakan migration system.

Jangan membuat perubahan schema manual tanpa migration.

Setiap perubahan database harus:

```text
migration
 ↓
test
 ↓
deploy
```

---

# 63. ORM

Gunakan salah satu:

```text
Prisma
```

atau:

```text
Drizzle
```

Pilih satu berdasarkan:

- Vercel compatibility
- Supabase PostgreSQL compatibility
- developer experience
- migration reliability
- performance

Dokumentasikan alasan pemilihan.

---

# 64. UI COMPONENT ARCHITECTURE

Buat reusable components:

```text
EventCard
DayCard
AlbumCard
PhotoCard
PhotoGrid
PhotoViewer
DownloadButton
ShareButton
SearchBar
FilterBar
EmptyState
LoadingState
ErrorState
Breadcrumb
Header
Footer
QRCode
AdminSidebar
AdminTable
SyncStatus
```

Jangan duplicate component.

---

# 65. DESIGN SYSTEM

Buat:

```text
Typography
Spacing
Radius
Shadow
Button
Input
Card
Modal
Drawer
Toast
Badge
Skeleton
```

Gunakan design tokens.

---

# 66. ADMIN UX

Admin dashboard harus:

- mudah dipahami
- tidak terlalu teknis
- responsive
- memiliki confirmation untuk destructive action
- menampilkan progress sync
- menampilkan error yang jelas

Contoh:

```text
Sync Google Drive

Scanning...
2,381 files found

New       147
Updated    23
Deleted     5

████████████████░░ 82%
```

---

# 67. AUDIT LOG

Catat aktivitas penting:

```text
LOGIN
CREATE_EVENT
UPDATE_EVENT
DELETE_EVENT
PUBLISH_EVENT
UNPUBLISH_EVENT
START_SYNC
SYNC_COMPLETED
UPDATE_SETTINGS
```

Fields:

```text
user_id
action
entity
entity_id
metadata
ip_hash / safe metadata if required
created_at
```

Jangan menyimpan data sensitif yang tidak diperlukan.

---

# 68. RATE LIMITING

Implementasikan rate limiting untuk:

```text
Login
Admin APIs
Download endpoint
Search endpoint
Sync endpoint
```

Public gallery tetap harus nyaman digunakan.

---

# 69. ABUSE PROTECTION

Karena visitor tidak login, pertimbangkan:

- rate limit
- bot protection
- download throttling
- request validation
- cache
- abuse logging

Jangan membuat security yang menghambat visitor normal.

---

# 70. PRIVACY

Jangan mengumpulkan data visitor yang tidak diperlukan.

V1 tidak membutuhkan:

```text
Visitor account
Name
Email
Phone
Password
```

Jika analytics ditambahkan, dokumentasikan:

- data yang dikumpulkan
- tujuan
- retention
- privacy implications

---

# 71. GOOGLE DRIVE PERMISSION MODEL

Jangan menjadikan seluruh Google Drive publik hanya untuk membuat gallery bekerja.

Gunakan server-side authenticated access jika memungkinkan.

Google Drive:

```text
Private Storage
```

Application:

```text
Controlled Public Presentation
```

---

# 72. STORAGE ABSTRACTION

Application jangan bergantung langsung pada:

```typescript
google.drive.files.list(...)
```

di seluruh codebase.

Gunakan:

```text
StorageProvider
```

sehingga nanti dapat diganti:

```text
Google Drive
→ Cloudflare R2
→ Amazon S3
→ Wasabi
```

tanpa mengubah public gallery architecture secara besar.

---

# 73. FUTURE FEATURES

Jangan implementasikan semua pada V1.

Tetapi architecture harus memungkinkan:

### Photographer

```text
Photographer account
Photographer attribution
```

### Face Recognition

```text
Find my photos
```

Ini memerlukan privacy/security design khusus.

### AI Search

Contoh:

```text
Find photos of archers wearing blue
```

### Smart Tags

```text
archery
award
final
ceremony
crowd
```

### Watermark

```text
Preview watermark
Original without watermark
```

### Analytics

```text
Event views
Album views
Photo views
Downloads
```

### Multiple Storage Providers

```text
Google Drive
S3
R2
Wasabi
```

### Custom Domain

```text
gallery.client.com
```

---

# 74. V1 SCOPE

Jangan over-engineer.

V1 wajib memiliki:

```text
✓ Public Event Page
✓ Event Days
✓ Albums
✓ Photo Gallery
✓ Photo Viewer
✓ Download
✓ Share
✓ Search
✓ Filters
✓ Admin Login
✓ Event Management
✓ Album Management
✓ Google Drive Mapping
✓ Google Drive Sync
✓ Sync Status
✓ QR Code
✓ Responsive UI
✓ SEO
✓ Caching
✓ PostgreSQL
✓ Vercel deployment
```

---

# 75. V1.1

Setelah V1 stabil:

```text
Favorites
PWA
Automatic Sync
Analytics
Advanced filtering
Event Directory
```

---

# 76. V2

```text
Multiple storage providers
Photographer management
Advanced analytics
AI photo search
Face-based photo discovery
Watermark system
Custom domains
Client portals
```

---

# 77. DEVELOPMENT WORKFLOW

Sebelum coding:

```text
1. Inspect existing repository
2. Understand existing structure
3. Identify existing dependencies
4. Identify current Git configuration
5. Identify deployment configuration
6. Propose architecture
7. Create documentation
8. Create database schema
9. Create implementation plan
10. Start development
```

Jangan langsung menghapus existing code.

Jika repository kosong:

```text
Create clean production architecture.
```

Jika repository sudah memiliki application:

```text
Preserve useful existing work.
```

---

# 78. DO NOT MAKE ASSUMPTIONS

Jika menemukan:

```text
missing credentials
missing database
missing Google configuration
missing deployment settings
```

jangan membuat credential palsu.

Gunakan:

```text
.env.example
```

dan dokumentasikan langkah setup.

---

# 79. NO FAKE IMPLEMENTATION

Dilarang membuat:

```text
fake sync
fake Google Drive
fake database
fake authentication
fake download
```

yang kemudian dianggap selesai.

Mock hanya boleh digunakan:

```text
unit test
development fixture
UI development
```

dan harus jelas diberi label.

---

# 80. TESTING

Minimal:

### Unit Test

Test:

```text
database services
storage provider
sync logic
slug generation
validation
permission checks
```

### Integration Test

Test:

```text
Database
Google Drive adapter
API
authentication
sync
```

### E2E Test

Test:

```text
Visitor opens event
Visitor selects day
Visitor selects album
Visitor opens photo
Visitor downloads photo
Admin login
Admin creates event
Admin maps Drive
Admin runs sync
```

---

# 81. SECURITY TEST

Test:

```text
Unauthenticated admin access
Cross-event access
Invalid IDs
SQL injection protection
XSS
CSRF
Rate limiting
Secret exposure
Unauthorized download
```

---

# 82. BUILD CHECK

Before declaring completion:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Jika project menggunakan command berbeda, dokumentasikan command aktual.

Tidak boleh menyatakan:

```text
READY
```

jika build/test gagal tanpa penjelasan.

---

# 83. DEPLOYMENT CHECKLIST

Production checklist:

```text
[ ] GitHub repository configured
[ ] Vercel project connected
[ ] Production environment variables configured
[ ] Supabase/PostgreSQL configured
[ ] Database migration executed
[ ] Google Drive authentication configured
[ ] Google Drive folder connected
[ ] Sync tested
[ ] Public event tested
[ ] Download tested
[ ] Admin authentication tested
[ ] Mobile tested
[ ] Desktop tested
[ ] SEO tested
[ ] Error pages tested
[ ] Security checked
[ ] Build successful
```

---

# 84. INITIAL TEST DATA

Create development seed:

```text
Event:
Archery National Championship 2026

Days:
Day 01
Day 02
Day 03
Day 04
Day 05

Albums:
Qualification
Practice
Match
Final
Award Ceremony
```

Gunakan dummy metadata jika Google Drive belum dikonfigurasi.

Jangan memasukkan data produksi.

---

# 85. DESIGN EXAMPLE

Landing event:

```text
┌─────────────────────────────────────────┐
│ NUSANTARA EVENT GALLERY                 │
│                                         │
│       ARCHERY NATIONAL 2026             │
│       YOGYAKARTA                         │
│       12 — 16 SEPTEMBER 2026            │
│                                         │
│       [ EXPLORE PHOTOS ]                │
│                                         │
└─────────────────────────────────────────┘

        5 DAYS   ·   24 ALBUMS
```

Day section:

```text
EVENT DAYS

┌──────────────┐ ┌──────────────┐
│ DAY 01       │ │ DAY 02       │
│ Qualification│ │ Match        │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ DAY 03       │ │ DAY 04       │
│ Semi Final   │ │ Final        │
└──────────────┘ └──────────────┘
```

Album:

```text
DAY 01

[ Qualification ]
[ Practice ]
[ Official Session ]
```

Gallery:

```text
┌───────┐ ┌────────┐
│ PHOTO │ │ PHOTO  │
├───────┤ │        │
│       ├─┴────────┤
│ PHOTO │  PHOTO   │
└───────┘          │
                   │
```

---

# 86. IMPORTANT UX RULE

Jangan membuat visitor berpikir:

> "Saya harus mencari file."

Visitor harus merasa:

> "Saya sedang melihat dokumentasi event."

Ini adalah:

```text
Photo Experience
```

bukan:

```text
File Browser
```

---

# 87. COST-AWARE ARCHITECTURE

Target awal:

```text
Minimize infrastructure cost.
```

Gunakan:

```text
GitHub
+
Vercel
+
Supabase/PostgreSQL
+
Google Drive
```

Pada tahap development/prototype gunakan free tiers jika sesuai dengan provider dan penggunaan.

Tetapi architecture harus siap untuk upgrade ketika:

```text
traffic meningkat
event bertambah
photo count meningkat
commercial usage dimulai
```

Jangan membuat architecture yang bergantung secara permanen pada free tier.

---

# 88. IMPORTANT STORAGE PRINCIPLE

Untuk event photography:

```text
Storage = Google Drive
Metadata = PostgreSQL
Application = Vercel
Source Code = GitHub
```

Jangan menggunakan PostgreSQL sebagai image storage.

Jangan menggunakan GitHub sebagai image storage.

Jangan menggunakan Vercel filesystem sebagai permanent photo storage.

---

# 89. SCALABILITY ROADMAP

Initial:

```text
1 platform
1 admin
multiple events
Google Drive
PostgreSQL
Vercel
```

Future:

```text
multiple admins
multiple organizations
multiple storage providers
custom domains
large-scale event traffic
CDN/image processing
subscription/business model
```

Architecture harus memungkinkan evolusi tersebut tanpa rewrite total.

---

# 90. EXPECTED PROJECT STRUCTURE

Gunakan struktur yang bersih, misalnya:

```text
src/
├── app/
│   ├── page.tsx
│   ├── e/
│   │   └── [eventSlug]/
│   │       ├── page.tsx
│   │       ├── day/
│   │       │   └── [dayNumber]/
│   │       ├── album/
│   │       │   └── [albumSlug]/
│   │       └── photo/
│   │           └── [photoId]/
│   │
│   ├── admin/
│   │   ├── login/
│   │   └── dashboard/
│   │
│   └── api/
│
├── components/
├── lib/
│   ├── db/
│   ├── auth/
│   ├── storage/
│   │   ├── storage-provider.ts
│   │   └── google-drive/
│   ├── sync/
│   ├── cache/
│   └── validation/
│
├── services/
├── repositories/
├── types/
└── config/
```

Agent boleh menyesuaikan struktur jika ada alasan teknis yang lebih baik.

---

# 91. CODE QUALITY

Gunakan:

```text
TypeScript strict mode
```

Hindari:

```text
any
```

kecuali benar-benar diperlukan.

Gunakan:

```text
typed interfaces
schema validation
error handling
logging
service boundaries
```

---

# 92. VALIDATION

Gunakan schema validation untuk:

```text
API input
Admin forms
Environment variables
Database input
Query parameters
```

Jangan mempercayai input client.

---

# 93. LOGGING

Gunakan structured logging.

Jangan log:

```text
password
API key
OAuth token
database credentials
service account private key
```

---

# 94. DOCUMENTATION REQUIREMENT

Agent wajib membuat atau memperbarui:

```text
README.md
ARCHITECTURE.md
SETUP.md
ENVIRONMENT.md
GOOGLE_DRIVE_SETUP.md
DATABASE.md
DEPLOYMENT.md
ADMIN_GUIDE.md
SECURITY.md
API.md
TROUBLESHOOTING.md
```

Dokumentasi harus menjelaskan:

```text
apa sistem ini
cara install
cara menjalankan
cara setup Supabase
cara setup Google Drive
cara menjalankan migration
cara membuat admin
cara membuat event
cara mapping folder
cara sync
cara deploy ke Vercel
cara troubleshooting
```

---

# 95. AI AGENT WORKING RULES

Sebagai AI coding agent:

### Rule 1

Inspect first.

### Rule 2

Plan before modifying.

### Rule 3

Do not blindly rewrite the project.

### Rule 4

Do not delete existing functionality without reason.

### Rule 5

Do not expose secrets.

### Rule 6

Do not fabricate API behavior.

### Rule 7

Verify official documentation for external APIs when necessary.

### Rule 8

Write tests for important business logic.

### Rule 9

Run lint/typecheck/test/build.

### Rule 10

Document important architectural decisions.

### Rule 11

Keep implementation modular.

### Rule 12

Prefer simple reliable architecture over unnecessary complexity.

---

# 96. IMPLEMENTATION PHASES

## PHASE 0 — DISCOVERY

Agent harus:

```text
inspect repository
inspect package.json
inspect existing source
inspect deployment
inspect Git configuration
```

Output:

```text
PROJECT_AUDIT.md
```

---

# PHASE 1 — FOUNDATION

Implement:

```text
Next.js
TypeScript
Tailwind
Database
ORM
Environment system
Basic architecture
```

---

# PHASE 2 — DATABASE

Implement:

```text
schema
migration
seed
repositories
services
```

---

# PHASE 3 — ADMIN

Implement:

```text
authentication
dashboard
event CRUD
day CRUD
album CRUD
```

---

# PHASE 4 — GOOGLE DRIVE

Implement:

```text
StorageProvider
GoogleDriveProvider
folder mapping
file discovery
metadata sync
sync jobs
```

---

# PHASE 5 — PUBLIC GALLERY

Implement:

```text
event page
days
albums
photo grid
photo viewer
download
share
search
filter
```

---

# PHASE 6 — UX/PERFORMANCE

Implement:

```text
responsive
lazy loading
pagination
caching
skeleton
error state
empty state
SEO
social metadata
```

---

# PHASE 7 — QR CODE

Implement:

```text
event QR generator
download QR
print-friendly layout
```

---

# PHASE 8 — TESTING

Run:

```text
unit
integration
E2E
security
mobile
desktop
performance
```

---

# PHASE 9 — DEPLOYMENT

Deploy:

```text
GitHub
 ↓
Vercel
 ↓
Supabase
 ↓
Google Drive
```

Test production end-to-end.

---

# 97. DEFINITION OF DONE

Project hanya boleh dianggap selesai jika:

```text
[✓] Public event works
[✓] Visitor does not need login
[✓] Admin authentication works
[✓] Event CRUD works
[✓] Day CRUD works
[✓] Album CRUD works
[✓] Google Drive connection works
[✓] Google Drive sync works
[✓] Metadata stored in PostgreSQL
[✓] Photos remain in Google Drive
[✓] Gallery pagination works
[✓] Photo viewer works
[✓] Download works
[✓] Share works
[✓] Search works
[✓] Filter works
[✓] QR code works
[✓] SEO works
[✓] Mobile responsive
[✓] Desktop responsive
[✓] Security reviewed
[✓] Tests pass
[✓] Production build passes
[✓] Vercel deployment works
```

---

# 98. FINAL PRINCIPLE

Bangun sistem ini bukan sebagai:

> "Website untuk menampilkan folder Google Drive."

Tetapi sebagai:

> **A professional event photography documentation platform where Google Drive acts as the storage backend.**

Visitor experience:

```text
EVENT
 ↓
DAY
 ↓
ALBUM
 ↓
PHOTO
 ↓
VIEW
 ↓
DOWNLOAD
```

Admin experience:

```text
CREATE EVENT
 ↓
MAP GOOGLE DRIVE
 ↓
SYNC
 ↓
PUBLISH
 ↓
SHARE EVENT URL / QR
```

Infrastructure:

```text
GitHub
   │
   ▼
Vercel
   │
   ├──────────────► PostgreSQL / Supabase
   │
   └──────────────► Google Drive
```

**Prioritize simplicity, performance, security, visual quality, and maintainability.**

Jangan membangun fitur hanya karena fitur tersebut terlihat menarik.

Setiap fitur harus menjawab salah satu kebutuhan:

```text
Discover
Browse
View
Find
Download
Share
Manage
Sync
Scale
```

Mulai dari V1 yang sederhana tetapi fondasinya benar, kemudian kembangkan secara bertahap.