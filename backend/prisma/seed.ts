import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Add location
  await prisma.locations.create({
    data: {
      name: 'Cross Metals LLC',
      address: '14064 AL-75, Remlap, AL 35133'
    }
  });

  // Add materials
  await prisma.materials.createMany({
    data: [
      { name: 'Shred', category: 'ferrous', unit: 'lb' },
      { name: 'HMS', category: 'ferrous', unit: 'lb' },
      { name: '#1 Copper', category: 'non-ferrous', unit: 'lb' },
      { name: 'Aluminum Cans', category: 'non-ferrous', unit: 'lb' }
    ]
  });

  console.log('✅ Seed complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
