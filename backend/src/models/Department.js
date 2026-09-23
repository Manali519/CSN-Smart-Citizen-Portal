import mongoose from 'mongoose';

/**
 * Department
 * Master list of city departments (Water, Electricity, Roads, Sanitation, etc.)
 * Complaint "category" maps to a department so a new complaint can be
 * auto-routed to the correct officer pool.
 */
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
