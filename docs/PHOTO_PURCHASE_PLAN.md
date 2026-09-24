# Rencana Fitur: Beli Foto (Photo Purchase)

**Status:** Belum dikerjakan  
**Prioritas:** High — roadmap utama setelah gallery selesai  
**Estimasi:** 3–4 sprint (2 minggu per sprint)

---

## Ringkasan

Sistem gallery saat ini memungkinkan visitor melihat foto preview (thumbnail sz=800) secara gratis. Fitur **Beli Foto** memungkinkan visitor membeli akses download foto resolusi penuh (original Drive file) per foto atau per paket album.

Foto punya `id` (CUID) dan `displayName` (alias, misal `wss-2026-day1-sesi-pagi-0042`) yang sudah siap sebagai identifikasi unik.

---

## Model Bisnis

### Pilihan pricing (diputuskan saat implementasi):
- **Per foto** — misal Rp 15.000 / foto
- **Per album** — misal Rp 50.000 / semua foto dalam album
- **Per day** — misal Rp 150.000 / semua foto dalam satu hari event
- **Full event** — misal Rp 500.000 / semua foto event

### Download setelah beli:
- File resolusi penuh dari Google Drive (via server proxy, bukan langsung ke Drive)
- Link download berlaku 24 jam atau unlimited (dikonfigurasi per event)
- Bisa download ulang selama dalam batas waktu

---

## Rencana Database

### Model baru yang dibutuhkan:

```prisma
model PurchaseOrder {
  id            String        @id @default(cuid())
  orderNumber   String        @unique  // WSS-2026-001234
  
  // Pembeli
  buyerEmail    String        @map("buyer_email")
  buyerName     String?       @map("buyer_name")
  buyerPhone    String?       @map("buyer_phone")
  
  // Scope yang dibeli
  orderType     OrderType     @map("order_type")  // PHOTO | ALBUM | DAY | EVENT
  eventId       String        @map("event_id")
  albumId       String?       @map("album_id")    // jika beli per album
  eventDayId    String?       @map("event_day_id")
  
  // Payment
  amount        Int           // dalam rupiah (IDR)
  currency      String        @default("IDR")
  paymentMethod String?       @map("payment_method")
  paymentRef    String?       @map("payment_ref")   // ref dari payment gateway
  status        OrderStatus   @default(PENDING)
  paidAt        DateTime?     @map("paid_at")
  expiresAt     DateTime?     @map("expires_at")    // batas waktu download
  
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  
  event         Event         @relation(...)
  items         OrderItem[]
  downloads     PhotoDownload[]
  
  @@index([buyerEmail])
  @@index([status])
  @@index([orderNumber])
  @@map("purchase_orders")
}

model OrderItem {
  id          String        @id @default(cuid())
  orderId     String        @map("order_id")
  mediaFileId String        @map("media_file_id")
  price       Int           // harga per item saat transaksi
  
  order       PurchaseOrder @relation(...)
  mediaFile   MediaFile     @relation(...)
  
  @@map("order_items")
}

model PhotoDownload {
  id          String        @id @default(cuid())
  orderId     String        @map("order_id")
  mediaFileId String        @map("media_file_id")
  downloadedAt DateTime     @default(now()) @map("downloaded_at")
  ipHash      String?       @map("ip_hash")
  
  order       PurchaseOrder @relation(...)
  
  @@map("photo_downloads")
}

enum OrderType {
  PHOTO
  ALBUM
  DAY
  EVENT
}

enum OrderStatus {
  PENDING
  PAID
  EXPIRED
  REFUNDED
  CANCELLED
}
```

### Perubahan di model yang ada:

```prisma
model MediaFile {
  // ... field yang ada ...
  orderItems  OrderItem[]   // relasi baru
}

model Event {
  // ... field yang ada ...
  // Pricing config (bisa di SiteSetting atau di Event langsung)
  pricePerPhoto   Int?      @map("price_per_photo")    // null = gratis
  pricePerAlbum   Int?      @map("price_per_album")
  pricePerDay     Int?      @map("price_per_day")
  priceFullEvent  Int?      @map("price_full_event")
  purchaseOrders  PurchaseOrder[]
}
```

---

## Rencana API

### Public (tidak perlu login)

```
POST /api/orders
  body: { eventId, orderType, albumId?, eventDayId?, photoIds?, buyerEmail, buyerName }
  → buat order PENDING, return { orderId, orderNumber, amount, paymentUrl }

GET /api/orders/:orderNumber
  → cek status order (untuk polling setelah payment)

GET /api/orders/:orderNumber/download
  → verifikasi paid + not expired → return list foto + signed download URLs

GET /api/photos/:id/download-paid?orderNumber=xxx
  → verifikasi order mencakup foto ini → stream file original dari Drive
```

### Admin

```
GET /api/admin/orders?eventId=&status=&page=
  → list semua order

GET /api/admin/orders/:id
  → detail order

PATCH /api/admin/orders/:id
  → update status (manual konfirmasi jika tanpa payment gateway)

GET /api/admin/orders/export?eventId=
  → export CSV semua transaksi
```

---

## Rencana Halaman Publik

### `/e/[slug]/buy`
Halaman pembelian:
- Pilih paket: per foto (pilih dari galeri) / per album / per hari / full event
- Tampilkan harga
- Form: nama, email, nomor HP
- Redirect ke payment gateway

### `/e/[slug]/order/:orderNumber`
Halaman status order:
- Tampilkan detail order (foto yang dibeli, jumlah, status)
- Tombol download jika sudah PAID
- Refresh/polling status

### `/e/[slug]/download/:orderNumber`
Halaman download:
- Grid foto yang dibeli
- Tombol download per foto
- Tombol "Download Semua (ZIP)"
- Status expiry countdown

---

## Rencana Halaman Admin

### `/admin/dashboard/orders`
- Tabel semua order (filter by event, status, tanggal)
- Quick stats: total pendapatan, order pending, order paid
- Export CSV

### `/admin/dashboard/events/[id]/pricing`
- Set harga per foto, per album, per hari, full event
- Toggle: event gratis / berbayar

---

## Integrasi Payment Gateway

### Pilihan (diputuskan saat implementasi):
1. **Midtrans** — paling umum di Indonesia, support QRIS, VA, e-wallet
2. **Xendit** — alternatif, developer-friendly
3. **Manual transfer** — untuk event kecil, admin konfirmasi manual

### Flow Midtrans:
```
1. POST /api/orders → buat PurchaseOrder PENDING
2. Buat Midtrans transaction → dapat snap_token
3. Redirect user ke Midtrans Snap (hosted payment)
4. Midtrans callback → POST /api/webhooks/midtrans
5. Verify signature → update PurchaseOrder PAID
6. Kirim email konfirmasi + link download
```

---

## Rencana Email

### Email yang dibutuhkan:
- **Order Confirmation** — setelah buat order, sebelum bayar
- **Payment Success** — setelah bayar berhasil, ada link download
- **Download Reminder** — H-1 sebelum link download expired
- **Download Expired** — jika link sudah mati (dengan opsi perpanjang)

### Provider: Resend / Nodemailer (dikonfigurasi di env)

---

## Pertimbangan Teknis

### Download foto original
- File resolusi penuh ada di Google Drive — tidak disimpan di server
- Download via `/api/photos/:id/download-paid` menggunakan service account
- Stream langsung ke browser (tidak perlu simpan ke storage sementara)
- Pertimbangkan: signed URL dengan expiry vs proxy server

### Proteksi konten
- Preview tetap gratis (thumbnailUrl sz=800)
- Original hanya bisa diakses dengan token order yang valid
- Watermark pada preview (opsional — bisa ditambahkan sebelum fitur ini)

### Scalability
- Untuk event besar (5000+ foto), pertimbangkan queue untuk generate ZIP
- Download ZIP bisa pakai background job (seperti sync engine)

### GDPR / Privacy
- Email pembeli disimpan di DB — perlu privacy policy
- Hash IP untuk download log (sudah ada pattern di AuditLog)

---

## Prioritas Pengerjaan

### Sprint 1 — Foundation
- [ ] Schema DB (PurchaseOrder, OrderItem, PhotoDownload)
- [ ] Migration
- [ ] Admin: pricing config per event
- [ ] API: POST /api/orders (buat order)
- [ ] Halaman `/buy` publik (form pilih paket)

### Sprint 2 — Payment
- [ ] Integrasi Midtrans (atau gateway pilihan)
- [ ] Webhook handler
- [ ] API: GET /api/orders/:orderNumber (status)
- [ ] Halaman `/order/:orderNumber` (status page)

### Sprint 3 — Download
- [ ] API: download foto original (server proxy)
- [ ] API: download ZIP
- [ ] Halaman `/download/:orderNumber`
- [ ] Email confirmation + download link

### Sprint 4 — Admin & Polish
- [ ] Admin orders dashboard
- [ ] Export CSV transaksi
- [ ] Integrasi di gallery (tombol Beli di foto)
- [ ] Watermark pada preview (opsional)
- [ ] Testing end-to-end

---

## File yang Perlu Dibuat

```
prisma/migrations/YYYYMMDD_photo_purchase/migration.sql
src/app/api/orders/route.ts
src/app/api/orders/[orderNumber]/route.ts
src/app/api/orders/[orderNumber]/download/route.ts
src/app/api/webhooks/midtrans/route.ts
src/app/api/photos/[id]/download-paid/route.ts
src/app/e/[eventSlug]/buy/page.tsx
src/app/e/[eventSlug]/order/[orderNumber]/page.tsx
src/app/e/[eventSlug]/download/[orderNumber]/page.tsx
src/app/admin/dashboard/orders/page.tsx
src/app/admin/dashboard/events/[id]/pricing/page.tsx
src/components/gallery/BuyButton.tsx
src/components/gallery/OrderStatus.tsx
src/lib/payment/midtrans.ts
src/lib/email/templates/order-confirmation.tsx
src/lib/email/templates/payment-success.tsx
src/repositories/order.repository.ts
```
