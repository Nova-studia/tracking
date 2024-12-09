// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { clientService, driverService, vehicleService } = require('./services');
const Vehicle = require('./models/Vehicle');

const app = express();

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Conectar a MongoDB
connectDB(process.env.MONGODB_URI);

// Middleware
app.use(cors());
app.use(express.json());

// Usuarios con claves visibles
const users = {
  admin: { 
    password: '1212',
    role: 'admin' 
  },
  driver1: { 
    password: '1212',
    role: 'driver' 
  },
  driver2: { 
    password: '1212',
    role: 'driver' 
  },
  driver3: { 
    password: '1212',
    role: 'driver' 
  }
};

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware de rol
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }
    next();
  };
};

// Ruta de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      username,
      role: user.role
    }
  });
});

// Rutas protegidas - Clientes
app.post('/api/clients', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const client = await clientService.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/clients', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas protegidas - Conductores
app.post('/api/drivers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/drivers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas protegidas - Vehículos
app.post('/api/vehicles', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error completo:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    
    // Filtrar vehículos según el rol
    if (req.user.role === 'driver') {
      const driverVehicles = vehicles.filter(v => 
        v.driverId?.name === req.user.username
      );
      return res.json(driverVehicles);
    }
    
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/status', authMiddleware, async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    
    // Verificar permisos
    if (req.user.role === 'driver' && vehicle.driverId?.name !== req.user.username) {
      return res.status(403).json({ message: 'No autorizado para actualizar este vehículo' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/driver', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const updatedVehicle = await vehicleService.assignDriver(req.params.id, req.body.driverId);
    
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error en servidor:', error);
    res.status(400).json({ message: error.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));