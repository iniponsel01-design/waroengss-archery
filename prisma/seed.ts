/**
 * Prisma Seed — Development Data
 * Creates sample event for development/testing
 * Run: npm run db:seed
 */

import { PrismaClient, EventStatus, DayStatus, AlbumStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin User ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@waroengss.com" },
    update: {},
    create: {
      email: "admin@waroengss.com",
      name: "Admin Waroeng SS",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ─── Site Settings ─────────────────────────────────────────
  const settings = [
    { key: "brand_name", value: "Waroeng SS Archery" },
    { key: "brand_tagline", value: "Event Documentation Gallery" },
    { key: "brand_website", value: "https://waroengss.com" },
    { key: "primary_color", value: "#ec4899" },
    { key: "footer_text", value: "© 2026 Waroeng SS Archery. All rights reserved." },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ Site settings created");

  // ─── Sample Event ──────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { slug: "archery-national-2026" },
    update: {},
    create: {
      slug: "archery-national-2026",
      title: "Archery National Championship 2026",
      description:
        "Kejuaraan Panahan Nasional 2026 yang diselenggarakan di Yogyakarta. Peserta dari seluruh Indonesia berkompetisi dalam berbagai kategori.",
      location: "Yogyakarta, Indonesia",
      startDate: new Date("2026-09-12"),
      endDate: new Date("2026-09-16"),
      timezone: "Asia/Jakarta",
      status: "PUBLISHED" as EventStatus,
      publishedAt: new Date(),
      seoTitle: "Archery National Championship 2026 | Waroeng SS Archery Gallery",
      seoDescription:
        "Dokumentasi foto Kejuaraan Panahan Nasional 2026 di Yogyakarta. Lihat dan unduh foto event panahan terbaik.",
    },
  });
  console.log(`✅ Event created: ${event.title}`);

  // ─── Event Days ────────────────────────────────────────────
  const days = [
    {
      dayNumber: 1,
      title: "Day 1 — Qualification",
      description: "Babak kualifikasi untuk semua kategori",
      date: new Date("2026-09-12"),
    },
    {
      dayNumber: 2,
      title: "Day 2 — Preliminary Match",
      description: "Pertandingan babak penyisihan",
      date: new Date("2026-09-13"),
    },
    {
      dayNumber: 3,
      title: "Day 3 — Quarter Final",
      description: "Perempat final",
      date: new Date("2026-09-14"),
    },
    {
      dayNumber: 4,
      title: "Day 4 — Semi Final",
      description: "Semi final semua kategori",
      date: new Date("2026-09-15"),
    },
    {
      dayNumber: 5,
      title: "Day 5 — Final & Award",
      description: "Final dan upacara penyerahan medali",
      date: new Date("2026-09-16"),
    },
  ];

  const albumsPerDay = [
    ["qualification", "practice", "official-session"],
    ["preliminary-match", "practice"],
    ["quarter-final", "coaches-corner"],
    ["semi-final", "athlete-moments"],
    ["final", "award-ceremony", "closing"],
  ];

  const albumNames: Record<string, string> = {
    qualification: "Qualification",
    practice: "Practice",
    "official-session": "Official Session",
    "preliminary-match": "Preliminary Match",
    "quarter-final": "Quarter Final",
    "coaches-corner": "Coaches Corner",
    "semi-final": "Semi Final",
    "athlete-moments": "Athlete Moments",
    final: "Final",
    "award-ceremony": "Award Ceremony",
    closing: "Closing Ceremony",
  };

  for (let i = 0; i < days.length; i++) {
    const dayData = days[i];
    const day = await prisma.eventDay.upsert({
      where: { eventId_dayNumber: { eventId: event.id, dayNumber: dayData.dayNumber } },
      update: {},
      create: {
        ...dayData,
        eventId: event.id,
        sortOrder: i,
        status: "ACTIVE" as DayStatus,
      },
    });
    console.log(`  ✅ Day ${day.dayNumber}: ${day.title}`);

    for (let j = 0; j < albumsPerDay[i].length; j++) {
      const albumSlug = albumsPerDay[i][j];
      await prisma.album.upsert({
        where: { eventDayId_slug: { eventDayId: day.id, slug: albumSlug } },
        update: {},
        create: {
          eventDayId: day.id,
          name: albumNames[albumSlug],
          slug: albumSlug,
          description: `Album ${albumNames[albumSlug]} - Day ${dayData.dayNumber}`,
          sortOrder: j,
          status: "ACTIVE" as AlbumStatus,
        },
      });
    }
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("  - Admin: admin@waroengss.com / admin123456");
  console.log("  - Event: /e/archery-national-2026");
  console.log(
    "  - ⚠️  Change admin password immediately in production!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
