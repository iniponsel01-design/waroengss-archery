# Waroeng SS Archery — Event Documentation Gallery

Platform dokumentasi foto event profesional untuk **Waroeng SS Archery**.

Visitor dapat melihat dan mengunduh foto event tanpa login. Admin mengelola event, album, dan sync dari Google Drive.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend & Backend | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Storage | Google Drive (Service Account) |
| Hosting | Vercel |
| Source Control | GitHub |
| Styling | Tailwind CSS |

---

## Quick Start

```bash
# 1. Clone repo
git clone https://github.com/cakholissambal-stack/waroengss-archery.git
cd waroengss-archery

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local dengan nilai yang sesuai

# 4. Setup database
npm run db:push
npm run db:seed

# 5. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya.

Admin panel: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Default admin credentials (development):
- Email: `admin@waroengss.com`
- Password: `admin123456`

> ⚠️ **Ganti password admin segera di production!**

---

## URL Structure

```
/                              → Homepage (daftar event)
/e/:eventSlug                  → Halaman event
/e/:eventSlug/day/:dayNumber   → Hari event
/e/:eventSlug/album/:albumSlug → Album foto
/e/:eventSlug/photo/:photoId   → Foto individual
/admin/login                   → Admin login
/admin/dashboard               → Admin dashboard
```

---

## Documentation

| File | Deskripsi |
|------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem |
| [SETUP.md](./SETUP.md) | Panduan setup lengkap |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Environment variables |
| [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) | Setup Google Drive |
| [DATABASE.md](./DATABASE.md) | Database schema & migrasi |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy ke Vercel |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Panduan admin |
| [API.md](./API.md) | API reference |
| [SECURITY.md](./SECURITY.md) | Security notes |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Troubleshooting |

---

## Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema ke DB (dev)
npm run db:migrate    # Create & run migration
npm run db:seed       # Seed data development
npm run db:studio     # Prisma Studio GUI
npm run test          # Unit tests
```
