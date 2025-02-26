require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { clientService, driverService, vehicleService, authService } = require('./services');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const User = require('./models/User');
const State = require('./models/State');
const { uploadMiddleware, cloudinary } = require('./config/cloudinary');
const Notification = require('./models/Notification');

// Importar el middleware de autenticación
const auth = require('./middleware/auth');
// Importar las rutas
const vehiclesRoutes = require('./routes/vehicles');
const partnersRoutes = require('./routes/partners');

const app = express();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
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
        isActive: true,
        state: 'N/A',
        partnerGroup: 'main',
        isMainAdmin: true // El admin por defecto es admin principal
      });
      await adminUser.save();
      console.log('✅ Usuario administrador creado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error en la inicialización del sistema:', error);
    process.exit(1);
  }
};

const initializeStates = async () => {
  try {
    const states = [
      'GA', 'NC', 'TN', 'KY', 'IL',
      'MO', 'KS', 'OK', 'AL', 'SC',
      'FL', 'MS', 'OH', 'LA', 'MI',
      'AR', 'TX'
    ];

    for (const state of states) {
      const existingState = await State.findOne({ state });
      if (!existingState) {
        await State.create({ state });
        console.log(`✅ Estado creado: ${state}`);
      }
    }

    console.log('✅ Estados inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando estados:', error);
  }
};

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    await initializeSystem();
    await initializeStates();
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Debug Middleware
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

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const authResult = await authService.login(username, password);
    res.json(authResult);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// Uso de archivos de rutas
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/partners', partnersRoutes);

// Rutas de clientes
app.post('/api/clients', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const client = await clientService.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/clients', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas de conductores
// Rutas de conductores
app.post('/api/drivers', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es socio o admin NO principal, asignar el mismo grupo al conductor
    if (req.user.role === 'partner' || (req.user.role === 'admin' && !req.user.isMainAdmin)) {
      req.body.partnerGroup = req.user.partnerGroup;
      console.log(`Asignando grupo ${req.user.partnerGroup} al nuevo conductor`);
    }
    
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/drivers', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es admin principal, mostrar todos los conductores
    if (req.user.isMainAdmin) {
      const drivers = await driverService.getAllDrivers();
      return res.json(drivers);
    }
    
    // Si es socio o admin regular, filtrar por su grupo
    const drivers = await driverService.getAllDrivers();
    console.log(`Filtrando conductores por grupo: ${req.user.partnerGroup}`);
    
    // Filtrar por partnerGroup, considerando tanto el campo en driver como en userId
    const filteredDrivers = drivers.filter(driver => {
      // Verificar el partnerGroup del conductor directamente
      const driverGroup = driver.partnerGroup;
      
      // Verificar el partnerGroup del usuario asociado
      const userGroup = driver.userId && typeof driver.userId === 'object' ? 
        driver.userId.partnerGroup : null;
      
      // Verificar si alguno coincide con el grupo del socio
      const matchesGroup = 
        (driverGroup && driverGroup === req.user.partnerGroup) || 
        (userGroup && userGroup === req.user.partnerGroup);
      
      if (matchesGroup) {
        console.log(`✅ Driver encontrado para grupo ${req.user.partnerGroup}: ${driver.name}`);
      }
      
      return matchesGroup;
    });
    
    console.log(`Se encontraron ${filteredDrivers.length} conductores para el grupo ${req.user.partnerGroup}`);
    res.json(filteredDrivers);
  } catch (error) {
    console.error('❌ Error en GET /api/drivers:', error);
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/drivers/:id/credentials', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es socio, verificar que el conductor pertenezca a su grupo
    if (req.user.role === 'partner' && !req.user.isMainAdmin) {
      const driver = await driverService.getDriverById(req.params.id);
      if (driver.partnerGroup !== req.user.partnerGroup) {
        return res.status(403).json({ message: 'No autorizado para modificar este conductor' });
      }
    }
    
    const updatedDriver = await driverService.updateDriverCredentials(req.params.id, req.body);
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/drivers/:id/status', auth, async (req, res) => {
  try {
    // Verificar que sea admin o socio
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es socio, verificar que el conductor pertenezca a su grupo
    if (req.user.role === 'partner' && !req.user.isMainAdmin) {
      const driver = await driverService.getDriverById(req.params.id);
      if (driver.partnerGroup !== req.user.partnerGroup) {
        return res.status(403).json({ message: 'No autorizado para modificar este conductor' });
      }
    }
    
    const updatedDriver = await driverService.toggleDriverStatus(req.params.id);
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rutas de estados
app.get('/api/states', async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas de notificaciones
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/notifications', auth, async (req, res) => {
  try {
    const notification = new Notification({
      userId: req.user.id,
      ...req.body
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id },
      { $set: { read: true } }
    );
    
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/notifications', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'Todas las notificaciones eliminadas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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