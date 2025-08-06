import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
  phone_number: string;
  lot_number: string;
  full_name: string;
  address: string;
  gatepass: string;
  signature_data: string;
  timestamp: Date;
  ip_address?: string;
}

const ContractSchema: Schema = new Schema({
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  lot_number: {
    type: String,
    required: true,
    length: 8,
    uppercase: true,
    trim: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  gatepass: {
    type: String,
    required: true,
    trim: true,
    maxlength: 6,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        return /^[A-Z0-9]*$/.test(v);
      },
      message: 'Gatepass solo puede contener letras y números'
    }
  },
  signature_data: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip_address: {
    type: String,
    required: false
  }
});

// Create indexes for better query performance
ContractSchema.index({ timestamp: -1 });
ContractSchema.index({ phone_number: 1 });
ContractSchema.index({ lot_number: 1 }, { unique: true });

export default mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);