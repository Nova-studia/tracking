const Vehicle = require('../models/Vehicle');

const vehicleService = {
  async createVehicle(vehicleData) {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      const vehicle = new Vehicle({
        ...vehicleData,
        lotLocation: `${vehicleData.city}, ${vehicleData.state}`.toUpperCase()
      });
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
      // Validar el estado antes de la actualización
      const validStates = ['pending', 'assigned', 'loading', 'in-transit', 'delivered'];
      if (!validStates.includes(newStatus)) {
        throw new Error(`Estado inválido: ${newStatus}`);
      }

      // Realizar la actualización
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