const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const authService = require('./authService');
const User = require('../models/User');

const clientService = {
  async createClient(clientData) {
    try {
      const client = new Client(clientData);
      return await client.save();
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  },

  async getAllClients() {
    try {
      return await Client.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }
};

const driverService = {
  async createDriver(driverData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generar username y password si no se proporcionan
      const username = driverData.username || driverData.phone;
      const password = driverData.password || '1234';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el usuario
      const user = new User({
        username,
        password: hashedPassword,
        role: 'driver',
        isActive: true,
        state: driverData.state
      });
      await user.save({ session });

      // Crear el conductor
      const driver = new Driver({
        name: driverData.name,
        phone: driverData.phone,
        license: driverData.license,
        username: username,
        isActive: true,
        userId: user._id,
        state: driverData.state
      });
      await driver.save({ session });

      await session.commitTransaction();
      return {
        ...driver.toObject(),
        tempPassword: password // Solo para mostrar una vez
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Error al crear driver: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  async getAllDrivers() {
    try {
      return await Driver.find()
        .populate('userId', '-password')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener drivers: ${error.message}`);
    }
  },

  async updateDriverCredentials(driverId, { username, password }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      const user = await User.findById(driver.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (username && username !== driver.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        user.username = username;
        driver.username = username;
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }

      await Promise.all([
        user.save({ session }),
        driver.save({ session })
      ]);

      await session.commitTransaction();
      return driver;
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Error al actualizar credenciales: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  async toggleDriverStatus(driverId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      const user = await User.findById(driver.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      driver.isActive = !driver.isActive;
      user.isActive = driver.isActive;

      await Promise.all([
        user.save({ session }),
        driver.save({ session })
      ]);

      await session.commitTransaction();
      return driver;
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Error al cambiar estado: ${error.message}`);
    } finally {
      session.endSession();
    }
  }
};

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
      ).populate('clientId').populate('driverId');
    } catch (error) {
      throw new Error(`Error al actualizar estado del vehículo: ${error.message}`);
    }
  },

  async updateVehiculoComentarios(vehicleId, comentarios) {
    try {
      return await Vehicle.findByIdAndUpdate(
        vehicleId,
        { comments: comentarios },
        { new: true, runValidators: true }
      ).populate('clientId').populate('driverId');
    } catch (error) {
      throw new Error(`Error al actualizar comentarios del vehículo: ${error.message}`);
    }
  },

  async assignDriver(vehicleId, driverId) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { driverId: driverId || null },
        { new: true }
      ).populate('clientId').populate('driverId');
      
      if (!vehicle) {
        throw new Error('Vehículo no encontrado');
      }
      
      return vehicle;
    } catch (error) {
      throw new Error(`Error al asignar driver: ${error.message}`);
    }
  }
};

module.exports = {
  clientService,
  driverService,
  vehicleService,
  authService
};