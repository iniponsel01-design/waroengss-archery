# Deployment Guide

## Stack

```
GitHub (source) → Vercel (build + deploy) → Supabase (database) + Google Drive (photos)
```

---

## 1. GitHub Repository

```bash
# Inisialisasi git (sudah dilakukan)
git remote add origin https://github.com/cakholissambal-stack/waroengss-archery.git
git push -u origin main
```

---

## 2. Vercel Setup

1. Buka [vercel.com](https://vercel.com) → New Project
2. Import repository `cakholissambal-stack/waroengss-archery`
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `/` (default)
5. Build Command: `npm run build` (default)
6. Output Directory: `.next` (default)

### Environment Variables di Vercel

Tambahkan semua variabel dari `.env.example` dengan nilai production:

| Key | Environment |
|-----|-------------|
| `DATABASE_URL` | Production |
| `DIRECT_URL` | Production |
| `JWT_SECRET` | Production |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Production |
| `NEXT_PUBLIC_APP_URL` | Production |
| `NEXT_PUBLIC_BRAND_NAME` | Production |

---

## 3. Supabase Setup

1. Buat project di [supabase.com](https://supabase.com)
2. Settings → Database → Connection string
3. Copy **Transaction mode** → `DATABASE_URL`
4. Copy **Session mode** → `DIRECT_URL`
5. Run migrations:

```bash
# Dari local dengan DIRECT_URL production
npm run db:migrate:deploy
```

---

## 4. Deploy

Push ke `main` branch → Vercel auto-deploy:

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

---

## 5. Post-Deploy Checklist

```
[ ] Vercel deployment successful (green)
[ ] Environment variables configured
[ ] Database migration executed
[ ] Admin login works (/admin/login)
[ ] Create first event
[ ] Connect Google Drive
[ ] Run sync
[ ] Verify public event page
[ ] Test photo download
[ ] Test on mobile
[ ] Verify SEO meta tags
```

---

## Preview Deployments

Setiap Pull Request mendapat preview URL otomatis dari Vercel:
```
https://waroengss-archery-git-feature-xyz.vercel.app
```

---

## Custom Domain

Di Vercel → Project → Settings → Domains:
```
gallery.waroengss.com  →  CNAME  →  cname.vercel-dns.com
```
