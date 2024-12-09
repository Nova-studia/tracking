const Vehicle = require('../models/Vehicle');

const vehicleService = {
  async createVehicle(vehicleData) {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      // Construir el lotLocation a partir de city y state
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

      // Separar lotLocation en city y state
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

  async updateVehicleStatus(vehicleId, status) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { status },
        { new: true }
      ).populate(['clientId', 'driverId']);
      
      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }
      
      return vehicle;
    } catch (error) {
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  },

  async assignDriver(vehicleId, driverId) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { driverId: driverId || null },
        { new: true }
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