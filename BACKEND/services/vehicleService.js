const Vehicle = require('../models/Vehicle');
const { cloudinary } = require('../config/cloudinary');

const vehicleService = {
  async createVehicle(vehicleData) {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      
      const vehicle = new Vehicle({
        ...vehicleData,
        lotLocation: vehicleData.lotLocation ? vehicleData.lotLocation.toUpperCase() : 
                    `${vehicleData.city}, ${vehicleData.state}`.toUpperCase(),
        PIN: vehicleData.PIN,
        auctionHouse: vehicleData.auctionHouse
      });
      
      if (!vehicle.auctionHouse) {
        throw new Error('La Subasta es requerida');
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
      
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(newStatus)) {
        throw new Error(`Estado inválido: ${newStatus}`);
      }

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

      return vehicle;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  },

  async updateVehicleStatusWithComment(vehicleId, status, comment) {
    try {
      console.log('Updating vehicle status with comment:', { vehicleId, status, comment });
      
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(status)) {
        throw new Error(`Estado inválido: ${status}`);
      }

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

      return vehicle;
    } catch (error) {
      console.error('Error updating vehicle with comment:', error);
      throw new Error(`Error al actualizar vehículo: ${error.message}`);
    }
  },

  async uploadVehiclePhotos(vehicleId, files) {
    try {
      const photos = {};
  
      if (files) {
        for (const [key, fileArray] of Object.entries(files)) {
          const file = fileArray[0];
          
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `vehicles/${vehicleId}`,
            public_id: `${key}-${Date.now()}`,
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' },
              { quality: 'auto' },
              { format: 'webp' }
            ]
          });
  
          photos[key] = {
            url: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
          };
        }
      }
  
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { loadingPhotos: photos },
        { new: true }
      ).populate(['clientId', 'driverId']);
  
      return vehicle;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw new Error(`Error al subir fotos: ${error.message}`);
    }
  },

  async deleteOldPhotos(oldPhotos) {
    try {
      if (!oldPhotos) return;

      const deletePromises = Object.values(oldPhotos)
        .filter(photo => photo && photo.publicId)
        .map(photo => cloudinary.uploader.destroy(photo.publicId));

      await Promise.all(deletePromises);
      console.log('Old photos deleted successfully from Cloudinary');
    } catch (error) {
      console.error('Error deleting old photos from Cloudinary:', error);
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
  }
};

module.exports = vehicleService;