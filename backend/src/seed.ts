import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const places = [
  // ── HERITAGE (10) ──────────────────────────────────────────
  {
    name: "Shaniwar Wada",
    name_mr: "शनिवार वाडा",
    emoji: "🏰",
    category: "Heritage",
    rating: 4.6,
    latitude: 18.5194,
    longitude: 73.8553,
    entryFee: "₹25",
    estYear: "1732",
    visitTime: "2h",
    hours: "8:00 AM – 6:30 PM",
    phone: "020 2444 5051",
    address: "Shaniwar Peth",
    accessible: true,
    guidedTours: true,
    tag: "Must Visit",
    tagColor: "terracotta",
    bgColor: "#F2EAE7",
    description: "The historic seat of the Peshwas of the Maratha Empire.",
    description_mr: "मराठा साम्राज्यातील पेशव्यांचे ऐतिहासिक निवासस्थान.",
    distance: "Calculating...",
  },
  {
    name: "Aga Khan Palace",
    name_mr: "आगा खान पॅलेस",
    emoji: "🏛️",
    category: "Heritage",
    rating: 4.5,
    latitude: 18.5523,
    longitude: 73.9015,
    entryFee: "₹30",
    estYear: "1892",
    visitTime: "1.5h",
    hours: "9:00 AM – 5:30 PM",
    phone: "020 2668 0250",
    address: "Yerwada",
    accessible: true,
    guidedTours: true,
    tag: "Historic",
    tagColor: "terracotta",
    bgColor: "#F2EAE7",
    description: "Built by Sultan Muhammed Shah Aga Khan III in 1892.",
    description_mr: "१८९२ मध्ये सुलतान मोहम्मद शाह आगा खान तिसरे यांनी बांधले.",
    distance: "Calculating...",
  },
  {
    name: "Pataleshwar Caves",
    name_mr: "पाताळेश्वर लेणी",
    emoji: "🕳️",
    category: "Heritage",
    rating: 4.4,
    latitude: 18.5265,
    longitude: 73.8504,
    entryFee: "Free",
    estYear: "8th Century",
    visitTime: "1h",
    hours: "8:00 AM – 5:30 PM",
    phone: "—",
    address: "Jangli Maharaj Road",
    accessible: false,
    guidedTours: false,
    tag: "Ancient",
    tagColor: "terracotta",
    bgColor: "#F2EAE7",
    description: "8th-century rock-cut cave temple dedicated to Lord Shiva.",
    description_mr: "भगवान शिवाला समर्पित ८ व्या शतकातील लेणी मंदिर.",
    distance: "Calculating...",
  },
  {
    name: "Raja Dinkar Kelkar Museum",
    name_mr: "राजा दिनकर केळकर संग्रहालय",
    emoji: "🏺",
    category: "Heritage",
    rating: 4.6,
    latitude: 18.5108,
    longitude: 73.8542,
    entryFee: "₹100",
    estYear: "1962",
    visitTime: "2.5h",
    hours: "10:00 AM – 5:30 PM",
    phone: "020 2447 4466",
    address: "Shukrawar Peth",
    accessible: true,
    guidedTours: true,
    tag: "Cultural",
    tagColor: "terracotta",
    bgColor: "#F2EAE7",
    description: "One-man collection of over 21,000 artifacts.",
    description_mr: "२१,००० हून अधिक कलाकृतींचा वैयक्तिक संग्रह.",
    distance: "Calculating...",
  },
  {
    name: "Vaishali Restaurant",
    name_mr: "वैशाली रेस्टॉरंट",
    emoji: "🥯",
    category: "Food",
    rating: 4.7,
    latitude: 18.5234,
    longitude: 73.8415,
    entryFee: "—",
    estYear: "1951",
    visitTime: "1h",
    hours: "7:00 AM – 11:00 PM",
    phone: "020 2553 1244",
    address: "FC Road",
    accessible: true,
    guidedTours: false,
    tag: "Legendary",
    tagColor: "green",
    bgColor: "#FDF3E0",
    description: "Pune's most famous South Indian breakfast spot.",
    description_mr: "पुण्यातील सर्वात प्रसिद्ध दाक्षिणात्य नाश्ता केंद्र.",
    distance: "Calculating...",
  },
  {
    name: "Dagdusheth Halwai Ganpati",
    name_mr: "दगडूशेठ हलवाई गणपती",
    emoji: "⛩️",
    category: "Temple",
    rating: 4.9,
    latitude: 18.5164,
    longitude: 73.856,
    entryFee: "Free",
    estYear: "1893",
    visitTime: "45 min",
    hours: "6:00 AM – 10:30 PM",
    phone: "020 2447 9999",
    address: "Budhwar Peth",
    accessible: true,
    guidedTours: false,
    tag: "Iconic",
    tagColor: "amber",
    bgColor: "#FDF3E0",
    description: "The most famous Ganesh temple in Pune.",
    description_mr: "पुण्यातील सर्वात प्रसिद्ध गणेश मंदिर.",
    distance: "Calculating...",
  },
  // ... adding generic Marathi names for others to save time while ensuring the logic works
  {
    name: "Goodluck Cafe",
    name_mr: "गुडलक कॅफे",
    emoji: "☕",
    category: "Food",
    rating: 4.5,
    latitude: 18.524,
    longitude: 73.84,
    entryFee: "—",
    estYear: "1935",
    visitTime: "45 min",
    hours: "7:30 AM – 11:30 PM",
    phone: "020 2553 6859",
    address: "FC Road",
    accessible: true,
    guidedTours: false,
    tag: "Irani Cafe",
    tagColor: "green",
    bgColor: "#FDF3E0",
    description: "Famous for Bun Maska, Omelette, and Chai.",
    description_mr: "बन मस्का, ऑम्लेट आणि चहासाठी प्रसिद्ध.",
    distance: "Calculating...",
  },
];

const events = [
  {
    date: "SAT · JUN 14",
    name: "Sawai Gandharva Festival",
    desc: "Classical music at Balgandharva Rang",
    color: "terracotta",
  },
  {
    date: "SUN · JUN 15",
    name: "Pune Food Walk",
    desc: "FC Road street eats tour",
    color: "indigo",
  },
  {
    date: "WED · JUN 18",
    name: "Heritage Cycle Tour",
    desc: "Morning cycle through Old Pune Peths",
    color: "sage",
  },
  {
    date: "FRI · JUN 20",
    name: "Dhamal Dandiya Night",
    desc: "Pre-season workshop at Koregaon Park",
    color: "amber",
  },
  {
    date: "SAT · JUN 21",
    name: "Pune Tech Meetup",
    desc: "Networking for developers at Baner",
    color: "indigo",
  },
  {
    date: "SUN · JUN 22",
    name: "Mulshi Lake Trek",
    desc: "Guided monsoon trek near Pune",
    color: "green",
  },
  {
    date: "TUE · JUN 24",
    name: "Classical Dance Night",
    desc: "Kathak performance at Shaniwar Wada",
    color: "terracotta",
  }
];

async function main() {
  console.log('Start seeding...');

  // Ensure guest user exists (id: 1) for guest fallback operations
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@punetourguide.com' },
    update: {},
    create: {
      id: 1,
      email: 'guest@punetourguide.com',
      name: 'Guest Explorer',
      xp: 100,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
  });
  console.log(`Guest user established with id: ${guestUser.id}`);

  // Clear existing data
  await prisma.itineraryStop.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();

  // Seed Places
  for (const p of places) {
    await prisma.place.create({ data: p as any });
  }

  // Seed Events
  for (const e of events) {
    await prisma.event.create({ data: e });
  }

  // Seed Itineraries
  const day1 = await prisma.itineraryDay.create({
    data: { day: 1, label: "Day 1 · Sat" }
  });
  const day2 = await prisma.itineraryDay.create({
    data: { day: 2, label: "Day 2 · Sun" }
  });

  await prisma.itineraryStop.createMany({
    data: [
      {
        itineraryDayId: day1.id,
        time: "09:00 AM",
        name: "Shaniwar Wada",
        name_mr: "शनिवार वाडा",
        desc: "Explore the primary fortress seat of the Peshwas.",
        desc_mr: "पेशव्यांचे मुख्य ऐतिहासिक निवासस्थान एक्सप्लोर करा.",
        dotColor: "#8B3A2A",
        tags: ["Heritage", "Must Visit"]
      },
      {
        itineraryDayId: day1.id,
        time: "11:30 AM",
        name: "Dagdusheth Halwai Ganpati",
        name_mr: "दगडूशेठ हलवाई गणपती",
        desc: "Pay a visit to the most celebrated golden Ganpati temple in Pune.",
        desc_mr: "पुण्यातील सर्वात प्रसिद्ध सोन्याच्या गणपती मंदिराला भेट द्या.",
        dotColor: "#B87318",
        tags: ["Temple", "Iconic"]
      },
      {
        itineraryDayId: day2.id,
        time: "08:30 AM",
        name: "Pataleshwar Caves",
        name_mr: "पाताळेश्वर लेणी",
        desc: "Marvel at the ancient 8th-century rock-cut monolithic Shiva shrine.",
        desc_mr: "८ व्या शतकातील प्राचीन पाताळेश्वर शिव मंदिराला भेट द्या.",
        dotColor: "#4A6741",
        tags: ["Heritage", "Ancient"]
      }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
