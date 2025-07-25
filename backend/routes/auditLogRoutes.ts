// src/routes/auditLog.ts
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
    const material = await prisma.materials.findUnique({
      where: { id: materialId },
      select: { unit: true },
    });

    // --- PACKING SLIPS ---
    const packingSlipItems = await prisma.packing_slip_items.findMany({
      where: { 
        material_id: materialId,
        packing_slips: {
          location_id: locationId,
          status: 'completed',
        }
      },
      include: {
        packing_slips: true,
        material: true,
      },
    });

    const groupedBySlip: Record<number, typeof packingSlipItems> = {};
    for (const item of packingSlipItems) {
      if (!groupedBySlip[item.packing_slip_id]) {
        groupedBySlip[item.packing_slip_id] = [];
      }
      groupedBySlip[item.packing_slip_id].push(item);
    }

    const packingSlipLogs = Object.entries(groupedBySlip).map(([slipId, items]) => {
      const totalNet = items.reduce(
        (sum, item) => sum + (item.gross_weight - item.tare_weight),
        0
      );

      const isOutbound = items[0].packing_slips.slip_type === 'outbound';
      const adjustedChange = isOutbound ? -totalNet : totalNet;
      const packingSlip = items[0].packing_slips;

      return formatEntry(
        packingSlip.date_time,
        adjustedChange,
        'Packing Slip',
        {
          packingSlipId: Number(slipId),
          remarks: null,
          unit: items[0].material.unit || 'lb',
          slipType: isOutbound ? 'Outbound' : 'Inbound',
          packingSlip: {
            id: packingSlip.id,
            slip_type: packingSlip.slip_type,
            from_name: packingSlip.from_name,
            to_name: packingSlip.to_name,
          },
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
        linked_slip: true, // 👈 include linked slip
      },
    });

    const reclassificationLogs = reclassLogs.map(entry => {
      const isFrom = entry.from_material_id === materialId;
      const change = isFrom ? -entry.quantity : entry.quantity;

      const movedMaterialName = isFrom
        ? entry.to_material?.name || 'Unknown'
        : entry.from_material?.name || 'Unknown';

      return formatEntry(entry.timestamp, change, 'Reclassification', {
        load: entry.load || null,
        reason: entry.reason || null,
        direction: isFrom ? 'From' : 'To',
        unit: material?.unit ?? 'lb',
        ...(isFrom ? { movedTo: movedMaterialName } : { movedFrom: movedMaterialName }),
        packingSlipId: entry.linked_slip_id || null,
        packingSlip: entry.linked_slip
          ? {
              id: entry.linked_slip.id,
              slip_type: entry.linked_slip.slip_type,
              from_name: entry.linked_slip.from_name,
              to_name: entry.linked_slip.to_name,
            }
          : null,
      });
    });


    // --- MANUAL ADJUSTMENTS ---
    const adjustmentLogs = await prisma.inventoryAdjustment.findMany({
      where: {
        material_id: materialId,
        location_id: locationId,
      },
      include: {
        linked_slip: true,
      },
    });

    const adjustmentEntries = adjustmentLogs.map(entry =>
      formatEntry(entry.timestamp, entry.change, 'Manual Adjustment', {
        reason: entry.reason || null,
        unit: material?.unit ?? '',
        packingSlipId: entry.linked_slip_id || null,
        packingSlip: entry.linked_slip
          ? {
              id: entry.linked_slip.id,
              slip_type: entry.linked_slip.slip_type,
              from_name: entry.linked_slip.from_name,
              to_name: entry.linked_slip.to_name,
            }
          : null,
      })
    );

    // --- CURRENT INVENTORY ---
    const currentInventory = await prisma.inventory.findUnique({
      where: {
        uniq_material_location: {
          material_id: materialId,
          location_id: locationId,
        },
      },
      select: {
        quantity: true,
      },
    });

    let runningInventory = currentInventory?.quantity ?? 0;

    // --- MERGE, SORT, SNAPSHOT ---
    const fullLogUnsorted = [
      ...packingSlipLogs,
      ...reclassificationLogs,
      ...adjustmentEntries,
    ];

    const sortedLog = fullLogUnsorted.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const fullLogWithSnapshots = sortedLog.map(entry => {
      const entryWithSnapshot = {
        ...entry,
        snapshot_quantity: runningInventory,
      };
      runningInventory -= entry.change;
      return entryWithSnapshot;
    });

    res.json(fullLogWithSnapshots);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;