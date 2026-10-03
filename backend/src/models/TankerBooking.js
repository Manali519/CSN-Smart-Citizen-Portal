import mongoose from 'mongoose';

const { Schema } = mongoose;

const point = { lat: Number, lng: Number };

/** Water tanker booking. Prices are computed server-side from utils/tankerData.js. */
const tankerBookingSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    waterSource: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      locationName: { type: String, required: true },
      reservoirType: { type: String },
      coordinates: point,
    },
    quantity: { type: Number, required: true }, // litres
    waterQuality: {
      grade: { type: String, enum: ['potable_ro', 'domestic_utility', 'construction_raw'], required: true },
      label: { type: String, required: true },
      tds: Number,
      ph: Number,
      certification: String,
    },
    addons: [{ _id: false, id: String, name: String, price: Number }],
    pricing: {
      basePrice: { type: Number, required: true },
      addonsTotal: { type: Number, default: 0 },
      distanceKm: Number,
      deliveryFee: Number,
      serviceFee: Number,
      taxes: Number,
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
      coordinates: point, // only when the citizen shared a location
    },
    deliverySlot: { type: String, default: 'Immediate (25-35 mins)' },
    payment: {
      method: { type: String, enum: ['cash', 'upi'], default: 'upi' },
      status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    },
    status: {
      type: String,
      enum: ['confirmed', 'filling', 'on_the_way', 'arrived', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    driver: {
      name: String,
      phone: String,
      vehicleNo: String,
      vehicleModel: String,
      rating: Number,
      photo: String,
    },
    tracking: { etaMinutes: Number },
  },
  { timestamps: true }
);

export const TankerBooking = mongoose.model('TankerBooking', tankerBookingSchema);
