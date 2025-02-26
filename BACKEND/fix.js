// En un archivo temporal transferir-todo.js
require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Client = require('./models/Client');

async function transferirTodo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');
    
    // 1. Verificar que admin sea admin principal
    const adminUpdate = await User.updateOne(
      { username: 'admin' },
      { $set: { isMainAdmin: true } }
    );
    console.log('Admin actualizado:', adminUpdate);
    
    // 2. Mover todos los vehículos del grupo 'main' al grupo 'grupo_maikel'
    const vehiculosUpdate = await Vehicle.updateMany(
      { partnerGroup: 'main' },
      { $set: { partnerGroup: 'grupo_maikel' } }
    );
    console.log(`${vehiculosUpdate.modifiedCount} vehículos movidos de 'main' a 'grupo_maikel'`);
    
    // 3. Mover conductores - actualizar usuarios de drivers
    const driverUsersUpdate = await User.updateMany(
      { role: 'driver', partnerGroup: 'main' },
      { $set: { partnerGroup: 'grupo_maikel' } }
    );
    console.log(`${driverUsersUpdate.modifiedCount} usuarios de conductores actualizados`);
    
    // 4. Si tu modelo Driver tiene partnerGroup, actualízalo también
    // (Este campo no aparecía en el modelo que compartiste, pero por si acaso)
    if (Driver.schema.paths.partnerGroup) {
      const driversUpdate = await Driver.updateMany(
        { partnerGroup: 'main' },
        { $set: { partnerGroup: 'grupo_maikel' } }
      );
      console.log(`${driversUpdate.modifiedCount} conductores actualizados`);
    } else {
      console.log("El modelo Driver no tiene campo partnerGroup, no es necesario actualizar");
    }
    
    // 5. Si los clientes tienen partnerGroup, actualízalos
    if (Client.schema.paths.partnerGroup) {
      const clientsUpdate = await Client.updateMany(
        { partnerGroup: 'main' },
        { $set: { partnerGroup: 'grupo_maikel' } }
      );
      console.log(`${clientsUpdate.modifiedCount} clientes actualizados`);
    } else {
      console.log("El modelo Client no tiene campo partnerGroup, no es necesario actualizar");
    }
    
    console.log("Transferencia completada con éxito");
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

transferirTodo();
