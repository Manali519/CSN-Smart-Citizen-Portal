import mongoose from 'mongoose';
import { CATEGORY_KEYS, DEPARTMENTS } from '../config/complaintCategories.js';

export const COMPLAINT_STATUSES = [
  'Pending Review', // passed all checks, routed to the department
  'Suspected Fake', // failed a check, waiting in the admin queue
  'Rejected', // admin rejected it
  'In Progress', // officer working on it
  'Resolved', // officer closed it, awaiting citizen response
  'Closed', // citizen accepted the resolution
  'Reopened', // citizen rejected the resolution
];

const COMPLAINT_FLAGS = [
  'rate_limited', // over the daily limit
  'ml_unavailable', // AI check could not run
  'image_mismatch', // photo does not match the chosen department
  'text_mismatch', // description does not match the chosen department
  'low_confidence', // both matched, but the combined score is below the threshold
  'duplicate_image', // same photo as an earlier complaint
];

/** Statuses an officer can still act on. */
export const OFFICER_OPEN_STATUSES = ['Pending Review', 'In Progress', 'Reopened'];

/**
 * Complaint
 * Citizen raises (category + photo + description) -> automatic checks (location, geofence,
 * rate limit, AI check, duplicate) -> routed to a department or held for admin review ->
 * officer acts -> citizen responds with feedback.
 */
const complaintSchema = new mongoose.Schema(
  {
    complaintCode: { type: String, required: true, unique: true }, // human-readable, e.g. CMP-8F2K91AB

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    category: { type: String, enum: CATEGORY_KEYS, required: true },
    department: { type: String, enum: DEPARTMENTS, default: null }, // null until routed
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    imageUrl: { type: String, required: true },
    imageHash: { type: String, default: null }, // 64-bit perceptual hash (hex)
    imageHashBands: { type: [String], default: undefined }, // indexed pieces of imageHash, see utils/phash.js

    // GeoJSON point, ready for $near queries and a heatmap
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    locationSource: { type: String, enum: ['exif', 'gps', 'manual'], required: true },

    // AI (Gemini) scores (absent when the AI check was unavailable)
    imageScore: Number,
    textScore: Number,
    fusionScore: Number,
    aiReason: { type: String, maxlength: 300 }, // Gemini's one-line explanation, shown to admins
    flags: [{ type: String, enum: COMPLAINT_FLAGS }],

    status: { type: String, enum: COMPLAINT_STATUSES, default: 'Pending Review' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },

    // Officer's resolution
    resolution: {
      afterPhotos: [{ type: String }],
      solutionGiven: { type: String, trim: true },
      resolvedAt: { type: Date },
    },

    // Citizen's response to the resolution
    userFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      respondedAt: { type: Date },
    },

    // Audit trail of every status change
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'statusHistory.changedByModel' },
        changedByModel: { type: String, enum: ['User', 'Officer', 'Admin'] },
        remarks: { type: String, trim: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ department: 1, status: 1, createdAt: -1 }); // officer queue
complaintSchema.index({ status: 1, createdAt: -1 }); // admin queue
complaintSchema.index({ user: 1, createdAt: -1 }); // citizen list + daily rate limit
complaintSchema.index({ createdAt: -1 }); // admin stats
complaintSchema.index({ imageHashBands: 1 }); // duplicate photo lookup

export const Complaint = mongoose.model('Complaint', complaintSchema);
