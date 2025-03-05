// delete-document.js
require('dotenv').config();
const mongoose = require('mongoose');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportes';
const documentId = '67b4de443a4a6138e67c9609';

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    try {
      // Puedes cambiar 'User' por el nombre de la colección donde está el documento
      // Por ejemplo: 'Vehicle', 'Driver', etc.
      const collection = mongoose.connection.collection('User');
      
      // Eliminar el documento por su ID
      const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(documentId) });
      
      if (result.deletedCount === 1) {
        console.log(`✅ Documento con ID ${documentId} eliminado correctamente`);
      } else {
        console.log(`❌ No se encontró documento con ID ${documentId}`);
      }
    } catch (error) {
      console.error('❌ Error al eliminar documento:', error);
    } finally {
      // Cerrar la conexión
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });
