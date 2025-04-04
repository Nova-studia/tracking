require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { clientService, driverService, vehicleService, authService } = require('./services');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const User = require('./models/User');
const Client = require('./models/Client');
const State = require('./models/State');
const { uploadMiddleware, cloudinary } = require('./config/cloudinary');
const Notification = require('./models/Notification');

// Importar el middleware de autenticación
const auth = require('./middleware/auth');
// Importar las rutas
const vehiclesRoutes = require('./routes/vehicles');
const adminsRoutes = require('./routes/admins');

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
app.use('/api/admins', adminsRoutes);
app.use('/api/partners', (req, res, next) => {
  console.log(`Redirigiendo solicitud de /api/partners a /api/admins`);
  adminsRoutes(req, res, next);
});

// Rutas de clientes
app.post('/api/clients', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
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
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/clients/with-account', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Buscar clientes que tienen un userId asociado
    const clients = await Client.find({ userId: { $exists: true, $ne: null } })
      .populate('userId', 'username isActive');
    
    res.json(clients);
  } catch (error) {
    console.error('Error obteniendo clientes con cuenta:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para crear un cliente con cuenta de acceso
app.post('/api/clients/with-account', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { name, phoneNumber, username, password } = req.body;
    
    // Validaciones
    if (!name || !phoneNumber || !username || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    // Verificar que el username no exista
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }
    
    // Iniciar transacción
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Crear el usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        role: 'client',
        state: 'N/A', // En caso de clientes, puede no ser relevante
        isActive: true,
        partnerGroup: 'main'
      });
      
      await user.save({ session });
      
      // Crear o actualizar cliente con referencia al usuario
      let client;
      
      // Si el cliente ya existe, actualizar
      const existingClient = await Client.findOne({ name, phoneNumber });
      if (existingClient) {
        existingClient.userId = user._id;
        client = await existingClient.save({ session });
      } else {
        // Crear nuevo cliente
        client = new Client({
          name,
          phoneNumber,
          userId: user._id
        });
        
        await client.save({ session });
      }
      
      // Commit de la transacción
      await session.commitTransaction();
      
      // Responder con la información del cliente
      res.status(201).json({
        _id: client._id,
        name: client.name,
        phoneNumber: client.phoneNumber,
        userId: {
          _id: user._id,
          username: user.username,
          isActive: user.isActive
        }
      });
    } catch (error) {
      // En caso de error, abortar la transacción
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error creando cliente con cuenta:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para activar/desactivar cuenta de cliente
app.patch('/api/clients/:clientId/account-status', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const client = await Client.findById(req.params.clientId);
    
    if (!client || !client.userId) {
      return res.status(404).json({ message: 'Cliente o cuenta de usuario no encontrada' });
    }
    
    // Obtener el usuario y cambiar su estado
    const user = await User.findById(client.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      _id: client._id,
      name: client.name,
      phoneNumber: client.phoneNumber,
      userId: {
        _id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error cambiando estado de cuenta:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint específico para que los clientes vean sus vehículos
app.get('/api/clients/portal/:clientId/vehicles', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea un cliente
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Buscar el cliente asociado al usuario
    const client = await Client.findOne({ userId: req.user.id });
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Buscar los vehículos asociados a este cliente
    const vehicles = await Vehicle.find({ clientId: client._id })
      .select('brand model year LOT PIN auctionHouse lotLocation city state status loadingPhotos travelComments createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error obteniendo vehículos del cliente:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rutas de conductores
app.post('/api/drivers', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es admin NO principal, asignar el mismo grupo al conductor
    if (!req.user.isMainAdmin) {
      req.body.partnerGroup = req.user.partnerGroup;
      console.log(`Asignando grupo ${req.user.partnerGroup} al nuevo conductor`);
    }
    
    // Verificación adicional para asegurar que partnerGroup no sea undefined o null
    if (!req.body.partnerGroup) {
      req.body.partnerGroup = req.user.isMainAdmin ? 'main' : req.user.partnerGroup;
      console.log(`Asignando grupo predeterminado ${req.body.partnerGroup} al nuevo conductor`);
    }
    
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/drivers', auth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si es admin principal, mostrar todos los conductores
    if (req.user.isMainAdmin) {
      const drivers = await driverService.getAllDrivers();
      return res.json(drivers);
    }
    
    // Si es admin regular, filtrar por su grupo
    const drivers = await driverService.getAllDrivers();
    console.log(`Filtrando conductores por grupo: ${req.user.partnerGroup}`);
    
    // Filtrar por partnerGroup, considerando tanto el campo en driver como en userId
    const filteredDrivers = drivers.filter(driver => {
      // Verificar el partnerGroup del conductor directamente
      const driverGroup = driver.partnerGroup;
      
      // Verificar el partnerGroup del usuario asociado
      const userGroup = driver.userId && typeof driver.userId === 'object' ? 
        driver.userId.partnerGroup : null;
      
      // Verificar si alguno coincide con el grupo del admin
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
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si no es admin principal, verificar que el conductor pertenezca a su grupo
    if (!req.user.isMainAdmin) {
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
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Si no es admin principal, verificar que el conductor pertenezca a su grupo
    if (!req.user.isMainAdmin) {
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
    let filter = {};
    
    // Si es superadmin, puede ver todas las notificaciones (no aplicamos filtro)
    if (req.user.isMainAdmin) {
      console.log('Usuario es superadmin, mostrando todas las notificaciones');
    } 
    // Si es admin normal, solo ve notificaciones de su grupo
    else if (req.user.role === 'admin') {
      filter = { partnerGroup: req.user.partnerGroup };
      console.log(`Usuario es ${req.user.role}, filtrando por grupo: ${req.user.partnerGroup}`);
    } 
    // Si es conductor, solo ve sus propias notificaciones
    else {
      filter = { userId: req.user.id };
      console.log(`Usuario es conductor, filtrando por userId: ${req.user.id}`);
    }
    
    console.log('Filtro de notificaciones aplicado:', filter);
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'username role partnerGroup')
      .populate('vehicleId', 'LOT brand model');
    
    console.log(`Se encontraron ${notifications.length} notificaciones`);
    res.json(notifications);
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ruta para ver todas las notificaciones (solo para superadmin)
app.get('/api/notifications/all', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Buscar todas las notificaciones, sin filtrar por userId
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username role partnerGroup')  // Añadir información del usuario
      .populate('vehicleId', 'LOT brand model');         // Añadir información del vehículo

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/notifications', auth, async (req, res) => {
  try {
    const notification = new Notification({
      userId: req.user.id,
      partnerGroup: req.user.partnerGroup || 'main', // Aseguramos que se guarde el grupo
      ...req.body
    });
    
    console.log(`Creando notificación para usuario ${req.user.username} del grupo ${req.user.partnerGroup}`);
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creando notificación:', error);
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
    // Si es admin y se especifica "all", elimina todas las notificaciones
    if (req.user.role === 'admin' && req.query.all === 'true') {
      await Notification.deleteMany({});
      return res.json({ message: 'Todas las notificaciones del sistema eliminadas' });
    }
    
    // De lo contrario, solo elimina las del usuario
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'Todas las notificaciones eliminadas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    // Construir la consulta según el rol
    const query = { _id: req.params.id };
    
    // Si no es admin, solo puede eliminar sus propias notificaciones
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    
    const notification = await Notification.findOne(query);
    
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