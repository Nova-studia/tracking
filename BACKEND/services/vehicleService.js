const Vehicle = require('../models/Vehicle');
const { cloudinary } = require('../config/cloudinary');

const vehicleService = {
  async createVehicle(vehicleData, partnerGroup = 'main') {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      
      const vehicle = new Vehicle({
        ...vehicleData,
        lotLocation: vehicleData.lotLocation ? vehicleData.lotLocation.toUpperCase() : 
                    `${vehicleData.city}, ${vehicleData.state}`.toUpperCase(),
        PIN: vehicleData.PIN,
        auctionHouse: vehicleData.auctionHouse,
        partnerGroup // Asignamos el grupo del socio/admin
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

  // En vehicleService.js, línea aproximada 64
  // En vehicleService.js, reemplaza el método getAllVehicles
async getAllVehicles(partnerGroup = null, isMainAdmin = false) {
  try {
    // Filtro base
    const filter = {};
    
    // Si no es admin principal y se especifica un grupo, filtramos por grupo
    if (!isMainAdmin && partnerGroup) {
      filter.partnerGroup = partnerGroup;
    }
    
    console.log('Filtro aplicado a vehículos:', filter); // Para debugging
    
    const vehicles = await Vehicle.find(filter)
      .populate('clientId')
      .populate('driverId')
      .lean()
      .sort({ createdAt: -1 });

    console.log(`Se encontraron ${vehicles.length} vehículos`); // Para debugging
    
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

  async getVehicle(vehicleId, partnerGroup = null, isMainAdmin = false) {
    try {
      // Construir la consulta base
      const query = { _id: vehicleId };
      
      // Si no es admin principal, filtramos por grupo
      if (!isMainAdmin && partnerGroup) {
        query.partnerGroup = partnerGroup;
      }
      
      const vehicle = await Vehicle.findOne(query)
        .populate('clientId')
        .populate('driverId');
        
      if (!vehicle) {
        throw new Error('Vehículo no encontrado o no tiene permisos para acceder a él');
      }
      
      return vehicle;
    } catch (error) {
      console.error('Error getting vehicle:', error);
      throw new Error(`Error al obtener vehículo: ${error.message}`);
    }
  },

  async updateVehicleStatus(vehicleId, newStatus, partnerGroup = null, isMainAdmin = false) {
    try {
      console.log('Updating vehicle status:', { vehicleId, newStatus });
      
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(newStatus)) {
        throw new Error(`Estado inválido: ${newStatus}`);
      }

      // Primero verificamos si el usuario tiene acceso al vehículo
      const vehicleToUpdate = await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);
      
      if (newStatus === 'loading') {
        if (!vehicleToUpdate.loadingPhotos || 
            !vehicleToUpdate.loadingPhotos.frontPhoto || 
            !vehicleToUpdate.loadingPhotos.backPhoto || 
            !vehicleToUpdate.loadingPhotos.leftPhoto || 
            !vehicleToUpdate.loadingPhotos.rightPhoto) {
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

  async updateVehicleStatusWithComment(vehicleId, status, comment, partnerGroup = null, isMainAdmin = false) {
    try {
      console.log('Updating vehicle status with comment:', { vehicleId, status, comment });
      
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(status)) {
        throw new Error(`Estado inválido: ${status}`);
      }

      // Verificamos acceso al vehículo
      const vehicleToUpdate = await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);

      if (status === 'loading') {
        if (!vehicleToUpdate.loadingPhotos || 
            !vehicleToUpdate.loadingPhotos.frontPhoto || 
            !vehicleToUpdate.loadingPhotos.backPhoto || 
            !vehicleToUpdate.loadingPhotos.leftPhoto || 
            !vehicleToUpdate.loadingPhotos.rightPhoto) {
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

  async uploadVehiclePhotos(vehicleId, files, partnerGroup = null, isMainAdmin = false) {
    try {
      // Verificamos acceso al vehículo
      await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);
      
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

  async updateVehicleClient(vehicleId, clientId, partnerGroup = null, isMainAdmin = false) {
    try {
      // Verificamos acceso al vehículo
      await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);
      
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
  
  async assignDriver(vehicleId, driverId, partnerGroup = null, isMainAdmin = false) {
    try {
      // Verificamos acceso al vehículo
      await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);
      
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
  
  async deleteVehicle(vehicleId, partnerGroup = null, isMainAdmin = false) {
    try {
      // Verificamos acceso al vehículo
      await this.getVehicle(vehicleId, partnerGroup, isMainAdmin);
      
      // Eliminamos el vehículo
      const deletedVehicle = await Vehicle.findByIdAndDelete(vehicleId);
      
      if (!deletedVehicle) {
        throw new Error('Vehículo no encontrado');
      }
      
      // Si tenía fotos, las eliminamos de Cloudinary
      if (deletedVehicle.loadingPhotos) {
        await this.deleteOldPhotos(deletedVehicle.loadingPhotos);
      }
      
      return { success: true, message: 'Vehículo eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error(`Error al eliminar vehículo: ${error.message}`);
    }
  }
};

module.exports = vehicleService;