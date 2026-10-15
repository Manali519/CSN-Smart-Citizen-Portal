import { Admin } from '../models/Admin.js';
import { Complaint } from '../models/Complaint.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { GarbageBooking } from '../models/GarbageBooking.js';
import { setStaffSession, clearStaffSession } from '../middleware/requireStaff.js';

/** Admin email + password login; issues the staff session cookie with role "admin". */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    setStaffSession(res, { id: admin._id, role: 'admin' });
    return res.status(200).json({ success: true, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

/** Profile of the logged-in admin (also used by the frontend to check the session). */
export async function getAdminProfile(req, res, next) {
  try {
    const admin = await Admin.findById(req.staff.id).lean();
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Session is no longer valid. Please log in again.' });
    }
    return res.status(200).json({ success: true, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_WEEKS = 12;

const countIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

/** Groups documents created in the last `weeks` rolling 7-day windows; _id 0 = the most recent week. */
function weeklyPipeline(match, now, groupFields) {
  return [
    { $match: match },
    {
      $group: {
        _id: { $floor: { $divide: [{ $subtract: [now, '$createdAt'] }, WEEK_MS] } },
        ...groupFields,
      },
    },
  ];
}

/**
 * Dashboard statistics. Query: weeks (1-12, default 4), rating (1-5, optional).
 * The rating filter narrows resolved complaints and bookings to those rated exactly that many stars;
 * submitted / rejected / suspected counts have no rating and are never filtered.
 */
export async function getAdminStats(req, res, next) {
  try {
    const weeks = Math.min(MAX_WEEKS, Math.max(1, parseInt(req.query.weeks, 10) || 4));
    const rating = [1, 2, 3, 4, 5].includes(Number(req.query.rating)) ? Number(req.query.rating) : null;
    const now = new Date();
    const since = new Date(now.getTime() - weeks * WEEK_MS);
    const inRange = { createdAt: { $gt: since, $lte: now } };

    const isResolved = { $in: ['$status', ['Resolved', 'Closed']] };
    const ratingIs = (field) => (rating ? { $eq: [field, rating] } : true);

    const [complaintRows, tankerRows, garbageRows] = await Promise.all([
      Complaint.aggregate(
        weeklyPipeline(inRange, now, {
          submitted: { $sum: 1 },
          pendingReview: countIf({ $eq: ['$status', 'Pending Review'] }),
          resolved: countIf({ $and: [isResolved, ratingIs('$userFeedback.rating')] }),
          rejected: countIf({ $eq: ['$status', 'Rejected'] }),
          suspectedFake: countIf({ $eq: ['$status', 'Suspected Fake'] }),
          ratingSum: { $sum: { $ifNull: ['$userFeedback.rating', 0] } },
          ratingCount: countIf({ $gt: ['$userFeedback.rating', 0] }),
        })
      ),
      // Every tanker booking has a mirrored water_tanker service request, which is what officers update and citizens rate.
      ServiceRequest.aggregate(
        weeklyPipeline({ ...inRange, type: 'water_tanker' }, now, {
          bookings: countIf(ratingIs('$rating')),
          ratingSum: { $sum: { $ifNull: ['$rating', 0] } },
          ratingCount: countIf({ $gt: ['$rating', 0] }),
        })
      ),
      GarbageBooking.aggregate(
        weeklyPipeline(inRange, now, {
          bookings: countIf(ratingIs('$rating')),
          ratingSum: { $sum: { $ifNull: ['$rating', 0] } },
          ratingCount: countIf({ $gt: ['$rating', 0] }),
        })
      ),
    ]);

    const byWeek = (rows) => new Map(rows.map((r) => [r._id, r]));
    const [c, t, g] = [byWeek(complaintRows), byWeek(tankerRows), byWeek(garbageRows)];

    // Oldest week first, so the table reads left-to-right / top-to-bottom in time order.
    const weekly = Array.from({ length: weeks }, (_, i) => weeks - 1 - i).map((idx) => ({
      from: new Date(now.getTime() - (idx + 1) * WEEK_MS),
      to: new Date(now.getTime() - idx * WEEK_MS),
      complaintsSubmitted: c.get(idx)?.submitted || 0,
      complaintsResolved: c.get(idx)?.resolved || 0,
      tankerBookings: t.get(idx)?.bookings || 0,
      garbageBookings: g.get(idx)?.bookings || 0,
    }));

    const sum = (rows, field) => rows.reduce((total, r) => total + (r[field] || 0), 0);
    const average = (rows) => {
      const count = sum(rows, 'ratingCount');
      return count ? Number((sum(rows, 'ratingSum') / count).toFixed(1)) : null;
    };

    return res.json({
      success: true,
      weeks,
      rating,
      from: since,
      to: now,
      totals: {
        complaintsSubmitted: sum(complaintRows, 'submitted'),
        pendingReview: sum(complaintRows, 'pendingReview'),
        complaintsResolved: sum(complaintRows, 'resolved'),
        complaintsRejected: sum(complaintRows, 'rejected'),
        suspectedFake: sum(complaintRows, 'suspectedFake'),
        tankerBookings: sum(tankerRows, 'bookings'),
        garbageBookings: sum(garbageRows, 'bookings'),
      },
      averageRating: {
        complaints: average(complaintRows),
        tanker: average(tankerRows),
        garbage: average(garbageRows),
      },
      weekly,
    });
  } catch (err) {
    next(err);
  }
}

export function adminLogout(_req, res) {
  clearStaffSession(res, 'admin');
  res.status(200).json({ success: true, message: 'Logged out.' });
}
