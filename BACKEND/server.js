require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { clientService, driverService, vehicleService } = require('./services');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const User = require('./models/User');

const app = express();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportes';
const PORT = process.env.PORT || 5000;

// Función de inicialización del sistema
const initializeSystem = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('🔧 Creando usuario administrador por defecto...');
      const hashedPassword = await bcrypt.hash('1212', 10);
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Usuario administrador creado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error en la inicialización del sistema:', error);
    process.exit(1);
  }
};

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    await initializeSystem();
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Debug Middleware - Log todas las peticiones
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  if (req.headers.authorization) {
    console.log('Token provided:', req.headers.authorization.substring(0, 20) + '...');
  }
  next();
});

// Middleware de autenticación
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('🔑 Verificando token:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔓 Token decodificado:', decoded);

    const user = await User.findOne({ username: decoded.username, isActive: true });
    console.log('👤 Usuario encontrado:', user ? {
      username: user.username,
      role: user.role,
      isActive: user.isActive
    } : 'No encontrado');
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    req.user = {
      username: user.username,
      role: user.role,
      id: user._id
    };

    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      console.log('🚗 Info del conductor:', driver ? {
        id: driver._id,
        name: driver.name
      } : 'No encontrado');
      
      if (driver) {
        req.user.driverId = driver._id;
      }
    }

    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return res.status(401).json({ message: 'Token inválido', error: error.message });
  }
};

// Middleware de roles
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    console.log(`👮 Verificando rol: Usuario ${req.user.username} (${req.user.role}) - Roles permitidos: ${roles.join(', ')}`);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }
    next();
  };
};

// Autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔑 Intento de login:', { username, passwordProvided: !!password });

    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Validación de contraseña:', isValidPassword ? 'Correcta' : 'Incorrecta');

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    let userData = {
      username: user.username,
      role: user.role,
      id: user._id
    };

    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (!driver) {
        return res.status(404).json({ message: 'Información de conductor no encontrada' });
      }
      userData = {
        ...userData,
        driverId: driver._id.toString(),
        name: driver.name
      };
    }

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log('🎟️ Token generado para:', userData.username);

    res.json({ token, user: userData });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Rutas de clientes
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

// Rutas de conductores
app.post('/api/drivers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    console.log('📝 Creando nuevo conductor:', req.body);
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error('❌ Error creando conductor:', error);
    res.status(400).json({ 
      message: 'Error al crear conductor',
      error: error.message 
    });
  }
});

app.get('/api/drivers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const drivers = await driverService.getAllDrivers();
    console.log(`📋 Conductores obtenidos: ${drivers.length}`);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/drivers/:id/credentials', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    console.log('🔄 Actualizando credenciales del conductor:', { id, updateUsername: !!username });
    
    const updatedDriver = await driverService.updateDriverCredentials(id, { username, password });
    console.log('✅ Credenciales actualizadas para:', updatedDriver.username);
    
    res.json(updatedDriver);
  } catch (error) {
    console.error('❌ Error actualizando credenciales:', error);
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/drivers/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Cambiando estado del conductor:', id);
    
    const updatedDriver = await driverService.toggleDriverStatus(id);
    console.log('✅ Estado actualizado:', {
      id: updatedDriver._id,
      isActive: updatedDriver.isActive
    });
    
    res.json(updatedDriver);
  } catch (error) {
    console.error('❌ Error cambiando estado del conductor:', error);
    res.status(400).json({ message: error.message });
  }
});

// Rutas de vehículos
app.post('/api/vehicles', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Buscando vehículos para:', {
      username: req.user.username,
      role: req.user.role
    });

    let vehicles = await vehicleService.getAllVehicles();
    
    if (req.user.role === 'driver') {
      if (!req.user.driverId) {
        console.log('❌ Conductor no encontrado');
        return res.status(404).json({ message: 'Conductor no encontrado' });
      }
      vehicles = vehicles.filter(v => 
        v.driverId && 
        (v.driverId._id.toString() === req.user.driverId.toString() || 
         v.driverId.toString() === req.user.driverId.toString())
      );
      console.log(`📋 Vehículos filtrados para conductor: ${vehicles.length}`);
    }
    
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/status', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('driverId');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    if (req.user.role === 'driver') {
      if (!req.user.driverId || 
          vehicle.driverId._id.toString() !== req.user.driverId.toString()) {
        return res.status(403).json({ message: 'No autorizado para actualizar este vehículo' });
      }
    }

    const updatedVehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    res.json(updatedVehicle);
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
    res.status(400).json({ message: error.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});