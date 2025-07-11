import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/reclassify', async (req, res) => {
  try {
    const { from_material_id, to_material_id, quantity, location_id } = req.body;

    const parsedFrom = parseInt(from_material_id);
    const parsedTo = parseInt(to_material_id);
    const parsedLoc = parseInt(location_id);
    const parsedQty = parseFloat(quantity);

    if (!parsedFrom || !parsedTo || !parsedQty || !parsedLoc || parsedQty <= 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Transactionally move quantity from one material to another
    await prisma.$transaction([
      prisma.inventory.update({
        where: {
          uniq_material_location: {
            material_id: parsedFrom,
            location_id: parsedLoc
          }
        },
        data: {
          quantity: { decrement: parsedQty }
        }
      }),
      prisma.inventory.upsert({
        where: {
          uniq_material_location: {
            material_id: parsedTo,
            location_id: parsedLoc
          }
        },
        update: {
          quantity: { increment: parsedQty }
        },
        create: {
          material_id: parsedTo,
          location_id: parsedLoc,
          quantity: parsedQty
        }
      }),
      prisma.reclassificationLog.create({
        data: {
          from_material_id: parsedFrom,
          to_material_id: parsedTo,
          quantity: parsedQty,
          location_id: parsedLoc
        }
      })
    ]);

    res.status(200).json({ message: 'Reclassification successful' });

  } catch (error) {
    console.error('Reclassification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
