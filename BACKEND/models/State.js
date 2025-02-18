const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
  state: {
    type: String,
    required: [true, 'El estado es requerido'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('State', StateSchema);
