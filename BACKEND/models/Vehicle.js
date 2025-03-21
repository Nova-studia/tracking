const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
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
  comments: {
    type: String,
  },
  auctionHouse: {
    type: String,
    enum: {
      values: ['Copart', 'IAA', 'Otra'],
      message: 'Casa de subasta inválida: {VALUE}'
    },
    required: [true, 'La casa de subasta es requerida']
  },
  PIN: {
    type: String,
    trim: true
  },
  LOT: {
    type: String,
    trim: true,
    maxlength: [8, 'El LOT no puede tener más de 8 caracteres'],
    match: [/^[A-Za-z0-9]{1,8}$/, 'El LOT solo puede contener letras y números'],
    validate: {
      validator: async function(lot) {
        if (!lot) return true; // Permitir LOT vacío si no es requerido
        
        const Vehicle = this.constructor;
        const exists = await Vehicle.findOne({ 
          LOT: lot,
          _id: { $ne: this._id }
        });
        return !exists;
      },
      message: 'Este número de LOT ya está en uso'
    }
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
  partnerGroup: {
    type: String,
    default: 'main', // Grupo al que pertenece el vehículo
    required: true
  },
  loadingPhotos: {
    frontPhoto: {
      url: String,
      publicId: String, // ID de Cloudinary
      uploadedAt: Date
    },
    backPhoto: {
      url: String,
      publicId: String, // ID de Cloudinary
      uploadedAt: Date
    },
    leftPhoto: {
      url: String,
      publicId: String, // ID de Cloudinary
      uploadedAt: Date
    },
    rightPhoto: {
      url: String,
      publicId: String, // ID de Cloudinary
      uploadedAt: Date
    }
  },
  travelComments: [{
    comment: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'loading', 'in-transit', 'delivered'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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

// Índices para optimizar consultas
vehicleSchema.index({ clientId: 1, status: 1 });
vehicleSchema.index({ driverId: 1, status: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ LOT: 1 }, { unique: true, sparse: true });
vehicleSchema.index({ PIN: 1 });
vehicleSchema.index({ auctionHouse: 1 });
vehicleSchema.index({ partnerGroup: 1 }); // Nuevo índice para búsquedas por grupo

module.exports = mongoose.model('Vehicle', vehicleSchema);