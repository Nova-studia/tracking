const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'El cliente es requerido']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  brand: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  LOT: {
    type: String,
    trim: true
  },
  lotLocation: {
    type: String,
    required: [true, 'La ubicación del lote es requerida'],
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'assigned', 'loading', 'in-transit', 'delivered'],
      message: 'Estado inválido: {VALUE}'
    },
    default: 'pending'
  }
}, {
  timestamps: true,
  versionKey: false
});

vehicleSchema.pre('save', function(next) {
  if (this.isModified('lotLocation')) {
    const [city, state] = this.lotLocation.split(',').map(s => s.trim());
    this.city = city;
    this.state = state;
  }
  next();
});

vehicleSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.lotLocation) {
    const [city, state] = update.lotLocation.split(',').map(s => s.trim());
    update.city = city;
    update.state = state;
  }
  next();
});

vehicleSchema.index({ clientId: 1, status: 1 });
vehicleSchema.index({ driverId: 1, status: 1 });
vehicleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);