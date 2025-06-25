import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const PORT = 3001;

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

interface PackingSlip {
  slip_type: string;
  location_id: number;
  packing_slip_items: {
    material_id: number;
    gross_weight: number;
    tare_weight: number;
  }[];
}


// Fixed updateInventory function (resolved Prisma schema mismatch)
async function updateInventory(slip: PackingSlip) {
  const isOutbound = slip.slip_type === 'outbound';
  
  for (const item of slip.packing_slip_items) {
    const netWeight = item.gross_weight - item.tare_weight;
    const quantityChange = isOutbound ? -netWeight : netWeight;

    // FIXED: Use correct composite ID field name
    await prisma.inventory.upsert({
      where: {
        uniq_material_location: {
          material_id: item.material_id,
          location_id: slip.location_id
        }
      },
      update: { quantity: { increment: quantityChange } },
      create: {
        material_id: item.material_id,
        location_id: slip.location_id,
        quantity: quantityChange
      }
    });
  }
}

// Utility function
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Type-safe handler
type Handler = (req: express.Request, res: express.Response) => Promise<unknown>;
const handle = (fn: Handler) => fn as express.RequestHandler;


// Routes
app.get('/', handle(async (req, res) => {
  res.send('Backend is working!');
}));

// Locations endpoints
app.get('/locations', handle(async (req, res) => {
  try {
    const locations = await prisma.locations.findMany();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: "Database error" });
  }
}));

app.post('/locations', handle(async (req, res) => {
  try {
    const { name, address } = req.body;
    const newLocation = await prisma.locations.create({
      data: { name, address }
    });
    res.status(201).json(newLocation);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Error creating location:', message);
    res.status(500).json({ 
      error: "Failed to create location",
      details: message 
    });
  }
}));

// Materials endpoints
app.get('/materials', handle(async (req, res) => {
  try {
    const materials = await prisma.materials.findMany();
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: "Database error" });
  }
}));

app.post('/materials', handle(async (req, res) => {
  try {
    const { name, category, unit = "lb" } = req.body;
    const newMaterial = await prisma.materials.create({
      data: { name, category, unit }
    });
    res.status(201).json(newMaterial);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Error creating material:', message);
    res.status(500).json({ 
      error: "Failed to create material",
      details: message 
    });
  }
}));

// Inventory endpoints
app.get('/inventory', handle(async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        materials: true,
        locations: true
      }
    });
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: "Database error" });
  }
}));

app.post('/inventory', handle(async (req, res) => {
  try {
    const { material_id, location_id, quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    const newInventory = await prisma.inventory.create({
      data: {
        material_id,
        location_id,
        quantity
      },
      include: {
        materials: true,
        locations: true
      }
    });
    
    res.status(201).json(newInventory);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Error creating inventory record:', message);
    res.status(500).json({ 
      error: "Failed to create inventory record",
      details: message 
    });
  }
}));

app.put('/inventory/:materialId/:locationId', handle(async (req, res) => {
  try {
    const materialId = parseInt(req.params.materialId);
    const locationId = parseInt(req.params.locationId);
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    const updatedInventory = await prisma.inventory.update({
      where: {
        uniq_material_location: {
          material_id: materialId,
          location_id: locationId
        }
      },
      data: { quantity },
      include: {
        materials: true,
        locations: true
      }
    });
    
    res.json(updatedInventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
}));

// Packing slips endpoints
app.get('/packing-slips', handle(async (req, res) => {
  try {
    const packingSlips = await prisma.packing_slips.findMany({
      include: {
        packing_slip_items: true
      },
      orderBy: {
        id: 'desc'
      }
    });
    
    res.json(packingSlips);
  } catch (error) {
    console.error('Error fetching packing slips:', error);
    res.status(500).json({ error: 'Failed to fetch packing slips' });
  }
}));

app.get('/packing-slips/:status', handle(async (req, res) => {
  try {
    const { status } = req.params;
    const slips = await prisma.packing_slips.findMany({
      where: { status },
      include: { 
        packing_slip_items: {
          include: {
            materials: true
          }
        },
        locations: true 
      }
    });
    res.json(slips);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ 
      error: "Database error",
      details: message
    });
  }
}));

// FIXED: Corrected try/catch block structure
app.get('/packing-slips/:id', handle(async (req, res) => {
  try {
    const slip = await prisma.packing_slips.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        packing_slip_items: {
          include: {
            materials: true  // Include material details
          }
        },
        locations: true  // Include location details
      }
    });
    
    if (!slip) {
      return res.status(404).json({ error: "Packing slip not found" });
    }
    
    res.json(slip);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Error fetching packing slip:', errorMessage);
    res.status(500).json({ error: 'Failed to fetch packing slip' });
  }
}));



app.get('/packing-slips/all', handle(async (req, res) => {
  try {
    const slips = await prisma.packing_slips.findMany({
      include: { 
        packing_slip_items: {
          include: {
            materials: true
          }
        },
        locations: true 
      }
    });
    res.json(slips);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ 
      error: "Database error",
      details: message
    });
  }
}));

// Combine both update operations into one endpoint
app.patch('/packing-slips/:id', handle(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid packing slip ID" });
    }

    // Check if this is a status-only update
    const isStatusUpdate = Object.keys(req.body).length === 1 && req.body.status;

    // Fetch current slip
    const currentSlip = await prisma.packing_slips.findUnique({
      where: { id },
      include: { packing_slip_items: true }
    });

    if (!currentSlip) return res.status(404).json({ error: "Packing slip not found" });

    // Prepare update data
    const updateData = isStatusUpdate 
      ? { status: req.body.status }
      : {
          from_name: req.body.from_name,
          to_name: req.body.to_name,
          truck_number: req.body.truck_number,
          trailer_number: req.body.trailer_number,
          po_number: req.body.po_number,
          seal_number: req.body.seal_number
        };

    // Update slip
    const updatedSlip = await prisma.packing_slips.update({
      where: { id },
      data: updateData,
      include: { 
        packing_slip_items: true,
        locations: true
      }
    });

    // Handle inventory updates for status changes
    if (isStatusUpdate) {
      if (currentSlip.status !== 'completed' && req.body.status === 'completed') {
        await updateInventory(updatedSlip);
      } else if (currentSlip.status === 'completed' && req.body.status !== 'completed') {
        await reverseInventory(currentSlip);
      }
    }

    res.json(updatedSlip);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ 
      error: "Failed to update packing slip",
      details: message
    });
  }
}));

// Add this inventory reversal function
async function reverseInventory(slip: PackingSlip) {
  const isOutbound = slip.slip_type === 'outbound';
  
  for (const item of slip.packing_slip_items) {
    const netWeight = item.gross_weight - item.tare_weight;
    const quantityChange = isOutbound ? netWeight : -netWeight; // Reverse original change

    await prisma.inventory.update({
      where: {
        uniq_material_location: {
          material_id: item.material_id,
          location_id: slip.location_id
        }
      },
      data: { quantity: { increment: quantityChange } }
    });
  }
}

app.delete('/packing-slips/:id', handle(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.packing_slip_items.deleteMany({
      where: { packing_slip_id: id }
    });
    
    await prisma.packing_slips.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ 
      error: "Failed to delete packing slip",
      details: message
    });
  }
}));

// FIXED: Scoping issue with newSlip variable
app.post('/packing-slips', handle(async (req, res) => {
  try {
    console.log("Received packing slip creation request");

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
    } = req.body;

    console.log("Creating slip with:", { slip_type, location_id, items });

    const newSlip = await prisma.packing_slips.create({
      data: {
        slip_type,
        status,
        location_id: parseInt(location_id),
        from_name: from_name || null,
        to_name: to_name || null,
        truck_number: truck_number || null,
        trailer_number: trailer_number || null,
        po_number: po_number || null,
        seal_number: seal_number || null,
        packing_slip_items: {
          create: items.map((item) => ({
            material_id: parseInt(item.material_id),
            gross_weight: parseFloat(item.gross_weight),
            tare_weight: parseFloat(item.tare_weight),
            remarks: item.remarks || "",
            ticket_number: item.ticket_number || ""
          }))

      
        }
      },
      include: { 
        packing_slip_items: true
      }
    });

    console.log("Packing slip created successfully:", newSlip);

    // Moved inside try block to fix scoping issue
    if (newSlip.status === 'completed') {
      await updateInventory(newSlip);
    }

    res.status(201).json(newSlip);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Error creating packing slip:', message);
    res.status(500).json({ 
      error: "Failed to create packing slip",
      details: message 
    });
  }
}));

// Server startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected');
    
    prisma.$queryRaw`SELECT 1`
      .then(() => console.log('✅ Database connection verified'))
      .catch(e => console.error('❌ Database verification failed:', e));
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', getErrorMessage(error));
    process.exit(1);
  });