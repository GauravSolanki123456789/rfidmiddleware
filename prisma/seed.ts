import { PrismaClient, Prisma, ProductItemType, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

const locationSeeds: { name: string; floorLabel: string }[] = [
  { name: "Front Showcase — Gold", floorLabel: "GF" },
  { name: "Front Showcase — Diamond", floorLabel: "GF" },
  { name: "VIP Lounge Cabinet", floorLabel: "1F" },
  { name: "Bridal Collection Wall", floorLabel: "1F" },
  { name: "Men’s Rings Counter", floorLabel: "2F" },
  { name: "Back Vault — Sealed", floorLabel: "B1" },
];

type ProductSeed = {
  epcTagId: string;
  skuCode: string;
  designName: string;
  itemType: ProductItemType;
  grossWeightGrams: string;
  netWeightGrams: string;
  locationIndex: number;
  status: ProductStatus;
};

const productSeeds: ProductSeed[] = [
  {
    epcTagId: "3034257BF400D8400001A001",
    skuCode: "RNG-22K-HALO-001",
    designName: "Halo Solitaire — 22K",
    itemType: ProductItemType.RING,
    grossWeightGrams: "8.4200",
    netWeightGrams: "7.9500",
    locationIndex: 0,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A002",
    skuCode: "RNG-PT-CLSC-014",
    designName: "Classic Court Band — Platinum",
    itemType: ProductItemType.RING,
    grossWeightGrams: "6.1000",
    netWeightGrams: "5.8800",
    locationIndex: 4,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A003",
    skuCode: "RNG-18K-ROSE-022",
    designName: "Twisted Vine — Rose Gold",
    itemType: ProductItemType.RING,
    grossWeightGrams: "5.2500",
    netWeightGrams: "4.9000",
    locationIndex: 1,
    status: ProductStatus.SOLD,
  },
  {
    epcTagId: "3034257BF400D8400001A004",
    skuCode: "RNG-22K-TEMP-008",
    designName: "Temple Border Men’s Ring",
    itemType: ProductItemType.RING,
    grossWeightGrams: "12.8000",
    netWeightGrams: "12.1000",
    locationIndex: 4,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A005",
    skuCode: "NCK-22K-RANI-101",
    designName: "Rani Haar — Layered Gold",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "45.6000",
    netWeightGrams: "43.2000",
    locationIndex: 2,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A006",
    skuCode: "NCK-18K-SNT-045",
    designName: "Singapore Twist Chain",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "18.3000",
    netWeightGrams: "17.5000",
    locationIndex: 0,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A007",
    skuCode: "NCK-PT-DROP-033",
    designName: "Diamond Drop — Platinum",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "22.7500",
    netWeightGrams: "20.4000",
    locationIndex: 1,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A008",
    skuCode: "NCK-22K-CHOK-012",
    designName: "Antique Choker Set",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "38.9000",
    netWeightGrams: "36.7000",
    locationIndex: 3,
    status: ProductStatus.MISSING,
  },
  {
    epcTagId: "3034257BF400D8400001A009",
    skuCode: "NCK-18K-PND-028",
    designName: "Heart Pendant on Box Chain",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "9.6500",
    netWeightGrams: "8.9000",
    locationIndex: 3,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A00A",
    skuCode: "BNG-22K-PAT-201",
    designName: "Patla Pair — Hand Engraved",
    itemType: ProductItemType.BANGLE,
    grossWeightGrams: "52.4000",
    netWeightGrams: "49.8000",
    locationIndex: 0,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A00B",
    skuCode: "BNG-22K-KAD-215",
    designName: "Kada — Screw Open",
    itemType: ProductItemType.BANGLE,
    grossWeightGrams: "34.2000",
    netWeightGrams: "32.6000",
    locationIndex: 5,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A00C",
    skuCode: "BNG-18K-ROSE-188",
    designName: "Slim Stackable Set (3 pc)",
    itemType: ProductItemType.BANGLE,
    grossWeightGrams: "21.0000",
    netWeightGrams: "19.8000",
    locationIndex: 1,
    status: ProductStatus.SOLD,
  },
  {
    epcTagId: "3034257BF400D8400001A00D",
    skuCode: "RNG-18K-ETER-055",
    designName: "Eternity Band — Half Pave",
    itemType: ProductItemType.RING,
    grossWeightGrams: "4.8500",
    netWeightGrams: "4.4000",
    locationIndex: 1,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A00E",
    skuCode: "NCK-22K-MANG-077",
    designName: "Mangalsutra — Black Bead",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "14.2000",
    netWeightGrams: "13.4000",
    locationIndex: 3,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A00F",
    skuCode: "BNG-22K-OX-192",
    designName: "Oxford Oval Bangle",
    itemType: ProductItemType.BANGLE,
    grossWeightGrams: "28.7500",
    netWeightGrams: "27.3000",
    locationIndex: 2,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A010",
    skuCode: "RNG-22K-SIGN-041",
    designName: "Signet Ring — Matte Finish",
    itemType: ProductItemType.RING,
    grossWeightGrams: "10.1500",
    netWeightGrams: "9.6000",
    locationIndex: 4,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A011",
    skuCode: "NCK-PT-TNS-019",
    designName: "Tennis Line — 42 cm",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "16.4000",
    netWeightGrams: "14.9000",
    locationIndex: 2,
    status: ProductStatus.SOLD,
  },
  {
    epcTagId: "3034257BF400D8400001A012",
    skuCode: "BNG-18K-MESH-204",
    designName: "Mesh Flex Bangle",
    itemType: ProductItemType.BANGLE,
    grossWeightGrams: "19.3000",
    netWeightGrams: "18.1000",
    locationIndex: 0,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A013",
    skuCode: "RNG-18K-TRI-063",
    designName: "Trinity Knot — Tri-tone",
    itemType: ProductItemType.RING,
    grossWeightGrams: "5.9000",
    netWeightGrams: "5.4500",
    locationIndex: 3,
    status: ProductStatus.IN_STOCK,
  },
  {
    epcTagId: "3034257BF400D8400001A014",
    skuCode: "NCK-22K-LNG-091",
    designName: "Long Haram — Peacock Motif",
    itemType: ProductItemType.NECKLACE,
    grossWeightGrams: "62.1000",
    netWeightGrams: "58.9000",
    locationIndex: 5,
    status: ProductStatus.IN_STOCK,
  },
];

async function main() {
  await prisma.$transaction([
    prisma.product.deleteMany(),
    prisma.location.deleteMany(),
  ]);

  const locations = await prisma.$transaction(
    locationSeeds.map((row) =>
      prisma.location.create({
        data: {
          name: row.name,
          floorLabel: row.floorLabel,
        },
      }),
    ),
  );

  for (const row of productSeeds) {
    const location = locations[row.locationIndex];
    if (!location) {
      throw new Error(`Invalid locationIndex ${row.locationIndex}`);
    }
    await prisma.product.create({
      data: {
        epcTagId: row.epcTagId,
        skuCode: row.skuCode,
        designName: row.designName,
        itemType: row.itemType,
        grossWeightGrams: new Prisma.Decimal(row.grossWeightGrams),
        netWeightGrams: new Prisma.Decimal(row.netWeightGrams),
        locationId: location.id,
        status: row.status,
      },
    });
  }

  const counts = {
    locations: await prisma.location.count(),
    products: await prisma.product.count(),
  };
  console.info("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
