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
      enum: [
        'pending',
        'request_submitted',
        'Request Submitted',
        'request_accepted',
        'Request Accepted.arriving shortly',
        'scheduled',
        'in_progress',
        'Work in Progress',
        'completed',
        'Completed',
        'cancelled',
      ],
      default: 'Request Submitted',
      index: true,
    },
    routedDepartment: {
      type: String,
      default: null,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Officer',
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

