import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import packingSlipRoutes from '../routes/packingSlipRoutes'
import reclassifyRoutes from '../routes/reclassifyRoutes';


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
app.get('/api/locations', handle(async (req, res) => {
  try {
    const locations = await prisma.locations.findMany();
    res.json(locations);
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