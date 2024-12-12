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
  },
  loadingPhotos: {
    frontPhoto: {
      url: String,
      uploadedAt: Date
    },
    backPhoto: {
      url: String,
      uploadedAt: Date
    },
    leftPhoto: {
      url: String,
      uploadedAt: Date
    },
    rightPhoto: {
      url: String,
      uploadedAt: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Middleware para extraer ciudad y estado de la ubicación
vehicleSchema.pre('save', function(next) {
  if (this.isModified('lotLocation')) {
    const [city, state] = this.lotLocation.split(',').map(s => s.trim());
    this.city = city;
    this.state = state;
  }
  next();
});

// Middleware para actualizar ciudad y estado cuando se actualiza la ubicación
vehicleSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.lotLocation) {
    const [city, state] = update.lotLocation.split(',').map(s => s.trim());
    update.city = city;
    update.state = state;
  }
  next();
});

// Middleware para asegurar que no se pueda cambiar a 'loading' sin fotos
vehicleSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.status === 'loading') {
    const vehicle = await this.model.findOne(this.getQuery());
    if (!vehicle.loadingPhotos || 
        !vehicle.loadingPhotos.frontPhoto || 
        !vehicle.loadingPhotos.backPhoto || 
        !vehicle.loadingPhotos.leftPhoto || 
        !vehicle.loadingPhotos.rightPhoto) {
      throw new Error('Se requieren todas las fotos antes de cambiar el estado a loading');
    }
  }
  next();
});

// Índices para mejorar el rendimiento de las consultas
vehicleSchema.index({ clientId: 1, status: 1 });
vehicleSchema.index({ driverId: 1, status: 1 });
vehicleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);