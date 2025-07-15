import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  // 👇 Fallback to location_id = 1 if not provided
  const location_id = req.body.location_id ?? 1;
  const { material_id, change, reason } = req.body;

  if (typeof change !== 'number' || !material_id || !location_id) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Apply inventory adjustment
    await prisma.inventory.upsert({
      where: {
        uniq_material_location: {
          material_id,
          location_id
        }
      },
      update: {
        quantity: { increment: change },
      },
      create: {
        material_id,
        location_id,
        quantity: change,
      }
    });

    // Log adjustment
    await prisma.inventoryAdjustment.create({
      data: {
        material_id,
        location_id,
        change,
        reason
      }
    });

    res.status(200).json({ message: 'Inventory adjusted successfully' });
  } catch (err) {
    console.error('Adjustment error:', err);
    res.status(500).json({ error: 'Server error while adjusting inventory' });
  }
});

export default router;
