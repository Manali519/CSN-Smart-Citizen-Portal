import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Admin
 * Has full oversight of Users and Officers (create, view, update, deactivate)
 * and visibility into all complaints. Admins do not issue or resolve
 * complaints themselves — that stays with Users and Officers.
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
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
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "moderator"],
      default: "moderator",
    },
    permissions: {
      manageUsers: { type: Boolean, default: true },
      manageOfficers: { type: Boolean, default: true },
      manageDepartments: { type: Boolean, default: true },
      viewComplaints: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model('Admin', adminSchema);
