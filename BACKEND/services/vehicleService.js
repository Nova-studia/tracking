const Vehicle = require('../models/Vehicle');

const vehicleService = {
  async createVehicle(vehicleData) {
    try {
      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();
      return vehicle.populate(['clientId', 'driverId']);
    } catch (error) {
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }
  },

  async getAllVehicles() {
    try {
      return await Vehicle.find()
        .populate('clientId')
        .populate('driverId')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener vehículos: ${error.message}`);
    }
  },

  async updateVehicleStatus(vehicleId, status) {
    try {
      return await Vehicle.findByIdAndUpdate(
        vehicleId,
        { status },
        { new: true }
      ).populate(['clientId', 'driverId']);
    } catch (error) {
      throw new Error(`Error al actualizar estado del vehículo: ${error.message}`);
    }
  },

  async assignDriver(vehicleId, driverId) {
    try {
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { driverId: driverId || null },
        { new: true }
      ).populate(['clientId', 'driverId']);

      if (!updatedVehicle) {
        throw new Error('Vehículo no encontrado');
      }

      return updatedVehicle;
    } catch (error) {
      throw new Error(`Error al asignar conductor: ${error.message}`);
    }
  }
};

module.exports = vehicleService;