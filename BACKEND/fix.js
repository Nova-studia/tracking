require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportes';

async function updateAdminPassword() {
  try {
    // Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar el usuario admin con isMainAdmin: true
    console.log('🔍 Buscando usuario admin principal...');
    const adminUser = await User.findOne({ 
      username: 'admin',
      isMainAdmin: true
    });
    
    if (!adminUser) {
      console.error('❌ Usuario admin principal no encontrado');
      process.exit(1);
    }
    
    console.log('✅ Usuario admin encontrado:', adminUser.username);
    
    // Generar el hash de la nueva contraseña
    console.log('🔐 Generando hash para la nueva contraseña...');
    const newPassword = '1231';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña
    console.log('🔄 Actualizando contraseña...');
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('✅ Contraseña actualizada correctamente');
    console.log('🔑 Nueva contraseña: 1231');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('👋 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar la función
updateAdminPassword();
