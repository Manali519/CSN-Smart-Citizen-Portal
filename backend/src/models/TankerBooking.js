import mongoose from 'mongoose';

const { Schema } = mongoose;

const tankerBookingSchema = new Schema(
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
    waterSource: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      locationName: { type: String, required: true },
      reservoirType: { type: String, default: 'Dam Reservoir' },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    quantity: {
      type: Number,
      required: true, // in Litres (e.g. 1000, 2000, 5000, 10000, 20000)
    },
    waterQuality: {
      grade: {
        type: String,
        enum: ['potable_ro', 'domestic_utility', 'construction_raw'],
        default: 'potable_ro',
      },
      label: { type: String, required: true },
      tds: { type: Number, default: 95 },
      ph: { type: Number, default: 7.2 },
      certification: { type: String, default: 'BIS 10500 Certified' },
    },
    addons: [
      {
        id: String,
        name: String,
        price: Number,
      },
    ],
    pricing: {
      basePrice: { type: Number, required: true },
      addonsTotal: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 3.5 },
      deliveryFee: { type: Number, default: 150 },
      serviceFee: { type: Number, default: 49 },
      taxes: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },
    deliveryAddress: {
      fullName: { type: String, required: true, trim: true },
      contactNo: { type: String, required: true, trim: true },
      streetAddress: { type: String, required: true, trim: true },
      landmark: { type: String, trim: true },
      ward: { type: String, trim: true },
      city: { type: String, default: 'Chhatrapati Sambhajinagar' },
      pincode: { type: String, trim: true },
      coordinates: {
        lat: { type: Number, default: 19.8762 },
        lng: { type: Number, default: 75.3433 },
      },
    },
    deliverySlot: {
      type: String,
      default: 'Immediate (25-35 mins)',
    },
    payment: {
      method: {
        type: String,
        enum: ['cash', 'upi'],
        default: 'upi',
      },
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
      },
      transactionId: { type: String },
      paidAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['confirmed', 'filling', 'on_the_way', 'arrived', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    driver: {
      name: { type: String, default: 'Ramesh Patil' },
      phone: { type: String, default: '+91 98230 45678' },
      vehicleNo: { type: String, default: 'MH-20-CZ-4412' },
      vehicleModel: { type: String, default: 'Tata LPK 10,000L Tanker' },
      rating: { type: Number, default: 4.9 },
      photo: { type: String, default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    },
    tracking: {
      currentLocation: {
        lat: { type: Number, default: 19.8350 },
        lng: { type: Number, default: 75.3120 },
      },
      startLocation: {
        lat: { type: Number, default: 19.8350 },
        lng: { type: Number, default: 75.3120 },
      },
      destinationLocation: {
        lat: { type: Number, default: 19.8762 },
        lng: { type: Number, default: 75.3433 },
      },
      routeCoordinates: [
        {
          lat: Number,
          lng: Number,
        },
      ],
      currentStepIndex: { type: Number, default: 0 },
      etaMinutes: { type: Number, default: 28 },
      speedKmh: { type: Number, default: 35 },
      distanceRemainingKm: { type: Number, default: 4.2 },
    },
    statusTimeline: [
      {
        status: String,
        title: String,
        description: String,
        timestamp: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const TankerBooking = mongoose.model('TankerBooking', tankerBookingSchema);
