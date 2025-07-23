import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handle } from '../utils/handle';
import { RawItemInput } from '../src/types';
import { Prisma } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

interface PackingSlip {
  id: string;
  slip_type: string;
  location_id: number;
  location_name?: string;
  location?: {
    name: string;
    address?: string | null;
  };
  status: string;
  from_name: string | null;
  to_name: string | null;
  truck_number: string | null;
  trailer_number: string | null;
  po_number: string | null;
  seal_number: string | null;
  date_time: Date;
  packing_slip_items: {
    id: string;
    material_id: number;
    material_name: string;
    gross_weight: number;
    tare_weight: number;
    remarks: string;
    ticket_number: string;
  }[];
  deleted_at?: Date | null;
  // Extra packig slip info
  vesselNumber?: string | null;
  voyageNumber?: string | null;
  containerNumber?: string | null;
  multiPoNotes?: string[] | null;
  customerAddress?: string | null;
  carrierName?: string | null;
  pickupNumber?: string | null;
  deliveryNumber?: string | null;
  deliveryDateTime?: Date | null;
  orderNumber?: string | null;
  careOf?: string | null;
  slipGroupId?: number | null;
}

interface RawPackingSlipItem {
  id: number;
  material_id: number;
  gross_weight: number;
  tare_weight: number;
  remarks: string | null;
  ticket_number: string | null;
  material: {
    name: string;
  };
}

interface RawPackingSlip {
  id: number;
  slip_type: string;
  location_id: number;
  status: string;
  from_name: string | null;
  to_name: string | null;
  truck_number: string | null;
  trailer_number: string | null;
  po_number: string | null;
  seal_number: string | null;
  date_time: Date;
  deleted_at?: Date | null;

  // Extra packig slip info
  vesselNumber?: string | null;
  voyageNumber?: string | null;
  containerNumber?: string | null;
  multiPoNotes?: string[] | null;
  customerAddress?: string | null;
  carrierName?: string | null;
  pickupNumber?: string | null;
  deliveryNumber?: string | null;
  deliveryDateTime?: Date | null;
  orderNumber?: string | null;
  careOf?: string | null;
  slipGroupId?: number | null;

  packing_slip_items?: RawPackingSlipItem[];
  location?: {
    name: string;
    address?: string | null;
  }
}

function transformPackingSlip(slip: RawPackingSlip): PackingSlip {
  return {
    id: String(slip.id),
    slip_type: slip.slip_type,
    location_id: slip.location_id,
    location_name: slip.location?.name ?? 'N/A',
    location: slip.location ? {
      name: slip.location.name,
      address: slip.location.address ?? undefined
    } : undefined,
    status: slip.status,
    deleted_at: slip.deleted_at,
    from_name: slip.from_name,
    to_name: slip.to_name,
    truck_number: slip.truck_number,
    trailer_number: slip.trailer_number,
    po_number: slip.po_number,
    seal_number: slip.seal_number,
    date_time: slip.date_time,
    packing_slip_items: (slip.packing_slip_items || []).map(item => ({
      id: String(item.id),
      material_id: item.material_id,
      material_name: item.material?.name ?? '',
      gross_weight: item.gross_weight,
      tare_weight: item.tare_weight,
      remarks: item.remarks || "",
      ticket_number: item.ticket_number || ""
    })),
    // New optional advanced fields 
    vesselNumber: slip.vesselNumber ?? null,
    voyageNumber: slip.voyageNumber ?? null,
    containerNumber: slip.containerNumber ?? null,
    multiPoNotes: slip.multiPoNotes ?? null,
    customerAddress: slip.customerAddress ?? null,
    carrierName: slip.carrierName ?? null,
    pickupNumber: slip.pickupNumber ?? null,
    deliveryNumber: slip.deliveryNumber ?? null,
    deliveryDateTime: slip.deliveryDateTime ?? null,
    orderNumber: slip.orderNumber ?? null,
    careOf: slip.careOf ?? null,
    slipGroupId: slip.slipGroupId ?? null,

  };
}


async function updateInventory(slip: PackingSlip) {

  console.log("🚀 updateInventory called for slip ID:", slip.id);

  const isOutbound = slip.slip_type === 'outbound';
  for (const item of slip.packing_slip_items) {
    const netWeight = item.gross_weight - item.tare_weight;
    const quantityChange = isOutbound ? -netWeight : netWeight;

    await prisma.inventory.upsert({
      where: {
        uniq_material_location: {
          material_id: item.material_id,
          location_id: slip.location_id
        }
      },
      update: { 
        quantity: { increment: quantityChange }, 
      },
      create: {
        material_id: item.material_id,
        location_id: slip.location_id,
        quantity: quantityChange
      }
    });
  }
}

async function reverseInventory(slip: PackingSlip) {
  const isOutbound = slip.slip_type === 'outbound';
  for (const item of slip.packing_slip_items) {
    const netWeight = item.gross_weight - item.tare_weight;
    const quantityChange = isOutbound ? netWeight : -netWeight;

    await prisma.inventory.update({
      where: {
        uniq_material_location: {
          material_id: item.material_id,
          location_id: slip.location_id
        }
      },
      data: { 
        quantity: { increment: quantityChange }, 
      }
    });
  }
}

async function getCurrentInventory(material_id: number, location_id: number): Promise<number> {
  const inv = await prisma.inventory.findUnique({
    where: {
      uniq_material_location: { material_id, location_id }
    }
  });
  return inv?.quantity ?? 0;
}


// Routes
router.get('/', handle(async (req, res) => {
  const includeDeleted = req.query.includeDeleted === 'true';

  const slips = await prisma.packing_slips.findMany({
    where: includeDeleted ? {} : { deleted_at: null },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    },
    orderBy: { id: 'desc' }
  });

  res.json(slips.map(transformPackingSlip));
}));


router.get('/status/:status', handle(async (req, res) => {
  const { status } = req.params;
  const slips = await prisma.packing_slips.findMany({
    where: { 
      status,
    deleted_at: null
   },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    }
  });
  res.json(slips.map(transformPackingSlip));
}));

router.get('/all', handle(async (req, res) => {
  const slips = await prisma.packing_slips.findMany({
    where: {
      deleted_at: null  // ← Exclude soft-deleted slips
    },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    }
  });
  res.json(slips.map(transformPackingSlip));
}));

router.get('/:id', handle(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid packing slip ID" });

  const slip = await prisma.packing_slips.findFirst({
    where: { id },
    include: {
      packing_slip_items: {
        include: {
          material: true, // ✅ correct singular relation
        },
      },
      location: true,
    },
  });

  if (!slip) return res.status(404).json({ error: "Packing slip not found" });

  res.json(transformPackingSlip(slip));
}));

// Admin View deleted slips
router.get('/deleted', handle(async (req, res) => {
  const slips = await prisma.packing_slips.findMany({
    where: {
      deleted_at: { not: null }
    },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    },
    orderBy: { deleted_at: 'desc' }
  });

  res.json(slips.map(transformPackingSlip));
}));

router.post('/', handle(async (req, res) => {
  const body = req.body;

  const {
    slip_type,
    location_id,
    items = [],
    status = "draft",
    from_name,
    to_name,
    truck_number,
    trailer_number,
    po_number,
    seal_number
  } = body;

  if (!slip_type || !location_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedLocationId = parseInt(location_id);
  if (isNaN(parsedLocationId)) {
    return res.status(400).json({ error: 'Invalid location ID' });
  }

  const newSlip = await prisma.packing_slips.create({
    data: {
      slip_type,
      status,
      location_id: parsedLocationId,
      from_name: from_name || null,
      to_name: to_name || null,
      truck_number: truck_number || null,
      trailer_number: trailer_number || null,
      po_number: po_number || null,
      seal_number: seal_number || null,
      vesselNumber: body.vesselNumber || null,
      voyageNumber: body.voyageNumber || null,
      containerNumber: body.containerNumber || null,
      multiPoNotes: body.multiPoNotes || null,
      customerAddress: body.customerAddress || null,
      carrierName: body.carrierName || null,
      pickupNumber: body.pickupNumber || null,
      deliveryNumber: body.deliveryNumber || null,
      deliveryDateTime: body.deliveryDateTime || null,
      orderNumber: body.orderNumber || null,
      careOf: body.careOf || null,
      slipGroupId: body.slipGroupId || null,
      packing_slip_items: {
        create: items.map(item => ({
          material_id: parseInt(item.material_id),
          gross_weight: parseFloat(item.gross_weight),
          tare_weight: parseFloat(item.tare_weight),
          remarks: item.remarks || "",
          ticket_number: item.ticket_number || ""
        }))
      }
    },
    include: {
      packing_slip_items: { include: { material: true } }
    }
  });

  if (newSlip.status === 'completed') {
    await updateInventory(transformPackingSlip(newSlip));
  }

  res.status(201).json(transformPackingSlip(newSlip));
}));

router.patch('/:id', handle(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid packing slip ID" });

  const current = await prisma.packing_slips.findUnique({
    where: { id },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    }
  });

  if (!current) return res.status(404).json({ error: "Packing slip not found" });

  // Prepare update data
  const updateData: Prisma.packing_slipsUpdateInput = {
    from_name: req.body.from_name,
    to_name: req.body.to_name,
    truck_number: req.body.truck_number,
    trailer_number: req.body.trailer_number,
    po_number: req.body.po_number,
    seal_number: req.body.seal_number,
    slip_type: req.body.slip_type,
    status: req.body.status, // Always include status if present

    vesselNumber: req.body.vesselNumber,
    voyageNumber: req.body.voyageNumber,
    containerNumber: req.body.containerNumber,
    multiPoNotes: req.body.multiPoNotes,
    customerAddress: req.body.customerAddress,
    carrierName: req.body.carrierName,
    pickupNumber: req.body.pickupNumber,
    deliveryNumber: req.body.deliveryNumber,
    deliveryDateTime: req.body.deliveryDateTime,
    orderNumber: req.body.orderNumber,
    careOf: req.body.careOf,
    slipGroupId: req.body.slipGroupId
  };

  // Delete existing items if new items are provided
  if (Array.isArray(req.body.items)) {
    await prisma.packing_slip_items.deleteMany({ where: { packing_slip_id: id } });

    updateData.packing_slip_items = {
      create: req.body.items.map((item: RawItemInput) => ({
        material_id: parseInt(item.material_id),
        gross_weight: parseFloat(item.gross_weight),
        tare_weight: parseFloat(item.tare_weight),
        remarks: item.remarks || "",
        ticket_number: item.ticket_number || ""
      }))
    };
  }

  console.log("☑️ Final updateData object:", updateData);
  console.log("☑️ typeof updateData.status:", typeof updateData.status);
  console.log("☑️ updateData.status value:", updateData.status);


  // Apply a single update with all fields
  await prisma.packing_slips.update({
    where: { id },
    data: updateData
  });

  // Inventory adjustments if status changed
  if (req.body.status && req.body.status !== current.status) {
    const updated = await prisma.packing_slips.findUnique({
      where: { id },
      include: {
        packing_slip_items: { include: { material: true } },
      }
    });

    if (updated) {
      const transformed = transformPackingSlip(updated);
      if (req.body.status === 'completed') {
        await updateInventory(transformed);
      } else if (current.status === 'completed') {
        await reverseInventory(transformed);
      }
    }
  }

  const final = await prisma.packing_slips.findUnique({
    where: { id },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    }
  });

  console.log("✅ Final slip returned from DB:", final);

  res.json(transformPackingSlip(final!));
}));

// DELETE /packing-slips/:id
router.delete('/:id', async (req, res) => {
  const slipId = parseInt(req.params.id);
  if (isNaN(slipId)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const slip = await prisma.packing_slips.findUnique({
      where: { id: slipId },
      include: {
        packing_slip_items: true,
        location: true,
      },
    });

    if (!slip) return res.status(404).json({ error: 'Packing slip not found' });

    const locationId = slip.location_id;

    // Reverse inventory if completed
    if (slip.status === 'completed') {
      for (const item of slip.packing_slip_items) {
        const netWeight = item.gross_weight - item.tare_weight;
        const inventoryChange = slip.slip_type === 'Inbound' ? -netWeight : netWeight;

        await prisma.inventory.updateMany({
          where: {
            material_id: item.material_id,
            location_id: locationId,
          },
          data: {
            quantity: { decrement: inventoryChange },
          },
        });

        await prisma.inventoryAdjustment.create({
          data: {
            material_id: item.material_id,
            location_id: locationId,
            change: -inventoryChange,
            reason: `Reversal: Deleted Packing Slip #${slip.id}`,
            snapshot_quantity: await getCurrentInventory(item.material_id, locationId)
          },
        });
      }
    }

    // DRAFT slips can be fully deleted
    if (slip.status === 'draft') {
      await prisma.packing_slip_items.deleteMany({ where: { packing_slip_id: slipId } });
      await prisma.packing_slips.delete({ where: { id: slipId } });
      return res.json({ message: 'Draft packing slip permanently deleted.' });
    } else {
      // Completed slips are soft-deleted
      await prisma.packing_slips.update({
        where: { id: slipId },
        data: { deleted_at: new Date() }
      });
      return res.json({ message: 'Packing slip soft-deleted and inventory reversed.' });
    }
  } catch (err) {
    console.error('Error deleting packing slip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




export default router;