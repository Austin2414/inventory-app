import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

type AuditLogEntry = {
  timestamp: Date;
  change: number;
  source: 'Packing Slip' | 'Reclassification' | 'Manual Adjustment';
  [key: string]: unknown;
};

const formatEntry = (
  timestamp: Date,
  change: number,
  source: 'Packing Slip' | 'Reclassification' | 'Manual Adjustment',
  details: Partial<Record<string, unknown>> = {}
): AuditLogEntry => ({
  timestamp,
  change,
  source,
  ...details,
});

router.get('/:locationId/material/:materialId/audit-log', async (req, res) => {
  const locationId = parseInt(req.params.locationId);
  const materialId = parseInt(req.params.materialId);

  if (isNaN(locationId) || isNaN(materialId)) {
    return res.status(400).json({ error: 'Invalid locationId or materialId' });
  }

  try {
    // Fetch material unit once
    const material = await prisma.materials.findUnique({
      where: { id: materialId },
      select: { unit: true },
    });

    // --- PACKING SLIPS (Grouped by Slip) ---
const packingSlipItems = await prisma.packing_slip_items.findMany({
  where: { material_id: materialId },
  include: {
    packing_slips: true,
    material: true,
  },
});

// Group items by packing slip ID
const groupedBySlip: Record<number, typeof packingSlipItems> = {};
for (const item of packingSlipItems) {
  if (item.packing_slips?.location_id !== locationId) continue;
  if (!groupedBySlip[item.packing_slip_id]) {
    groupedBySlip[item.packing_slip_id] = [];
  }
  groupedBySlip[item.packing_slip_id].push(item);
}

// Create one entry per packing slip, summing the net weights
const packingSlipLogs = Object.entries(groupedBySlip).map(([slipId, items]) => {
  const totalNet = items.reduce(
    (sum, item) => sum + (item.gross_weight - item.tare_weight),
    0
  );

  return formatEntry(
    items[0].packing_slips.date_time,
    totalNet,
    'Packing Slip',
    {
      packingSlipId: Number(slipId),
      remarks: null,
      unit: items[0].material.unit || 'lb',
      slipType:
        items[0].packing_slips.slip_type === 'outbound'
          ? 'Outbound'
          : 'Inbound',

    }
  );
});



    // --- RECLASSIFICATIONS ---
      const reclassLogs = await prisma.reclassificationLog.findMany({
        where: {
          location_id: locationId,
          OR: [
            { from_material_id: materialId },
            { to_material_id: materialId },
          ],
        },
        include: {
          from_material: true,
          to_material: true,
        },
      });

      const reclassificationLogs = reclassLogs.map(entry => {
        const isFrom = entry.from_material_id === materialId;
        const change = isFrom ? -entry.quantity : entry.quantity;

        const movedMaterialName = isFrom
          ? entry.to_material?.name || 'Unknown'
          : entry.from_material?.name || 'Unknown';

        return formatEntry(
          entry.timestamp,
          change,
          'Reclassification',
          {
            load: entry.load || null,
          reason: entry.reason || null,
          direction: isFrom ? 'From' : 'To',
          unit: material?.unit ?? 'lb',
          ...(isFrom
              ? { movedTo: movedMaterialName }
              : { movedFrom: movedMaterialName }),
          }
        );
      });


    // --- ADJUSTMENTS ---
    const adjustmentLogs = await prisma.inventoryAdjustment.findMany({
      where: {
        material_id: materialId,
        location_id: locationId,
      },
    });

    const adjustmentEntries = adjustmentLogs.map(entry =>
      formatEntry(entry.timestamp, entry.change, 'Manual Adjustment', {
        reason: entry.reason || null,
        unit: material?.unit ?? '',
      })
    );

    // --- MERGE & SORT ---
    const fullLog = [...packingSlipLogs, ...reclassificationLogs, ...adjustmentEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json(fullLog);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});


export default router;
