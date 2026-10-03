import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DEPARTMENTS } from '../config/complaintCategories.js';

/** Department officer. Created with `npm run create-officer`; logs in at /officer-login. */
const officerSchema = new mongoose.Schema(
  {
    officerId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    password: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

officerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

officerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const Officer = mongoose.model('Officer', officerSchema);
