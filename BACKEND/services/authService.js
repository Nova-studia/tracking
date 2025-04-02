const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const User = require('../models/User');
const Driver = require('../models/Driver');

const authService = {
  async generateToken(user) {
    try {
      // Buscar driverId si es conductor
      let driverId = null;
      if (user.role === 'driver') {
        const driver = await Driver.findOne({ userId: user._id });
        if (driver) {
          driverId = driver._id;
        }
      }
  
      const payload = {
        id: user._id,
        username: user.username,
        role: user.role,
        partnerGroup: user.partnerGroup || 'main',
        isMainAdmin: user.isMainAdmin || false,
        driverId: driverId // Incluir driverId en el token si es un conductor
      };
  
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d' // Token expira en 1 día
      });
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Error generando token de autenticación');
    }
  },

  async login(username, password) {
    try {
      // Buscar usuario por username
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('Credenciales inválidas');
      }
  
      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new Error('Usuario inactivo. Contacte al administrador');
      }
  
      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Credenciales inválidas');
      }
  
      // Generar token JWT
      const token = await this.generateToken(user);
  
      // Construir objeto de respuesta según el rol
      let userData = {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        partnerGroup: user.partnerGroup || 'main',
        isMainAdmin: user.isMainAdmin || false
      };
  
      // Si es un conductor, añadir información específica
      if (user.role === 'driver') {
        const driver = await Driver.findOne({ userId: user._id });
        if (driver) {
          userData = {
            ...userData,
            name: driver.name,
            driverId: driver._id
          };
        }
      }
      
      // Si es un cliente, añadir información específica
      if (user.role === 'client') {
        const client = await Client.findOne({ userId: user._id });
        if (client) {
          userData = {
            ...userData,
            name: client.name,
            clientId: client._id
          };
        }
      }
  
      return {
        token,
        user: userData
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(error.message || 'Error en autenticación');
    }
  },

  async createAdmin(adminData) {
    try {
      // Verificar si ya existe un usuario con ese username
      const existingUser = await User.findOne({ username: adminData.username });
      if (existingUser) {
        throw new Error('El nombre de usuario ya está registrado');
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Crear nuevo usuario con rol de admin
      const newAdmin = new User({
        username: adminData.username,
        password: hashedPassword,
        role: 'admin', // Rol de administrador
        partnerGroup: adminData.partnerGroup, // Asignar al grupo específico
        isActive: true,
        state: adminData.state || '',
        isMainAdmin: false // No es admin principal
      });

      await newAdmin.save();

      return {
        id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role,
        partnerGroup: newAdmin.partnerGroup
      };
    } catch (error) {
      console.error('Error creando administrador:', error);
      throw new Error(`Error al crear administrador: ${error.message}`);
    }
  },

  async getAdmins() {
    try {
      // Obtener todos los usuarios con rol admin que NO sean admin principal
      const admins = await User.find(
        { role: 'admin', isMainAdmin: false },
        { password: 0 } // Excluir el campo password
      );
      
      return admins;
    } catch (error) {
      console.error('Error obteniendo admins:', error);
      throw new Error('Error al obtener lista de administradores');
    }
  },

  async toggleAdminStatus(adminId) {
    try {
      const admin = await User.findById(adminId);
      
      if (!admin || admin.role !== 'admin' || admin.isMainAdmin) {
        throw new Error('Administrador no encontrado o es administrador principal');
      }
      
      // Invertir el estado actual
      admin.isActive = !admin.isActive;
      await admin.save();
      
      return {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        isActive: admin.isActive,
        partnerGroup: admin.partnerGroup
      };
    } catch (error) {
      console.error('Error al cambiar estado del administrador:', error);
      throw new Error(`Error al modificar estado del administrador: ${error.message}`);
    }
  },
  
  async updateAdmin(adminId, updateData) {
    try {
      const admin = await User.findById(adminId);
      
      if (!admin || admin.role !== 'admin' || admin.isMainAdmin) {
        throw new Error('Administrador no encontrado o es administrador principal');
      }
      
      // Actualizar solo campos permitidos
      if (updateData.partnerGroup) {
        admin.partnerGroup = updateData.partnerGroup;
      }
      
      if (updateData.state) {
        admin.state = updateData.state;
      }
      
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(updateData.password, salt);
      }
      
      await admin.save();
      
      return {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        isActive: admin.isActive,
        partnerGroup: admin.partnerGroup,
        state: admin.state
      };
    } catch (error) {
      console.error('Error al actualizar administrador:', error);
      throw new Error(`Error al actualizar administrador: ${error.message}`);
    }
  },
  
  async deleteAdmin(adminId) {
    try {
      const admin = await User.findOneAndDelete({
        _id: adminId,
        role: 'admin',
        isMainAdmin: false // Asegurarse de que no sea el admin principal
      });
      
      if (!admin) {
        throw new Error('Administrador no encontrado o es administrador principal');
      }
      
      return { message: 'Administrador eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar administrador:', error);
      throw new Error(`Error al eliminar administrador: ${error.message}`);
    }
  }
};

module.exports = authService;