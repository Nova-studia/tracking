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
const State = require('./models/State');
const { uploadMiddleware, cloudinary } = require('./config/cloudinary');
const Notification = require('./models/Notification');

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
      if (driver) {
        req.user.driverId = driver._id;
      }
    }

    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware de roles
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }
    next();
  };
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
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
    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
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

app.patch('/api/drivers/:id/credentials', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const updatedDriver = await driverService.updateDriverCredentials(req.params.id, req.body);
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/drivers/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const updatedDriver = await driverService.toggleDriverStatus(req.params.id);
    res.json(updatedDriver);
  } catch (error) {
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
    let vehicles = await vehicleService.getAllVehicles();
    
    if (req.user.role === 'driver') {
      vehicles = vehicles.filter(v => 
        v.driverId && 
        (v.driverId._id.toString() === req.user.driverId.toString() || 
         v.driverId.toString() === req.user.driverId.toString())
      );
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

    if (req.user.role === 'driver' && 
        (!req.user.driverId || 
         vehicle.driverId._id.toString() !== req.user.driverId.toString())) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Actualizar el estado y agregar el comentario al historial
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { status: req.body.status },
        $push: { 
          travelComments: {
            comment: req.body.comment,
            status: req.body.status,
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).populate(['clientId', 'driverId']);

    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/vehicles/:id/driver', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const updatedVehicle = await vehicleService.assignDriver(req.params.id, req.body.driverId);
    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para subir fotos usando Cloudinary
app.post('/api/vehicles/:id/photos', 
  authMiddleware,
  uploadMiddleware,
  async (req, res) => {
    try {
      // Log para debug
      console.log('Iniciando subida de fotos');
      console.log('Files recibidos:', req.files);
      console.log('Headers:', req.headers);

      const vehicle = await Vehicle.findById(req.params.id).populate('driverId');
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehículo no encontrado' });
      }

      // Verificación de permisos
      if (req.user.role === 'driver') {
        const vehicleDriverId = vehicle.driverId?._id || vehicle.driverId;
        const userDriverId = req.user.driverId;
        
        if (!userDriverId || vehicleDriverId.toString() !== userDriverId.toString()) {
          return res.status(403).json({ message: 'No autorizado para modificar este vehículo' });
        }
      }

      // Validar archivos recibidos
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No se recibieron archivos' });
      }

      const photos = {};
      
      for (const [key, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray[0]) {
          const file = fileArray[0];
          
          try {
            // Verificar el tipo de archivo
            if (!file.mimetype.startsWith('image/')) {
              throw new Error(`Archivo ${key} no es una imagen válida`);
            }

            // Verificar tamaño (ejemplo: máximo 5MB)
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_SIZE) {
              throw new Error(`Archivo ${key} excede el tamaño máximo permitido`);
            }

            // Convertir a base64 con manejo de errores
            const b64 = Buffer.from(file.buffer).toString('base64');
            if (!b64) {
              throw new Error(`Error al convertir archivo ${key} a base64`);
            }

            const dataURI = `data:${file.mimetype};base64,${b64}`;
            
            // Subir a Cloudinary con retry
            let retries = 3;
            let uploadResult;
            
            while (retries > 0) {
              try {
                uploadResult = await cloudinary.uploader.upload(dataURI, {
                  folder: `vehicles/${req.params.id}`,
                  public_id: `${key}-${Date.now()}`,
                  transformation: [
                    { width: 1000, height: 1000, crop: 'limit' },
                    { quality: 'auto' },
                    { format: 'webp' }
                  ],
                  timeout: 60000 // 60 segundos timeout
                });
                break; // Si la subida fue exitosa, salir del ciclo
              } catch (err) {
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de reintentar
              }
            }

            photos[key] = {
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              uploadedAt: new Date()
            };

          } catch (uploadError) {
            console.error(`Error procesando archivo ${key}:`, uploadError);
            return res.status(400).json({ 
              message: `Error al procesar archivo ${key}: ${uploadError.message}`,
              field: key
            });
          }
        }
      }

      // Actualizar el vehículo con las nuevas fotos
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        { loadingPhotos: photos },
        { new: true }
      ).populate(['clientId', 'driverId']);

      if (!updatedVehicle) {
        throw new Error('Error al actualizar el vehículo con las fotos');
      }

      res.json(updatedVehicle);
      
    } catch (error) {
      console.error('Error detallado en la ruta de subida:', error);
      res.status(500).json({ 
        message: 'Error al subir las fotos',
        detail: error.message
      });
    }
});

app.patch('/api/vehicles/:id/client', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ message: 'Se requiere el ID del cliente' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { clientId, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate(['clientId', 'driverId']);

    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para eliminar vehículo
app.delete('/api/vehicles/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Primero verificamos si el vehículo existe
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Si el vehículo tiene fotos en Cloudinary, las eliminamos
    if (vehicle.loadingPhotos) {
      for (const photo of Object.values(vehicle.loadingPhotos)) {
        if (photo.publicId) {
          await cloudinary.uploader.destroy(photo.publicId);
        }
      }
    }

    // Eliminamos el vehículo
    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ message: error.message });
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

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rutas de notificaciones
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/notifications', authMiddleware, async (req, res) => {
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

app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
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

app.delete('/api/notifications', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'Todas las notificaciones eliminadas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});