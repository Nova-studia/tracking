// vehicleService.js
const Vehicle = require('../models/Vehicle');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para el almacenamiento de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/vehicles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const vehicleService = {
  // Middleware de multer para la subida de fotos
  uploadMiddleware: upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'backPhoto', maxCount: 1 },
    { name: 'leftPhoto', maxCount: 1 },
    { name: 'rightPhoto', maxCount: 1 }
  ]),

  async createVehicle(vehicleData) {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      
      // Asegurarnos de que los campos PIN y auctionHouse están incluidos
      const vehicle = new Vehicle({
        ...vehicleData,
        lotLocation: vehicleData.lotLocation ? vehicleData.lotLocation.toUpperCase() : 
                    `${vehicleData.city}, ${vehicleData.state}`.toUpperCase(),
        PIN: vehicleData.PIN,
        auctionHouse: vehicleData.auctionHouse
      });
      
      // Validaciones explícitas
      if (!vehicle.auctionHouse) {
        throw new Error('La casa de subasta es requerida');
      }
  
      await vehicle.save();
      const populated = await vehicle.populate(['clientId', 'driverId']);
      console.log('Created vehicle:', populated);
      return populated;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }
  },

  async getAllVehicles() {
    try {
      const vehicles = await Vehicle.find()
        .populate('clientId')
        .populate('driverId')
        .lean()
        .sort({ createdAt: -1 });

      return vehicles.map(vehicle => {
        if (vehicle.lotLocation) {
          const [city, state] = vehicle.lotLocation.split(',').map(s => s.trim());
          return {
            ...vehicle,
            city,
            state
          };
        }
        return vehicle;
      });
    } catch (error) {
      console.error('Error getting vehicles:', error);
      throw new Error(`Error al obtener vehículos: ${error.message}`);
    }
  },

  async updateVehicleStatus(vehicleId, newStatus) {
    try {
      console.log('Updating vehicle status:', { vehicleId, newStatus });
      
      // Validar el estado
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(newStatus)) {
        throw new Error(`Estado inválido: ${newStatus}`);
      }

      // Si se está cambiando a 'loading', verificar que tenga fotos
      if (newStatus === 'loading') {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle.loadingPhotos || 
            !vehicle.loadingPhotos.frontPhoto || 
            !vehicle.loadingPhotos.backPhoto || 
            !vehicle.loadingPhotos.leftPhoto || 
            !vehicle.loadingPhotos.rightPhoto) {
          throw new Error('Se requieren todas las fotos antes de cambiar el estado a loading');
        }
      }

      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { 
          status: newStatus,
          updatedAt: new Date()
        },
        { 
          new: true, 
          runValidators: true 
        }
      ).populate(['clientId', 'driverId']);

      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }

      console.log('Vehicle status updated:', vehicle);
      return vehicle;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  },

  async updateVehicleStatusWithComment(vehicleId, status, comment) {
    try {
      console.log('Updating vehicle status with comment:', { vehicleId, status, comment });
      
      // Validar el estado
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(status)) {
        throw new Error(`Estado inválido: ${status}`);
      }

      // Si se está cambiando a 'loading', verificar que tenga fotos
      if (status === 'loading') {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle.loadingPhotos || 
            !vehicle.loadingPhotos.frontPhoto || 
            !vehicle.loadingPhotos.backPhoto || 
            !vehicle.loadingPhotos.leftPhoto || 
            !vehicle.loadingPhotos.rightPhoto) {
          throw new Error('Se requieren todas las fotos antes de cambiar el estado a loading');
        }
      }

      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { 
          status,
          $push: { 
            travelComments: {
              comment,
              status,
              createdAt: new Date()
            }
          },
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true 
        }
      ).populate(['clientId', 'driverId']);

      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }

      console.log('Vehicle updated with comment:', vehicle);
      return vehicle;
    } catch (error) {
      console.error('Error updating vehicle with comment:', error);
      throw new Error(`Error al actualizar vehículo: ${error.message}`);
    }
  },

  async updateVehicleClient(vehicleId, clientId) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { 
          clientId: clientId,
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true 
        }
      ).populate(['clientId', 'driverId']);
      
      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }
      
      return vehicle;
    } catch (error) {
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  },
  
  async assignDriver(vehicleId, driverId) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { 
          driverId: driverId || null,
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true 
        }
      ).populate(['clientId', 'driverId']);
      
      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }
      
      return vehicle;
    } catch (error) {
      throw new Error(`Error al asignar conductor: ${error.message}`);
    }
  },

  async uploadVehiclePhotos(vehicleId, files) {
    try {
      console.log('Uploading photos for vehicle:', vehicleId);
      const photos = {};

      // Procesar cada foto subida
      if (files) {
        Object.keys(files).forEach(key => {
          photos[key] = {
            url: `/uploads/vehicles/${files[key][0].filename}`,
            uploadedAt: new Date()
          };
        });
      }

      // Actualizar el vehículo con las URLs de las fotos
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { 
          loadingPhotos: photos,
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true 
        }
      ).populate(['clientId', 'driverId']);

      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }

      console.log('Photos uploaded successfully');
      return vehicle;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw new Error(`Error al subir fotos: ${error.message}`);
    }
  }
};

module.exports = vehicleService;