import mongoose from 'mongoose';

const { Schema } = mongoose;

const garbageBookingSchema = new Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wasteType: {
      type: String,
      enum: ['dry', 'wet', 'electronic', 'bulk_debris'],
      required: true,
    },
    wasteTypes: {
      type: [String],
      enum: ['dry', 'wet', 'electronic', 'bulk_debris'],
      default: [],
    },
    wasteLabel: {
      type: String,
      required: true,
    },
    wasteLabels: {
      type: [String],
      default: [],
    },
    volume: {
      type: String,
      required: true,
    },
    pickupAddress: {
      fullName: { type: String, required: true },
      contactNo: { type: String, required: true },
      streetAddress: { type: String, required: true },
      ward: { type: String, default: 'Ward 4 - CIDCO' },
      city: { type: String, default: 'Chhatrapati Sambhajinagar' },
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: [
        'scheduled',
        'request_submitted',
        'Request Submitted',
        'request_accepted',
        'Request Accepted.arriving shortly',
        'van_assigned',
        'on_route',
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
      default: 'Sanitation Department',
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
    assignedVan: {
      vanNumber: { type: String, default: 'MH-20-GV-0812' },
      driverName: { type: String, default: 'Santosh Gaikwad' },
      driverPhone: { type: String, default: '+91 94220 12345' },
    },
  },
  { timestamps: true }
);

export const GarbageBooking = mongoose.model('GarbageBooking', garbageBookingSchema);
