import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceRequestSchema = new Schema(
  {
    citizen: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referenceNo: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['water_tanker', 'garbage_van'],
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
