const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'El número de teléfono es requerido'],
    trim: true
  },
  // Añadir referencia al usuario para clientes con acceso al portal
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', clientSchema);