require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');

async function moverConductorGamboo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');
    
    // 1. Actualizar el usuario asociado al conductor Gamboo
    const usuarioActualizado = await User.updateOne(
      { _id: new mongoose.Types.ObjectId('67bf6ab4dabde250971ad169') }, // Con 'new'
      { $set: { partnerGroup: 'grupo_maikel' } }
    );
    
    console.log(`Usuario de Gamboo actualizado: ${JSON.stringify(usuarioActualizado)}`);
    
    // 2. Actualizar el documento del conductor Gamboo
    const driverActualizado = await Driver.updateOne(
      { _id: new mongoose.Types.ObjectId('67bf6ab4dabde250971ad16b') }, // Con 'new'
      { $set: { partnerGroup: 'grupo_maikel' } }
    );
    
    console.log(`Documento de conductor Gamboo actualizado: ${JSON.stringify(driverActualizado)}`);
    
    // 3. Verificar la actualización
    const gambooUsuario = await User.findById('67bf6ab4dabde250971ad169');
    console.log('Usuario de Gamboo después de la actualización:', gambooUsuario);
    
    const gambooDriver = await Driver.findById('67bf6ab4dabde250971ad16b');
    console.log('Driver Gamboo después de la actualización:', gambooDriver);
    
    console.log('Proceso completado.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

moverConductorGamboo();
