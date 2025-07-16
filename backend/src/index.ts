import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import packingSlipRoutes from '../routes/packingSlipRoutes'
import reclassifyRoutes from '../routes/reclassifyRoutes';
import inventoryAdjustmentRoutes from '../routes/inventoryAdjustmentRoutes';
import auditLogRoutes from '../routes/auditLogRoutes';


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
app.use('/api/packing-slips', packingSlipRoutes)
app.use('/api/inventory', reclassifyRoutes) // ✅
app.use('/api/inventory-adjustments', inventoryAdjustmentRoutes);
app.use('/api/inventory', auditLogRoutes);

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

// Test Route, remove later
app.get('/api/test-audit', handle(async (req, res) => {
  const locationId = 1;
  const materialId = 2;

  // Copy your actual audit query here (or call a helper function if abstracted)
  const prisma = new PrismaClient();

  // Packing slips
  const packingSlipEntries = await prisma.packing_slip_items.findMany({
    where: { material_id: materialId },
    include: {
      packing_slips: true,
    },
  });

  const packingSlipLogs = packingSlipEntries
    .filter(item => item.packing_slips?.location_id === locationId)
    .map(item => {
      const net = item.gross_weight - item.tare_weight;
      return {
        timestamp: item.packing_slips.date_time,
        change: net,
        source: 'Packing Slip',
        packingSlipId: item.packing_slip_id,
        remarks: item.remarks || null,
      };
    });

  // Reclassifications
  const reclassLogs = await prisma.reclassificationLog.findMany({
    where: {
      location_id: locationId,
      OR: [
        { from_material_id: materialId },
        { to_material_id: materialId },
      ],
    },
  });

  const reclassificationLogs = reclassLogs.map(entry => {
    const isFrom = entry.from_material_id === materialId;
    const change = isFrom ? -entry.quantity : entry.quantity;

    return {
      timestamp: entry.timestamp,
      change,
      source: 'Reclassification',
      reason: entry.reason || null,
      load: entry.load || null,
      direction: isFrom ? 'From' : 'To',
    };
  });

  // Manual Adjustments
  const adjustmentLogs = await prisma.inventoryAdjustment.findMany({
    where: {
      material_id: materialId,
      location_id: locationId,
    },
  });

  const adjustmentEntries = adjustmentLogs.map(entry => ({
    timestamp: entry.timestamp,
    change: entry.change,
    source: 'Manual Adjustment',
    reason: entry.reason || null,
  }));

  // Combine and sort
  const fullLog = [...packingSlipLogs, ...reclassificationLogs, ...adjustmentEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  res.json(fullLog);
}));




// Locations endpoints
app.get('/api/locations', handle(async (req, res) => {
  try {
    const location = await prisma.locations.findMany();
    res.json(location);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: "Database error" });
  }
}));

app.post('/api/locations', handle(async (req, res) => {
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
app.get('/api/materials', handle(async (req, res) => {
  try {
    const material = await prisma.materials.findMany();
    res.json(material);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: "Database error" });
  }
}));

app.post('/api/materials', handle(async (req, res) => {
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
app.get('/api/inventory', handle(async (req, res) => {
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

app.post('/api/inventory', handle(async (req, res) => {
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

app.put('/api/inventory/:materialId/:locationId', handle(async (req, res) => {
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