import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Officer } from '../models/Officer.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { GarbageBooking } from '../models/GarbageBooking.js';
import { canonicalDepartment } from '../config/complaintCategories.js';
import { setStaffSession, clearStaffSession } from '../middleware/requireStaff.js';

const WATER_DEPARTMENT = 'Water Supply and Drainage Department';
const SANITATION_DEPARTMENT = 'Sanitation Department';
const ACCEPTED_STATUS = 'Request Accepted.arriving shortly';
const COMPLETED_STATUS = 'Completed';
const QUEUE_LIMIT = 200;

// Every status spelling the booking models allow, grouped by stage, so transitions only move forward.
const IN_PROGRESS_STATES = ['request_accepted', ACCEPTED_STATUS, 'van_assigned', 'on_route', 'in_progress', 'Work in Progress'];
const CLOSED_STATES = ['completed', COMPLETED_STATUS, 'cancelled'];

// Compared against when the officer ID is unknown, so response time does not reveal which IDs exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const fullName = (person) => `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Citizen';

function fromServiceRequest(r) {
  return {
    _id: r._id,
    referenceNo: r.referenceNo,
    userName: fullName(r.citizen),
    userPhone: r.citizen?.contactNo || 'N/A',
    userAddress: r.address || r.citizen?.streetAddress || 'N/A',
    requestDetails: `Water Tanker — ${r.notes || 'Standard Delivery'}`,
    status: r.status,
    type: 'water_tanker',
    department: WATER_DEPARTMENT,
    rating: r.rating,
    createdAt: r.createdAt,
  };
}

function fromGarbageBooking(b) {
  return {
    _id: b._id,
    referenceNo: b.bookingId,
    userName: b.user ? fullName(b.user) : b.pickupAddress?.fullName || 'Citizen',
    userPhone: b.pickupAddress?.contactNo || b.user?.contactNo || 'N/A',
    userAddress: b.pickupAddress?.streetAddress || b.user?.streetAddress || 'N/A',
    requestDetails: `Garbage Van — ${b.wasteLabels?.join(', ') || b.wasteLabel || 'Solid Waste'} | ${b.volume} | ${b.timeSlot}`,
    status: b.status,
    type: 'garbage_booking',
    department: SANITATION_DEPARTMENT,
    rating: b.rating,
    createdAt: b.createdAt,
  };
}

/** Garbage bookings belong to Sanitation; every other service request is a water tanker. */
const modelFor = (type) =>
  type === 'garbage_booking'
    ? { Model: GarbageBooking, department: SANITATION_DEPARTMENT, ownerField: 'user' }
    : { Model: ServiceRequest, department: WATER_DEPARTMENT, ownerField: 'citizen' };

export async function officerLogin(req, res, next) {
  try {
    const officerId = String(req.body.officerId || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const department = canonicalDepartment(req.body.department);

    const officer = officerId ? await Officer.findOne({ officerId }).select('+password') : null;
    const passwordMatches = await bcrypt.compare(password, officer ? officer.password : DUMMY_HASH);

    if (!officer || !officer.isActive || !passwordMatches || officer.department !== department) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    setStaffSession(res, { id: officer.officerId, role: 'officer', department: officer.department });
    return res.status(200).json({
      success: true,
      message: 'Officer authenticated successfully.',
      officer: {
        officerId: officer.officerId,
        department: officer.department,
        officerName: officer.name || `${officer.department} Officer`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function officerLogout(_req, res) {
  clearStaffSession(res, 'officer');
  res.status(200).json({ success: true, message: 'Logged out.' });
}

/** Service requests for the logged-in officer's department only (taken from the session, not the client). */
export async function listDepartmentRequests(req, res, next) {
  try {
    const { department } = req.staff;
    let requests = [];

    if (department === WATER_DEPARTMENT) {
      const docs = await ServiceRequest.find({ type: 'water_tanker' })
        .populate('citizen', 'firstName lastName streetAddress contactNo')
        .sort({ createdAt: -1 })
        .limit(QUEUE_LIMIT)
        .lean();
      requests = docs.map(fromServiceRequest);
    } else if (department === SANITATION_DEPARTMENT) {
      const docs = await GarbageBooking.find()
        .populate('user', 'firstName lastName streetAddress contactNo')
        .sort({ createdAt: -1 })
        .limit(QUEUE_LIMIT)
        .lean();
      requests = docs.map(fromGarbageBooking);
    }

    return res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
}

async function updateRequestStatus(req, res, next, { status, from, message }) {
  try {
    const { requestId, type } = req.body;
    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: 'A valid request ID is required.' });
    }

    const { Model, department } = modelFor(type);
    if (req.staff.department !== department) {
      return res.status(403).json({ success: false, message: 'This request belongs to another department.' });
    }

    const updated = await Model.findOneAndUpdate({ _id: requestId, status: from }, { status }, { new: true });
    if (!updated) {
      return res.status(409).json({ success: false, message: 'Request not found, or it is no longer at that stage.' });
    }
    return res.status(200).json({ success: true, message, request: updated });
  } catch (err) {
    next(err);
  }
}

/** Body: { requestId, type: 'water_tanker' | 'garbage_booking' } */
export function acceptRequest(req, res, next) {
  return updateRequestStatus(req, res, next, {
    status: ACCEPTED_STATUS,
    from: { $nin: [...IN_PROGRESS_STATES, ...CLOSED_STATES] },
    message: 'Request accepted.',
  });
}

/** Body: { requestId, type } */
export function markComplete(req, res, next) {
  return updateRequestStatus(req, res, next, {
    status: COMPLETED_STATUS,
    from: { $in: IN_PROGRESS_STATES },
    message: 'Request marked as completed.',
  });
}

/** Citizen rates their own completed request. Body: { requestId, type, rating } */
export async function submitRating(req, res, next) {
  try {
    const { requestId, type } = req.body;
    const rating = Number(req.body.rating);
    if (!mongoose.isValidObjectId(requestId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid request ID and rating (1-5) required.' });
    }

    const { Model, ownerField } = modelFor(type);
    const updated = await Model.findOneAndUpdate(
      { _id: requestId, [ownerField]: req.user._id, status: COMPLETED_STATUS },
      { rating },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'No completed request of yours with that ID.' });
    }

    return res.status(200).json({ success: true, message: 'Rating submitted. Thank you for your feedback!', request: updated });
  } catch (err) {
    next(err);
  }
}
