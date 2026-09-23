import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Officer
 * A department official who receives, acts on, and closes complaints.
 * "receivedComplaints" stores references only — status, photos, and
 * solution details live on the Complaint document itself.
 */
const officerSchema = new mongoose.Schema(
  {
    officerName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    receivedComplaints: [
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

officerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

officerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Officer = mongoose.model('Officer', officerSchema);
