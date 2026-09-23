import mongoose from 'mongoose';

/**
 * User
 * A citizen who registers complaints and accesses smart city services.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNo: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    streetAddress: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    signupMethod: {
      type: String,
      enum: ['manual', 'google'],
      default: 'manual',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    complaintsIssued: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Keep contactNo and contactNumber synced
userSchema.pre('save', function () {
  if (this.contactNo && !this.contactNumber) {
    this.contactNumber = this.contactNo;
  }
  if (this.contactNumber && !this.contactNo) {
    this.contactNo = this.contactNumber;
  }
});

export const User = mongoose.model('User', userSchema);
