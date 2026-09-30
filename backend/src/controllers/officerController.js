import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { GarbageBooking } from '../models/GarbageBooking.js';
import { Officer } from '../models/Officer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const DEPT_MAP = {
  water: 'Water Supply and Drainage Department',
  sanitation: 'Sanitation Department',
};


function loadOfficerAccountsFromEnv() {
  const accounts = [];

  try {
    const candidatePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), 'backend', '.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(process.cwd(), '..', '.env'),
    ];

    let envContent = '';
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        envContent = fs.readFileSync(p, 'utf-8');
        break;
      }
    }

    if (envContent) {
      const lines = envContent.split(/\r?\n/);
      let current = {};
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
        const val = trimmed.slice(eqIdx + 1).trim();

        if (key === 'officerid') {
          if (current.officerId && current.password) {
            accounts.push(current);
            current = {};
          }
          current.officerId = val;
        } else if (key === 'password') {
          current.password = val;
        } else if (key === 'department') {
          current.department = val;
          if (current.officerId && current.password) {
            accounts.push(current);
            current = {};
          }
        }
      }
      if (current.officerId && current.password) {
        accounts.push(current);
      }
    }
  } catch (err) {
    console.error('[officerController] Error loading .env:', err);
  }

  // Fallback to process.env if loaded via dotenv
  if (process.env.officerId && process.env.password) {
    accounts.push({
      officerId: process.env.officerId.trim(),
      password: process.env.password.trim(),
      department: (process.env.department || '').trim(),
    });
  }

  return accounts;
}


export async function officerLogin(req, res, next) {
  try {
    const { officerId, password, department } = req.body;

    if (!officerId || !password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const requestedDept = (DEPT_MAP[department] || department || '').trim().toLowerCase();
    const accounts = loadOfficerAccountsFromEnv();

    // Find account matching officerId and password
    const matched = accounts.find(
      (acc) =>
        acc.officerId.trim().toLowerCase() === officerId.trim().toLowerCase() &&
        acc.password.trim() === password.trim()
    );

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Verify department matches
    const matchedDept = matched.department.trim();
    const isWaterMatch = matchedDept.toLowerCase().includes('water') && requestedDept.includes('water');
    const isSanitationMatch = matchedDept.toLowerCase().includes('sanitation') && requestedDept.includes('sanitation');

    if (!isWaterMatch && !isSanitationMatch && matchedDept.toLowerCase() !== requestedDept) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }


    return res.status(200).json({
      success: true,
      message: 'Officer authenticated successfully.',
      officer: {
        officerId: matched.officerId.trim(),
        department: matchedDept,
        officerName: `${matchedDept} Officer`,
      },
    });
  } catch (err) {
    next(err);
  }
}



export async function listDepartmentRequests(req, res, next) {
  try {
    const rawDept = (req.query.department || '').trim();

    if (!rawDept) {
      return res.status(400).json({ success: false, message: 'Department query parameter is required.' });
    }

    const isWater = rawDept.toLowerCase().includes('water');
    const isSanitation = rawDept.toLowerCase().includes('sanitation') || rawDept.toLowerCase().includes('waste');

    if (!isWater && !isSanitation) {
      return res.status(403).json({ success: false, message: 'Access denied: Department not authorized.' });
    }

    let allRequests = [];

    // STRICT ISOLATION: Water Department officers ONLY see Water requests
    if (isWater) {
      if (ServiceRequest.db?.readyState === 1) {
        try {
          const waterRequests = await ServiceRequest.find({
            $or: [
              { routedDepartment: { $regex: /water/i } },
              { type: 'water_tanker' },
            ],
          })
            .populate('citizen', 'firstName lastName streetAddress contactNo contactNumber')
            .sort({ createdAt: -1 })
            .lean();

          allRequests = waterRequests.map((r) => ({
            _id: r._id,
            referenceNo: r.referenceNo,
            userName: r.citizen
              ? `${r.citizen.firstName || ''} ${r.citizen.lastName || ''}`.trim()
              : 'Citizen',
            userPhone: r.citizen?.contactNo || r.citizen?.contactNumber || r.contactNo || 'N/A',
            userAddress: r.address || r.citizen?.streetAddress || 'N/A',
            requestDetails: `Water Tanker — ${r.notes || 'Standard Delivery'}`,
            status: r.status,
            type: 'water_tanker',
            department: 'Water Supply and Drainage Department',
            rating: r.rating,
            createdAt: r.createdAt,
          }));
        } catch {
          allRequests = [];
        }
      }
    }

    // STRICT ISOLATION: Sanitation Department officers ONLY see Sanitation requests
    if (isSanitation) {
      let garbageRequests = [];

      if (GarbageBooking.db?.readyState === 1) {
        try {
          const garbageBookings = await GarbageBooking.find({
            $or: [
              { routedDepartment: { $regex: /sanitation/i } },
              { routedDepartment: null },
              { routedDepartment: { $exists: false } },
            ],
          })
            .populate('user', 'firstName lastName streetAddress contactNo contactNumber')
            .sort({ createdAt: -1 })
            .lean();

          garbageRequests = garbageBookings.map((b) => ({
            _id: b._id,
            referenceNo: b.bookingId,
            userName: b.user
              ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim()
              : b.pickupAddress?.fullName || 'Citizen',
            userPhone: b.pickupAddress?.contactNo || b.user?.contactNo || b.user?.contactNumber || 'N/A',
            userAddress: b.pickupAddress?.streetAddress || b.user?.streetAddress || 'N/A',
            requestDetails: `Garbage Van — ${b.wasteLabels?.join(', ') || b.wasteLabel || 'Solid Waste'} | ${b.volume} | ${b.timeSlot}`,
            status: b.status,
            type: 'garbage_booking',
            department: 'Sanitation Department',
            rating: b.rating,
            createdAt: b.createdAt,
          }));
        } catch {
          garbageRequests = [];
        }
      }

      // Also check if any ServiceRequest of type garbage_van exists
      if (ServiceRequest.db?.readyState === 1) {
        try {
          const gServiceReqs = await ServiceRequest.find({
            type: 'garbage_van',
          })
            .populate('citizen', 'firstName lastName streetAddress contactNo contactNumber')
            .sort({ createdAt: -1 })
            .lean();

          const formattedGSR = gServiceReqs.map((r) => ({
            _id: r._id,
            referenceNo: r.referenceNo,
            userName: r.citizen
              ? `${r.citizen.firstName || ''} ${r.citizen.lastName || ''}`.trim()
              : 'Citizen',
            userPhone: r.citizen?.contactNo || r.citizen?.contactNumber || 'N/A',
            userAddress: r.address || r.citizen?.streetAddress || 'N/A',
            requestDetails: `Garbage Van — ${r.notes || 'Pickup Service'}`,
            status: r.status,
            type: 'garbage_van',
            department: 'Sanitation Department',
            rating: r.rating,
            createdAt: r.createdAt,
          }));
          garbageRequests = [...garbageRequests, ...formattedGSR];
        } catch {
          // ignore
        }
      }

      allRequests = garbageRequests;
    }

    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ success: true, requests: allRequests });
  } catch (err) {
    next(err);
  }
}

/**
 * Accept a request — transitions status from "request_submitted" to "request_accepted".
 * Fires a mock notification alert to the end-user.
 *
 * Body: { requestId, type }
 *   type: 'service_request' | 'garbage_booking'
 */
export async function acceptRequest(req, res, next) {
  try {
    const { requestId, type } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' });
    }

    let updated;

    if (type === 'garbage_booking') {
      if (GarbageBooking.db?.readyState === 1) {
        updated = await GarbageBooking.findByIdAndUpdate(
          requestId,
          { status: 'Request Accepted.arriving shortly' },
          { new: true }
        );
      }
    } else {
      if (ServiceRequest.db?.readyState === 1) {
        updated = await ServiceRequest.findByIdAndUpdate(
          requestId,
          { status: 'Request Accepted.arriving shortly' },
          { new: true }
        );
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // ── Mock notification alert to end-user ──
    const mockNotification = {
      type: 'push_notification',
      recipient: updated.citizen || updated.user,
      title: 'Request Accepted!',
      message: 'Your request has been accepted by the officer. Service arriving shortly.',
      status: 'Request Accepted.arriving shortly',
      timestamp: new Date().toISOString(),
    };

    console.log('[MOCK NOTIFICATION]', JSON.stringify(mockNotification, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Request accepted. Status updated to "Request Accepted.arriving shortly".',
      request: updated,
      notification: mockNotification,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a request as completed.
 *
 * Body: { requestId, type }
 */
export async function markComplete(req, res, next) {
  try {
    const { requestId, type } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' });
    }

    let updated;

    if (type === 'garbage_booking') {
      if (GarbageBooking.db?.readyState === 1) {
        updated = await GarbageBooking.findByIdAndUpdate(
          requestId,
          { status: 'Completed' },
          { new: true }
        );
      }
    } else {
      if (ServiceRequest.db?.readyState === 1) {
        updated = await ServiceRequest.findByIdAndUpdate(
          requestId,
          { status: 'Completed' },
          { new: true }
        );
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Request marked as completed.',
      request: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit a rating for a completed request (user-side).
 *
 * Body: { requestId, type, rating }
 */
export async function submitRating(req, res, next) {
  try {
    const { requestId, type, rating } = req.body;

    if (!requestId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid request ID and rating (1-5) required.' });
    }

    let updated;

    if (type === 'garbage_booking') {
      if (GarbageBooking.db?.readyState === 1) {
        updated = await GarbageBooking.findByIdAndUpdate(
          requestId,
          { rating },
          { new: true }
        );
      }
    } else {
      if (ServiceRequest.db?.readyState === 1) {
        updated = await ServiceRequest.findByIdAndUpdate(
          requestId,
          { rating },
          { new: true }
        );
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Rating submitted. Thank you for your feedback!',
      request: updated,
    });
  } catch (err) {
    next(err);
  }
}
