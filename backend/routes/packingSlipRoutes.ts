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
    }))
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

// Routes

router.get('/', handle(async (req, res) => {
  const slips = await prisma.packing_slips.findMany({
    include: {
      packing_slip_items: { include: { material: true } }
    },
    orderBy: { id: 'desc' }
  });
  res.json(slips.map(transformPackingSlip));
}));

router.get('/status/:status', handle(async (req, res) => {
  const { status } = req.params;
  const slips = await prisma.packing_slips.findMany({
    where: { status },
    include: {
      packing_slip_items: { include: { material: true } },
      location: true
    }
  });
  res.json(slips.map(transformPackingSlip));
}));

router.get('/all', handle(async (req, res) => {
  const slips = await prisma.packing_slips.findMany({
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

  const slip = await prisma.packing_slips.findUnique({
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
    status: req.body.status // Always include status if present
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

router.delete('/:id', handle(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid packing slip ID" });

  // Fetch the slip with items to check status and reverse inventory
  const slip = await prisma.packing_slips.findUnique({
    where: { id },
    include: {
      packing_slip_items: { include: { material: true } }
    }
  });

  if (!slip) return res.status(404).json({ error: "Packing slip not found" });

    console.log("🧾 Deleting slip ID:", id, "with status:", slip.status);
    console.log("🧾 Items:", slip.packing_slip_items);

    if (slip.status === 'completed') {
      console.log("♻️ Reversing inventory...");
      await reverseInventory(transformPackingSlip(slip));
  }

  

  // 🚮 Delete related items then the slip itself
  await prisma.packing_slip_items.deleteMany({ where: { packing_slip_id: id } });
  await prisma.packing_slips.delete({ where: { id } });

  res.status(204).end();
}));


export default router;
