import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  {
    slug: 'mohini_sighting',
    nameEn: 'Mohini sighting',
    nameSi: 'මෝහිනී දර්ශනය',
    color: '#f472b6',
    icon: 'Ghost',
    sortOrder: 1,
  },
  {
    slug: 'colonial_bungalow',
    nameEn: 'Colonial bungalow',
    nameSi: 'යටත්විජිත බංගලාව',
    color: '#fbbf24',
    icon: 'House',
    sortOrder: 2,
  },
  {
    slug: 'haunted_junction',
    nameEn: 'Haunted junction',
    nameSi: 'භූත හන්දිය',
    color: '#60a5fa',
    icon: 'Signpost',
    sortOrder: 3,
  },
  {
    slug: 'cemetery',
    nameEn: 'Cemetery',
    nameSi: 'සුසාන භූමිය',
    color: '#ededed',
    icon: 'Skull',
    sortOrder: 4,
  },
  {
    slug: 'folklore_curse',
    nameEn: 'Folklore curse',
    nameSi: 'ජනකතා ශාපය',
    color: '#c084fc',
    icon: 'Moon',
    sortOrder: 5,
  },
  {
    slug: 'abandoned_building',
    nameEn: 'Abandoned building',
    nameSi: 'අත්හැරි ගොඩනැගිල්ල',
    color: '#fb923c',
    icon: 'Building2',
    sortOrder: 6,
  },
  {
    slug: 'other',
    nameEn: 'Other',
    nameSi: 'වෙනත්',
    color: '#a3a3a3',
    icon: 'MapPin',
    sortOrder: 99,
  },
];

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {
        nameEn: cat.nameEn,
        nameSi: cat.nameSi,
        color: cat.color,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
  }

  const bySlug = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c]),
  );

  const placeCount = await prisma.hauntedPlace.count();
  if (placeCount === 0) {
    const places = [
      {
        title: 'Borella Cemetery',
        description:
          "One of Colombo's oldest burial grounds. Locals speak of cold spots near the older tombs after dark, and of footsteps that follow you along the central path when the city noise fades.",
        categoryId: bySlug.cemetery.id,
        spookinessRating: 4,
        latitude: 6.915,
        longitude: 79.8772,
        nearestCity: 'Colombo',
        status: 'approved' as const,
        media: {
          create: [
            {
              mediaType: 'youtube' as const,
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              youtubeId: 'dQw4w9WgXcQ',
            },
          ],
        },
      },
      {
        title: 'St. Andrews Bungalow',
        description:
          'A colonial-era bungalow in the hills of Nuwara Eliya. Guests have reported piano notes from empty rooms and a woman in white standing at the upstairs window when no one is staying there.',
        categoryId: bySlug.colonial_bungalow.id,
        spookinessRating: 5,
        latitude: 6.9497,
        longitude: 80.7891,
        nearestCity: 'Nuwara Eliya',
        status: 'approved' as const,
      },
      {
        title: 'Haunted Bend at Hanguranketha',
        description:
          'A sharp bend on the road where drivers claim headlights vanish and a figure steps into the road, only to disappear when you brake. Folklore ties the spot to an old accident and unfinished vows.',
        categoryId: bySlug.haunted_junction.id,
        spookinessRating: 4,
        latitude: 7.175,
        longitude: 80.78,
        nearestCity: 'Hanguranketha',
        status: 'approved' as const,
      },
    ];

    for (const place of places) {
      await prisma.hauntedPlace.create({ data: place });
    }
    console.log(`Seeded ${places.length} HolmanMap locations.`);
  } else {
    console.log(`Places already exist (${placeCount}) — skipped place seed.`);
  }

  console.log(`Categories ready (${DEFAULT_CATEGORIES.length}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
