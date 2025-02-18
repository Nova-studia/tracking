// injectAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definición del Schema de Usuario
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'driver'],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Crear el modelo
const User = mongoose.model('User', userSchema);

// Función principal
async function injectAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportes';
    
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Ya existe un usuario admin');
      console.log('ℹ️ Detalles del admin existente:');
      console.log({
        username: existingAdmin.username,
        role: existingAdmin.role,
        state: existingAdmin.state,
        isActive: existingAdmin.isActive,
        createdAt: existingAdmin.createdAt
      });
    } else {
      // Crear nuevo admin
      const hashedPassword = await bcrypt.hash('1212', 10);
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        state: 'Georgia',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Usuario admin creado exitosamente');
      console.log('🔑 Credenciales:');
      console.log({
        username: 'admin',
        password: '1212',
        role: 'admin',
        state: 'Georgia'
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar el script
injectAdmin();
