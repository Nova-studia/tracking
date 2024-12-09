const Driver = require('../models/Driver');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const driverService = {
  async createDriver(driverData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generar username y password por defecto si no se proporcionan
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
        isActive: true
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
      const drivers = await Driver.find().sort({ createdAt: -1 });
      const users = await User.find({ role: 'driver' }, 'username isActive');
      
      // Combinar información de drivers con estado de usuario
      return drivers.map(driver => {
        const userInfo = users.find(u => u.username === driver.username);
        return {
          ...driver.toObject(),
          isActive: userInfo ? userInfo.isActive : false
        };
      });
    } catch (error) {
      throw new Error(`Error al obtener conductores: ${error.message}`);
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

      // Actualizar usuario existente
      const user = await User.findOne({ username: driver.username });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Si se proporciona nuevo username
      if (username && username !== driver.username) {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        user.username = username;
        driver.username = username;
      }

      // Si se proporciona nueva contraseña
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

      const user = await User.findOne({ username: driver.username });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      user.isActive = !user.isActive;
      driver.isActive = user.isActive;

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