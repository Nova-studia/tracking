const Driver = require('../models/Driver');

const driverService = {
  async createDriver(driverData) {
    try {
      const driver = new Driver(driverData);
      return await driver.save();
    } catch (error) {
      throw new Error(`Error al crear driver: ${error.message}`);
    }
  },

  async getAllDrivers() {
    try {
      return await Driver.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener drivers: ${error.message}`);
    }
  }
};