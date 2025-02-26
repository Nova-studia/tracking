const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
  
      return {
        token,
        user: userData
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(error.message || 'Error en autenticación');
    }
  },

  async createPartner(partnerData) {
    try {
      // Verificar si ya existe un usuario con ese username
      const existingUser = await User.findOne({ username: partnerData.username });
      if (existingUser) {
        throw new Error('El nombre de usuario ya está registrado');
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(partnerData.password, salt);

      // Crear nuevo usuario con rol de socio
      const newPartner = new User({
        username: partnerData.username,
        password: hashedPassword,
        role: 'partner', // Rol específico para socios
        partnerGroup: partnerData.partnerGroup, // Asignar al grupo específico
        isActive: true,
        state: partnerData.state || '',
        isMainAdmin: false // Los socios no son admin principales
      });

      await newPartner.save();

      return {
        id: newPartner._id,
        username: newPartner.username,
        role: newPartner.role,
        partnerGroup: newPartner.partnerGroup
      };
    } catch (error) {
      console.error('Error creando socio:', error);
      throw new Error(`Error al crear socio: ${error.message}`);
    }
  },

  async getPartners() {
    try {
      // Obtener todos los usuarios con rol de socio
      const partners = await User.find(
        { role: 'partner' },
        { password: 0 } // Excluir el campo password
      );
      
      return partners;
    } catch (error) {
      console.error('Error obteniendo socios:', error);
      throw new Error('Error al obtener lista de socios');
    }
  },

  async togglePartnerStatus(partnerId) {
    try {
      const partner = await User.findById(partnerId);
      
      if (!partner || partner.role !== 'partner') {
        throw new Error('Socio no encontrado');
      }
      
      // Invertir el estado actual
      partner.isActive = !partner.isActive;
      await partner.save();
      
      return {
        id: partner._id,
        username: partner.username,
        role: partner.role,
        isActive: partner.isActive,
        partnerGroup: partner.partnerGroup
      };
    } catch (error) {
      console.error('Error al cambiar estado de socio:', error);
      throw new Error(`Error al modificar estado del socio: ${error.message}`);
    }
  },
  
  async updatePartner(partnerId, updateData) {
    try {
      const partner = await User.findById(partnerId);
      
      if (!partner || partner.role !== 'partner') {
        throw new Error('Socio no encontrado');
      }
      
      // Actualizar solo campos permitidos
      if (updateData.partnerGroup) {
        partner.partnerGroup = updateData.partnerGroup;
      }
      
      if (updateData.state) {
        partner.state = updateData.state;
      }
      
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        partner.password = await bcrypt.hash(updateData.password, salt);
      }
      
      await partner.save();
      
      return {
        id: partner._id,
        username: partner.username,
        role: partner.role,
        isActive: partner.isActive,
        partnerGroup: partner.partnerGroup,
        state: partner.state
      };
    } catch (error) {
      console.error('Error al actualizar socio:', error);
      throw new Error(`Error al actualizar socio: ${error.message}`);
    }
  },
  
  async deletePartner(partnerId) {
    try {
      const partner = await User.findOneAndDelete({
        _id: partnerId,
        role: 'partner'
      });
      
      if (!partner) {
        throw new Error('Socio no encontrado');
      }
      
      return { message: 'Socio eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar socio:', error);
      throw new Error(`Error al eliminar socio: ${error.message}`);
    }
  }
};

module.exports = authService;