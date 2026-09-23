import mongoose from 'mongoose';

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The email the OTP was actually sent to - always the account's own
    // email (Google account email, or the manually entered one). Kept
    // here too so a lookup doesn't need a join just to resend.
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Never store the raw OTP - only a bcrypt hash of it, same as a password.
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['REGISTER'],
      default: 'REGISTER',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: the document is automatically deleted once
// `expiresAt` is in the past. This keeps the collection self-cleaning -
// no cron job needed for expired OTPs.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model('Otp', otpSchema);
