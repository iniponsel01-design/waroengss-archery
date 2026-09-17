/**
 * Setup Drive Structure Script
 * Maps all 7 days and their albums to the correct Google Drive folder IDs
 * Run: node scripts/setup-drive-structure.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Drive Structure ────────────────────────────────────────────────────────
const DRIVE_STRUCTURE = [
  {
    dayNumber: 1,
    title: "Day 1 — 21 Sep",
    dayFolderId: "1NnZgSqOa-9r9ttMFzyGQFkbMXTRjWvon",
    albums: [
      { name: "Practice Day",       slug: "practice-day",       folderId: "1BDRe7UCvbsr6pMpRKikc9G8YbA7-pb0t" },
      { name: "Technical Meeting",  slug: "technical-meeting",  folderId: "1oRYtAMYoUUgb1n003g81Ib96WFKHr_vB" },
      { name: "Opening Ceremony",   slug: "opening-ceremony",   folderId: "1ctJ9mDwRIgOKc0k_sfq8ECYDFkeTIBZP" },
    ],
  },
  {
    dayNumber: 2,
    title: "Day 2 — 22 Sep",
    dayFolderId: "1nkY0i72JfetJrcVcIOU0fzRIejx5Ppp_",
    albums: [
      { name: "Judges",             slug: "judges-day2",        folderId: "1srFeHyjuZwKmpP2cKg3JXf33mDzNwmqK" },
      { name: "Field Crew & Scorer",slug: "field-crew-day2",    folderId: "1lAvvj1WGgOb9D57D9rZQu0ttjO_NUye3" },
      { name: "Athletes",           slug: "athletes-day2",      folderId: "1nGGCsfDFeGg9hJPxfy95Po-yCtsQ7cMb" },
      { name: "UPP",                slug: "upp-day2",           folderId: "1NmxGKU6pqLXRDZ3lLIIoZnFAPqcWwKTU" },
    ],
  },
  {
    dayNumber: 3,
    title: "Day 3 — 23 Sep",
    dayFolderId: "1ZCmA72zGdCAoQzccZEj8nQj-OTqzK369",
    albums: [
      { name: "Judges",             slug: "judges-day3",        folderId: "1GoRNGD0FYVSKt_Jjk-7tBs5Q6gYd9CyN" },
      { name: "Field Crew & Scorer",slug: "field-crew-day3",    folderId: "1O671yEJPrhgG0-JZT_OjKA5jXaxO68Wx" },
      { name: "Athletes",           slug: "athletes-day3",      folderId: "13v8dwRyfcIH1nn8RsDrJFBzOZ9QH1y77" },
      { name: "UPP",                slug: "upp-day3",           folderId: "1fE64ENQmTmMTZsEIPPDCKg-zfwpdLLS-" },
    ],
  },
  {
    dayNumber: 4,
    title: "Day 4 — 24 Sep",
    dayFolderId: "1SMlTPVj9Tb0RUq2SxNp0_BJF4krRtJV_",
    albums: [
      { name: "Judges",             slug: "judges-day4",        folderId: "1VSTI95_ag6x-YGslFmfiW_lFuVmai-SG" },
      { name: "Field Crew & Scorer",slug: "field-crew-day4",    folderId: "1T8gTEbYbod1Q39T9Fc3FeDYnkeNPo3vl" },
      { name: "Athletes",           slug: "athletes-day4",      folderId: "1z25vzaEOCE-5WzwbGM-H7oXt-2L6VKt9" },
      { name: "UPP",                slug: "upp-day4",           folderId: "1elxRQ4y98TehHUkC9ziGkDUVPmokS4sA" },
    ],
  },
  {
    dayNumber: 5,
    title: "Day 5 — 25 Sep",
    dayFolderId: "1f-z19rHSJ1Qy8l3I9pPJIJpdif6aTd0o",
    albums: [
      { name: "Judges",             slug: "judges-day5",        folderId: "1FEwjrve1QF_yDePyr56pRrh2B-K4XgZo" },
      { name: "Field Crew & Scorer",slug: "field-crew-day5",    folderId: "17JaMKqur5btTqBGiHnhoxr07rtS1AJ42" },
      { name: "Athletes",           slug: "athletes-day5",      folderId: "1e3NI-hUR37XxDuckOdcXwHv87VwC0s_L" },
      { name: "UPP",                slug: "upp-day5",           folderId: "1OfXEw4z4pZf7V_aBnMHUrbmdkdFnpNCt" },
    ],
  },
  {
    dayNumber: 6,
    title: "Day 6 — 26 Sep",
    dayFolderId: "1GVQCdmWqh7Ky37JrVinoGebwQEcn6s2J",
    albums: [
      { name: "Judges",             slug: "judges-day6",        folderId: "1CUE390VXV-gvh1ytzmIuyQ6qiYVU5WkR" },
      { name: "Field Crew & Scorer",slug: "field-crew-day6",    folderId: "1p3jg-q8-v5RF_mROGdk8jlyVESAgq7bl" },
      { name: "Athletes",           slug: "athletes-day6",      folderId: "1UwiEAtDoi3hweCdDASL7QQc2g73QgKGS" },
      { name: "UPP",                slug: "upp-day6",           folderId: "1vqIHwfq-7ZKtOmCtwrUrnTptHZ5gQ-20" },
    ],
  },
  {
    dayNumber: 7,
    title: "Day 7 — 27 Sep",
    dayFolderId: "1bu4OuewjIhMFEwIkEtqpbXkEuQcy8IvC",
    albums: [
      { name: "Judges",             slug: "judges-day7",        folderId: "12h2IW7GJsl-DuqdPXIFx9YKpDNNBJ6jZ" },
      { name: "Field Crew & Scorer",slug: "field-crew-day7",    folderId: "1tMlowy4K_0vrvxqp1dyJ89wUhqLSapcA" },
      { name: "Athletes",           slug: "athletes-day7",      folderId: "161XSiGXOY7sQMEUKxNyPtyTlRVmJTSsz" },
      { name: "UPP",                slug: "upp-day7",           folderId: "1MHWt4wHdRPX7WrkaBUfghAtDTa_LlEu9" },
    ],
  },
];

async function main() {
  console.log('🔧 Setting up Drive structure...\n');

  // Get event
  const event = await prisma.event.findFirst({ select: { id: true, title: true } });
  if (!event) { console.error('❌ No event found'); return; }
  console.log('📅 Event:', event.title);

  // Get existing days
  const existingDays = await prisma.eventDay.findMany({
    where: { eventId: event.id },
    orderBy: { dayNumber: 'asc' },
  });
  const dayMap = new Map(existingDays.map(d => [d.dayNumber, d]));

  for (const dayData of DRIVE_STRUCTURE) {
    let day = dayMap.get(dayData.dayNumber);

    // Create or update day
    if (!day) {
      day = await prisma.eventDay.create({
        data: {
          eventId: event.id,
          dayNumber: dayData.dayNumber,
          title: dayData.title,
          sortOrder: dayData.dayNumber - 1,
          status: 'ACTIVE',
        },
      });
      console.log(`  ✅ Created: ${day.title}`);
    } else {
      await prisma.eventDay.update({
        where: { id: day.id },
        data: { title: dayData.title },
      });
      console.log(`  🔄 Updated: ${day.title}`);
    }

    // Get existing albums for this day
    const existingAlbums = await prisma.album.findMany({ where: { eventDayId: day.id } });
    const albumMap = new Map(existingAlbums.map(a => [a.slug, a]));

    for (let i = 0; i < dayData.albums.length; i++) {
      const albumData = dayData.albums[i];
      const existing = albumMap.get(albumData.slug);

      if (!existing) {
        await prisma.album.create({
          data: {
            eventDayId: day.id,
            name: albumData.name,
            slug: albumData.slug,
            driveFolderId: albumData.folderId,
            sortOrder: i,
            status: 'ACTIVE',
          },
        });
        console.log(`    ✅ Album created: ${albumData.name}`);
      } else {
        await prisma.album.update({
          where: { id: existing.id },
          data: { driveFolderId: albumData.folderId, name: albumData.name },
        });
        console.log(`    🔄 Album updated: ${albumData.name} → Drive linked`);
      }
    }
  }

  // Count results
  const albumCount = await prisma.album.count({ where: { eventDay: { eventId: event.id } } });
  console.log(`\n✅ Done! ${DRIVE_STRUCTURE.length} hari, ${albumCount} album total`);
  console.log('📌 Semua album sudah terhubung ke Google Drive folder');
  console.log('👉 Sekarang jalankan Sync dari admin panel: /admin/dashboard/drive/sync\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
