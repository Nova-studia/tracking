const Vehicle = require('../models/Vehicle');

const vehicleService = {
  async createVehicle(vehicleData) {
    try {
      const vehicle = new Vehicle(vehicleData);
      return await vehicle.save();
    } catch (error) {
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }
  },

  async getAllVehicles() {
    try {
      return await Vehicle.find()
        .populate('clientId', 'name')
        .populate('driverId', 'name')
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
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Error al actualizar estado del vehículo: ${error.message}`);
    }
  },

  async assignDriver(vehicleId, driverId) {
    try {
      return await Vehicle.findByIdAndUpdate(
        vehicleId,
        { driverId },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Error al asignar driver: ${error.message}`);
    }
  }
};

module.exports = {
  clientService,
  driverService,
  vehicleService
};