const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido']
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido']
  },
  license: String,
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);