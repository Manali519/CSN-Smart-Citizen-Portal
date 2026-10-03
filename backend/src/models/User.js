import mongoose from 'mongoose';

/** Citizen account. Names and contact details may be filled in after sign-up via PUT /api/auth/profile. */
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contactNo: { type: String, trim: true, index: true },
    dob: { type: String, trim: true },
    streetAddress: { type: String, trim: true },
    signupMethod: { type: String, enum: ['manual', 'google'], default: 'manual' },
    googleId: { type: String, index: true, sparse: true },
    passwordHash: { type: String, select: false },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
