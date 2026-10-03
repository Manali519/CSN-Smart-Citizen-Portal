import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    receipt: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: ['test_payment'], default: 'test_payment' },
    description: { type: String, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 100 }, // paise
    currency: { type: String, default: 'INR' },
    mode: { type: String, enum: ['test'], default: 'test' },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    method: { type: String }, // card / upi / netbanking / wallet, as reported by Razorpay

    status: { type: String, enum: ['created', 'paid'], default: 'created', index: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.razorpaySignature;
    delete ret.__v;
    return ret;
  },
});

export const Payment = mongoose.model('Payment', paymentSchema);
