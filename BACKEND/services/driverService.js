const Driver = require('../models/Driver');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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
        isActive: true
      });
      await user.save({ session });

      // Crear el conductor
      const driver = new Driver({
        name: driverData.name,
        phone: driverData.phone,
        license: driverData.license,
        username: username,
        isActive: true,
        userId: user._id // Vinculamos el usuario
      });
      await driver.save({ session });

      await session.commitTransaction();
      return {
        ...driver.toObject(),
        tempPassword: password // Solo para mostrar una vez
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Error al crear conductor: ${error.message}`);
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
      throw new Error(`Error al obtener conductores: ${error.message}`);
    }
  },

  async updateDriverCredentials(driverId, { username, password }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const driver = await Driver.findById(driverId).populate('userId');
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      const user = await User.findById(driver.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (username && username !== driver.username) {
        // Verificar que el nuevo username no exista
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
      const driver = await Driver.findById(driverId).populate('userId');
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

module.exports = driverService;