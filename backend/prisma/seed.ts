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
    // Non-ferrous
    { name: '#1 Copper', category: 'Non-ferrous', unit: 'lb' },
    { name: '#2 Copper', category: 'Non-ferrous', unit: 'lb' },
    { name: 'Old sheet', category: 'Non-ferrous', unit: 'lb' },
    { name: 'MLC', category: 'Non-ferrous', unit: 'lb' },
    { name: 'Electric Motors', category: 'Non-ferrous', unit: 'lb' },
    { name: '#1 ICW (75%)', category: 'Non-ferrous', unit: 'lb' },
    { name: '#2 ICW (50%)', category: 'Non-ferrous', unit: 'lb' },

    // Ferrous
    { name: 'Shreddables', category: 'Ferrous', unit: 'lb' },
    { name: 'MIXED1&2', category: 'Ferrous', unit: 'lb' },
    { name: 'Iron', category: 'Ferrous', unit: 'lb' },
    { name: 'Cast Iron', category: 'Ferrous', unit: 'lb' },
    { name: 'Automobiles', category: 'Ferrous', unit: 'lb' },
    { name: 'P&S', category: 'Ferrous', unit: 'lb' }
  ],
  skipDuplicates: true
});


  console.log('✅ Seed complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
