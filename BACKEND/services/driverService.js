const Driver = require('../models/Driver');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const driverService = {
  async validateDriverData(driverData, isNew = true) {
    const errors = [];
    
    // Validaciones básicas
    if (!driverData.name || !driverData.name.trim()) {
      errors.push('El nombre es requerido');
    }
    
    if (!driverData.phone || !driverData.phone.trim()) {
      errors.push('El teléfono es requerido');
    }
    
    // Si es un nuevo driver o se está actualizando el username
    if (isNew || driverData.username) {
      const username = driverData.username || driverData.phone;
      // Verificar si el username ya existe
      const existingUser = await User.findOne({ username });
      if (existingUser && (isNew || existingUser._id.toString() !== driverData.userId)) {
        errors.push('El nombre de usuario ya está en uso');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  },

  async createDriver(driverData) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // Validar datos antes de crear
      await this.validateDriverData(driverData);
  
      // Preparar datos de usuario
      const username = driverData.username || driverData.phone;
      const password = driverData.password || '1234';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Asegurar que el partnerGroup sea válido y nunca sea undefined o null
      const partnerGroup = driverData.partnerGroup && driverData.partnerGroup.trim() !== '' 
                           ? driverData.partnerGroup 
                           : 'main';
      
      console.log('📝 Creando usuario para driver:', { 
        username, 
        partnerGroup: partnerGroup, // Usar la variable que ya verificamos
        originalPartnerGroup: driverData.partnerGroup // Mostrar lo que venía en la solicitud para depuración
      });
  
      // Crear usuario
      const user = new User({
        username,
        password: hashedPassword,
        role: 'driver',
        state: driverData.state || '',
        isActive: true,
        partnerGroup: partnerGroup // Usar la variable verificada
      });
      await user.save({ session });
  
      console.log('✅ Usuario creado:', user._id, 'con grupo:', user.partnerGroup);
  
      // Crear driver
      const driver = new Driver({
        name: driverData.name.trim(),
        phone: driverData.phone.trim(),
        license: driverData.license ? driverData.license.trim() : undefined,
        username: username,
        state: driverData.state || '',
        isActive: true,
        userId: user._id,
        partnerGroup: partnerGroup // Usar la misma variable verificada
      });
      await driver.save({ session });
  
      console.log('✅ Driver creado:', driver._id, 'con grupo:', driver.partnerGroup);
  
      await session.commitTransaction();
      
      // Retornar datos necesarios
      return {
        ...driver.toObject(),
        username,
        tempPassword: password, // Solo se envía en la creación inicial
        partnerGroup: driver.partnerGroup // Asegurar que se incluya en la respuesta
      };
    } catch (error) {
      console.error('❌ Error en createDriver:', error);
      await session.abortTransaction();
      throw new Error(`Error al crear conductor: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  async getAllDrivers() {
    try {
      // Incluir toda la información de usuario y asegurarnos de tener el partnerGroup
      const drivers = await Driver.find()
        .populate({
          path: 'userId',
          select: '-password'
        })
        .sort({ createdAt: -1 });
  
      console.log(`📋 Obtenidos ${drivers.length} conductores en total`);
      
      // Log para depuración
      drivers.forEach(driver => {
        const userPartnerGroup = driver.userId && driver.userId.partnerGroup ? 
          driver.userId.partnerGroup : 'no definido';
        const driverPartnerGroup = driver.partnerGroup || 'no definido';
        
        console.log(`Driver: ${driver.name}, Grupo: ${driverPartnerGroup}, Usuario Grupo: ${userPartnerGroup}`);
      });
      
      return drivers;
    } catch (error) {
      console.error('❌ Error en getAllDrivers:', error);
      throw new Error(`Error al obtener conductores: ${error.message}`);
    }
  },

  async getDriverById(driverId) {
    try {
      const driver = await Driver.findById(driverId)
        .populate('userId', '-password');
      
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      return driver;
    } catch (error) {
      console.error('❌ Error en getDriverById:', error);
      throw new Error(`Error al obtener conductor: ${error.message}`);
    }
  },

  async updateDriverCredentials(driverId, { username, password }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Buscar driver y usuario
      const driver = await Driver.findById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      const user = await User.findById(driver.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar username si se proporciona
      if (username && username !== driver.username) {
        // Validar que el nuevo username no exista
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        
        user.username = username;
        driver.username = username;
        console.log('🔄 Actualizando username para:', driver._id);
      }

      // Actualizar password si se proporciona
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        console.log('🔄 Actualizando password para:', driver._id);
      }

      // Guardar cambios
      await Promise.all([
        user.save({ session }),
        driver.save({ session })
      ]);

      await session.commitTransaction();
      console.log('✅ Credenciales actualizadas para:', driver._id);

      return await Driver.findById(driverId).populate('userId', '-password');
    } catch (error) {
      console.error('❌ Error en updateDriverCredentials:', error);
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

      // Cambiar estado
      driver.isActive = !driver.isActive;
      user.isActive = driver.isActive;

      console.log('🔄 Cambiando estado para:', {
        driverId,
        newStatus: driver.isActive
      });

      // Guardar cambios
      await Promise.all([
        user.save({ session }),
        driver.save({ session })
      ]);

      await session.commitTransaction();
      console.log('✅ Estado actualizado para:', driver._id);

      return await Driver.findById(driverId).populate('userId', '-password');
    } catch (error) {
      console.error('❌ Error en toggleDriverStatus:', error);
      await session.abortTransaction();
      throw new Error(`Error al cambiar estado: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  async deleteDriver(driverId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }

      // Eliminar usuario asociado
      await User.findByIdAndDelete(driver.userId, { session });
      
      // Eliminar driver
      await Driver.findByIdAndDelete(driverId, { session });

      await session.commitTransaction();
      console.log('✅ Driver eliminado:', driverId);

      return { success: true, message: 'Conductor eliminado correctamente' };
    } catch (error) {
      console.error('❌ Error en deleteDriver:', error);
      await session.abortTransaction();
      throw new Error(`Error al eliminar conductor: ${error.message}`);
    } finally {
      session.endSession();
    }
  }
};

module.exports = driverService;