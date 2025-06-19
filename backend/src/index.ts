import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors'; // Add CORS support

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});const PORT = 3001;
app.use(cors());


// 1. Define a flexible handler type
type Handler = (req: express.Request, res: express.Response) => Promise<unknown>;

// 2. Create a wrapper function to bypass strict typing
const handle = (fn: Handler) => fn as express.RequestHandler;

app.use(cors({
  origin: 'http://localhost:3000', // Allow your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));app.use(express.json());

app.get('/db-check', async (req, res) => {
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test write and read
    const testRecord = await prisma.locations.create({
      data: { name: `Test Location ${Date.now()}` }
    });
    
    const readRecord = await prisma.locations.findUnique({
      where: { id: testRecord.id }
    });
    
    res.json({
      connection: "success",
      writeReadTest: readRecord ? "success" : "failed",
      testId: testRecord.id
    });
  } catch (error) {
    res.status(500).json({
      error: "Database check failed",
      details: error.message
    });
  }
});

// Test endpoint
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

app.get('/db-status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "connected" });
  } catch (error) {
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

app.get('/test-write', async (req, res) => {
  try {
    // Create test material
    const material = await prisma.materials.create({
      data: { 
        name: `Test Material ${Date.now()}`, 
        category: "Test" 
      }
    });
    
    // Create test location
    const location = await prisma.locations.create({
      data: { 
        name: `Test Location ${Date.now()}`, 
        address: "Test Address" 
      }
    });
    
    res.json({ material, location });
  } catch (error) {
    res.status(500).json({ 
      error: "Test write failed",
      details: error.message
    });
  }
});

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

// Add this utility function to safely handle errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Get packing slips by status
app.get('/packing-slips/:status', handle(async (req, res) => {
  try {
    const { status } = req.params;
    const slips = await prisma.packing_slips.findMany({
      where: { status }, // ACTUALLY USE THE STATUS PARAMETER HERE
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

// Update packing slip
app.put('/packing-slips/:id', handle(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedSlip = await prisma.packing_slips.update({
      where: { id },
      data: req.body,
      include: {
        packing_slip_items: true,
        locations: true
      }
    });
    res.json(updatedSlip);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ 
      error: "Failed to update packing slip",
      details: message
    });
  }
}));

// Delete packing slip
app.delete('/packing-slips/:id', handle(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // First delete associated items
    await prisma.packing_slip_items.deleteMany({
      where: { packing_slip_id: id }
    });
    
    // Then delete the slip
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

app.post('/packing-slips', handle(async (req, res) => {
  try {
    const { 
      slip_type, 
      location_id,
      items,
      status = "draft",
      from_name,
      to_name,
      truck_number,
      trailer_number,
      po_number,
      seal_number
    } = req.body;
    
    // Validate required fields
    if (!slip_type || !location_id || !items) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create packing slip
    const newSlip = await prisma.packing_slips.create({
      data: {
        slip_type,
        status,
        location_id: parseInt(location_id),
        from_name,
        to_name,
        truck_number,
        trailer_number,
        po_number,
        seal_number,
        packing_slip_items: {
          create: items.map((item) => ({
            material_id: parseInt(item.material_id.toString()),
            gross_weight: parseFloat(item.gross_weight.toString()),
            tare_weight: parseFloat(item.tare_weight.toString()),
            net_weight: parseFloat(item.gross_weight.toString()) - parseFloat(item.tare_weight.toString()),
            remarks: item.remarks || "",
            ticket_number: item.ticket_number || ""
          }))
        }
      },
      include: { 
        packing_slip_items: true
      }
    });

    // Adjust inventory
    for (const item of items) {
      const materialId = parseInt(item.material_id.toString());
      const locationId = parseInt(location_id.toString());
      const netWeight = parseFloat(item.gross_weight.toString()) - 
                        parseFloat(item.tare_weight.toString());
      const quantityChange = slip_type === "outbound" ? -netWeight : netWeight;

      await prisma.inventory.upsert({
        where: {
          uniq_material_location: {
            material_id: materialId,
            location_id: locationId
          }
        },
        update: { quantity: { increment: quantityChange } },
        create: {
          material_id: materialId,
          location_id: locationId,
          quantity: quantityChange
        }
      });
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

// Start server
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected');
    // Test connection immediately
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