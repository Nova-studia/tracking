// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { clientService, driverService, vehicleService } = require('./services');

const app = express();

// Conectar a MongoDB
connectDB(process.env.MONGODB_URI);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/clients', async (req, res) => {
  try {
    const client = await clientService.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
    try {
      console.log('Datos recibidos:', req.body); // Añade esta línea
      const vehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Error completo:', error); // Añade esta línea
      res.status(400).json({ message: error.message });
    }
  });

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/status', async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/driver', async (req, res) => {
  try {
    const vehicle = await vehicleService.assignDriver(req.params.id, req.body.driverId);
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));