import mongoose from 'mongoose';

/**
 * Complaint
 * Single source of truth for a complaint's full lifecycle:
 * User raises -> routed to Department -> Officer receives -> Officer acts
 * (before/after photos + solution) -> Officer closes -> User accepts/
 * rejects with feedback & rating.
 */
const complaintSchema = new mongoose.Schema(
  {
    complaintCode: {
      type: String,
      required: true,
      unique: true, // human-readable ID, e.g. SC-2026-00001
    },

    // Who raised it
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What & where
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    location: {
      address: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    // Who is handling it
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },

    // Lifecycle status
    status: {
      type: String,
      enum: [
        "Pending", // just raised, awaiting routing
        "Assigned", // routed to an officer
        "In Progress", // officer working on it
        "Resolved", // officer closed with a solution, awaiting user response
        "Closed", // user accepted the solution
        "Reopened", // user rejected the solution
      ],
      default: "Pending",
    },

    // Officer's resolution
    resolution: {
      beforePhotos: [{ type: String }], // file URLs
      afterPhotos: [{ type: String }], // file URLs
      solutionGiven: { type: String, trim: true },
      resolvedAt: { type: Date },
    },

    // User's response to the resolution
    userFeedback: {
      decision: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending",
      },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      respondedAt: { type: Date },
    },

    // Audit trail of every status change
    statusHistory: [
      {
        status: { type: String },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "statusHistory.changedByModel",
        },
        changedByModel: {
          type: String,
          enum: ["User", "Officer", "Admin"],
        },
        remarks: { type: String, trim: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Common query patterns: officer dashboards filter by department + status
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ assignedOfficer: 1, status: 1 });
complaintSchema.index({ user: 1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
