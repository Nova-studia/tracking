const express = require('express');
const router = express.Router();
const vehicleService = require('../services/vehicleService');
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const { uploadMiddleware } = require('../config/cloudinary');

// Middleware para extraer información del usuario del token
// En vehicles.js, verifica que el middleware extractUserInfo sea así:
const extractUserInfo = (req, res, next) => {
  // El middleware auth ya debe haber puesto la información del usuario en req.user
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  console.log('Información del usuario:', req.user); // Para debugging
  
  // Extraemos los datos que necesitamos
  const partnerGroup = req.user.partnerGroup || 'main';
  const isMainAdmin = req.user.isMainAdmin || false;
  
  // Añadimos estos datos al objeto request para usarlos en los controladores
  req.partnerInfo = {
    partnerGroup,
    isMainAdmin
  };
  
  console.log('Partner info:', req.partnerInfo); // Para debugging
  
  next();
};

// Obtener todos los vehículos (filtrados por grupo del socio)
router.get('/', auth, extractUserInfo, async (req, res) => {
  try {
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    
    // Para conductores, filtramos por los vehículos asignados a ellos
    if (req.user.role === 'driver') {
      console.log(`Filtrando vehículos para el conductor: ${req.user.username}, ID: ${req.user.id}`);
      
      // Obtener todos los vehículos
      let vehicles = await vehicleService.getAllVehicles(null, true);
      
      // Verificar si el ID del conductor está en el token de usuario
      if (!req.user.driverId) {
        // Si no está, intentar buscarlo en la base de datos
        const Driver = require('../models/Driver');
        const driver = await Driver.findOne({ userId: req.user.id });
        
        if (driver) {
          req.user.driverId = driver._id;
          console.log(`Encontrado ID del conductor: ${driver._id}`);
        } else {
          console.log('No se pudo encontrar el ID del conductor');
          return res.json([]); // No hay vehículos asignados
        }
      }
      
      // Filtrar vehículos asignados a este conductor
      vehicles = vehicles.filter(v => {
        if (!v.driverId) return false;
        
        const driverIdString = typeof v.driverId === 'object' 
          ? v.driverId._id?.toString() 
          : v.driverId?.toString();
          
        const userDriverIdString = req.user.driverId?.toString();
        
        const isAssigned = driverIdString === userDriverIdString;
        
        if (isAssigned) {
          console.log(`Vehículo asignado encontrado: ${v.brand} ${v.model}, LOT: ${v.LOT}`);
        }
        
        return isAssigned;
      });
      
      console.log(`Total de vehículos asignados a este conductor: ${vehicles.length}`);
      return res.json(vehicles);
    }
    
    // Si es admin principal, obtener todos los vehículos
    if (isMainAdmin) {
      const vehicles = await vehicleService.getAllVehicles(null, true);
      return res.json(vehicles);
    }
    
    // Para socios y admins regulares, filtrar por grupo
    const vehicles = await vehicleService.getAllVehicles(partnerGroup, false);
    res.json(vehicles);
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(400).json({ message: error.message });
  }
});

// Obtener un vehículo específico
router.get('/:vehicleId', auth, extractUserInfo, async (req, res) => {
  try {
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    const vehicle = await vehicleService.getVehicle(
      req.params.vehicleId, 
      partnerGroup, 
      isMainAdmin
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Crear nuevo vehículo (asignado al grupo del usuario)
router.post('/', auth, extractUserInfo, async (req, res) => {
  try {
    // Solo admin y socios pueden crear vehículos
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { partnerGroup } = req.partnerInfo;
    const vehicle = await vehicleService.createVehicle(req.body, partnerGroup);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar estado del vehículo
router.patch('/:vehicleId/status', auth, extractUserInfo, async (req, res) => {
  try {
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    
    // Para conductores, verificamos que el vehículo esté asignado a ellos
    if (req.user.role === 'driver') {
      const vehicle = await Vehicle.findById(req.params.vehicleId).populate('driverId');
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehículo no encontrado' });
      }

      if (!req.user.driverId || 
          vehicle.driverId._id.toString() !== req.user.driverId.toString()) {
        return res.status(403).json({ message: 'No autorizado' });
      }
    }
    
    const vehicle = await vehicleService.updateVehicleStatusWithComment(
      req.params.vehicleId, 
      req.body.status,
      req.body.comment || `Estado actualizado a ${req.body.status}`,
      partnerGroup,
      isMainAdmin
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Asignar conductor
router.patch('/:vehicleId/driver', auth, extractUserInfo, async (req, res) => {
  try {
    // Solo admin y socios pueden asignar conductores
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    const vehicle = await vehicleService.assignDriver(
      req.params.vehicleId, 
      req.body.driverId,
      partnerGroup,
      isMainAdmin
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar cliente
router.patch('/:vehicleId/client', auth, extractUserInfo, async (req, res) => {
  try {
    // Solo admin y socios pueden actualizar clientes
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    const vehicle = await vehicleService.updateVehicleClient(
      req.params.vehicleId, 
      req.body.clientId,
      partnerGroup,
      isMainAdmin
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar vehículo
router.delete('/:vehicleId', auth, extractUserInfo, async (req, res) => {
  try {
    // Solo admin y socios pueden eliminar vehículos
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { partnerGroup, isMainAdmin } = req.partnerInfo;
    const result = await vehicleService.deleteVehicle(
      req.params.vehicleId,
      partnerGroup,
      isMainAdmin
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para subir fotos
router.post('/:vehicleId/photos', 
  auth, 
  extractUserInfo,
  uploadMiddleware,
  async (req, res) => {
    try {
      const { partnerGroup, isMainAdmin } = req.partnerInfo;
      
      // Para conductores, verificamos que el vehículo esté asignado a ellos
      if (req.user.role === 'driver') {
        const vehicle = await Vehicle.findById(req.params.vehicleId).populate('driverId');
        if (!vehicle) {
          return res.status(404).json({ message: 'Vehículo no encontrado' });
        }

        if (!req.user.driverId || 
            vehicle.driverId._id.toString() !== req.user.driverId.toString()) {
          return res.status(403).json({ message: 'No autorizado' });
        }
      }
      
      const vehicle = await vehicleService.uploadVehiclePhotos(
        req.params.vehicleId, 
        req.files,
        partnerGroup,
        isMainAdmin
      );
      res.json(vehicle);
    } catch (error) {
      console.error('Error in upload route:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;