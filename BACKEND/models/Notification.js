// models/Notification.js
const mongoose = require('mongoose');

// En Notification.js, línea 4
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  // Añadir un campo para el grupo al que pertenece la notificación
  partnerGroup: {
    type: String,
    default: 'main'
  },
  lotInfo: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  image: String,
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});