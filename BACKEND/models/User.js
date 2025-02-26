const mongoose = require('mongoose');

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
    enum: ['admin', 'driver', 'partner'], // Añadimos el rol "partner"
    required: true
  },
  state: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  partnerGroup: {
    type: String,
    default: 'main', // Por defecto, todos pertenecen al grupo principal
    required: true
  },
  isMainAdmin: {
    type: Boolean,
    default: false, // Sólo el administrador principal puede ver todos los vehículos
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);