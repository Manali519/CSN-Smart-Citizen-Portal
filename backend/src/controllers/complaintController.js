import mongoose from 'mongoose';
import { Complaint, COMPLAINT_STATUSES, OFFICER_OPEN_STATUSES } from '../models/Complaint.js';
import { COMPLAINT_CATEGORIES, departmentFor } from '../config/complaintCategories.js';
import { complaintConfig as cfg } from '../config/complaint.config.js';
import { validateComplaint } from '../utils/gemini.js';
import { cleanPhoto, processComplaintPhoto } from '../utils/photo.js';
import { gpsFromExif, isValidPoint, inCity, toNum } from '../utils/location.js';
import { generateReferenceNo } from '../utils/reference.js';
import { saveImage, removeImage } from '../utils/imageStore.js';
import { sniffImageType } from '../middleware/upload.js';
import { hashBands, hammingDistance } from '../utils/phash.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// Past this many complaints in 24h nothing more is stored at all (protects disk/DB from abuse).
const HARD_DAILY_LIMIT = cfg.dailyLimit * 2;
// Admins only handle complaints the automatic checks held back; verified ones belong to officers.
const ADMIN_STATUSES = ['Suspected Fake', 'Rejected'];
// Internal scoring fields are never shown to citizens.
const CITIZEN_HIDDEN_FIELDS = '-imageHash -imageHashBands -imageScore -textScore -fusionScore -aiReason -flags -reviewedBy';

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, code, message, ...extra });

async function isDuplicateImage(phash) {
  const candidates = await Complaint.find({ imageHashBands: { $in: hashBands(phash) } })
    .select('imageHash')
    .limit(500)
    .lean();
  return candidates.some((k) => hammingDistance(k.imageHash, phash) <= cfg.dupHammingMax);
}

const withCategoryLabel = (c) => ({ ...c, categoryLabel: departmentFor(c.category) });

/** Public list of complaint categories (category -> department). */
export function listCategories(_req, res) {
  res.json({
    success: true,
    categories: COMPLAINT_CATEGORIES.map(({ key, department, hint }) => ({ key, label: department, hint })),
  });
}

/**
 * Citizen registers a complaint (multipart: image, category, description, lat?, lng?, locationSource?).
 * Pipeline: location (EXIF -> browser GPS / map pin) -> geofence -> daily rate limit ->
 * AI validation (Gemini) -> duplicate check -> route to department or hold for admin review.
 */
export async function createComplaint(req, res, next) {
  let savedKey = null;
  try {
    const { file } = req;
    const category = String(req.body.category || '');
    const description = String(req.body.description || '').trim();
    const department = departmentFor(category);

    if (!department) return fail(res, 400, 'BAD_CATEGORY', 'Please choose a valid category.');
    if (description.length < 10 || description.length > 1000) {
      return fail(res, 400, 'BAD_TEXT', 'Description must be 10 to 1000 characters.');
    }
    if (!file) return fail(res, 400, 'NO_IMAGE', 'A photo of the problem is required.');
    if (!sniffImageType(file.buffer)) {
      return fail(res, 400, 'BAD_IMAGE', 'The uploaded file is not a valid JPEG, PNG or WebP image.');
    }
    let photo;
    try {
      photo = await processComplaintPhoto(file.buffer);
    } catch {
      return fail(res, 400, 'BAD_IMAGE', 'The uploaded file is not a valid image.');
    }

    // 1. Location: photo EXIF GPS (read from the original upload) -> browser GPS / manual map pin -> ask to pin it
    let loc = await gpsFromExif(file.buffer);
    let source = 'exif';
    if (!isValidPoint(loc)) {
      loc = { lat: toNum(req.body.lat), lng: toNum(req.body.lng) };
      source = req.body.locationSource === 'manual' ? 'manual' : 'gps';
    }
    if (!isValidPoint(loc)) {
      return fail(res, 422, 'LOCATION_REQUIRED', 'We could not detect the location. Please pin it on the map.');
    }

    // 2. Geofence
    if (!inCity(loc)) {
      return fail(
        res,
        422,
        'OUT_OF_CITY',
        source === 'exif'
          ? 'This photo was taken outside the city limits. Please upload a photo taken at the problem location.'
          : 'The location is outside the city limits. Please pin the problem location on the map.',
        { source }
      );
    }

    // 3. Daily rate limit (DB-backed so it survives restarts). Over the limit -> held as spam.
    const recent = await Complaint.countDocuments({ user: req.user._id, createdAt: { $gte: new Date(Date.now() - DAY_MS) } });
    if (recent >= HARD_DAILY_LIMIT) {
      return fail(res, 429, 'RATE_LIMITED', 'Daily complaint limit reached. Please try again tomorrow.');
    }

    const flags = [];
    let result = null;
    if (recent >= cfg.dailyLimit) {
      flags.push('rate_limited');
    } else {
      // 4. AI validation (Gemini). If it is unavailable the complaint goes to the admin queue instead of being lost.
      try {
        result = await validateComplaint({ photo: photo.preview, text: description, category });
      } catch (err) {
        console.error('[complaints] AI validation unavailable:', err.message);
        flags.push('ml_unavailable');
      }

      if (result) {
        if (!result.image_match) flags.push('image_mismatch');
        if (!result.text_match) flags.push('text_mismatch');
        if (!result.valid && result.image_match && result.text_match) flags.push('low_confidence');
      }
    }

    // 5. Duplicate photo (perceptual hash, computed locally so it runs even without the AI check)
    if (await isDuplicateImage(photo.phash)) flags.push('duplicate_image');

    // 6./7. Decision: all checks passed -> routed to the department, otherwise -> admin queue
    const routed = flags.length === 0;
    const status = routed ? 'Pending Review' : 'Suspected Fake';

    const image = await saveImage(photo.stored, 'image/jpeg', 'complaints');
    savedKey = image.key;

    const complaint = await Complaint.create({
      complaintCode: generateReferenceNo('CMP'),
      user: req.user._id,
      category,
      department: routed ? department : null,
      description,
      imageUrl: image.url,
      imageHash: photo.phash,
      imageHashBands: hashBands(photo.phash),
      location: { type: 'Point', coordinates: [loc.lng, loc.lat] },
      locationSource: source,
      imageScore: result?.image_score,
      textScore: result?.text_score,
      fusionScore: result?.fusion_score,
      aiReason: result?.reason || undefined,
      flags,
      status,
      statusHistory: [
        {
          status,
          changedBy: req.user._id,
          changedByModel: 'User',
          remarks: routed ? `Auto-routed to ${department}` : `Held for admin review (${flags.join(', ')})`,
        },
      ],
    });
    savedKey = null;

    const view = {
      _id: complaint._id,
      complaintCode: complaint.complaintCode,
      category,
      categoryLabel: department,
      department: complaint.department,
      status,
      createdAt: complaint.createdAt,
    };

    if (flags.includes('rate_limited')) {
      return fail(
        res,
        429,
        'RATE_LIMITED',
        `You have reached the limit of ${cfg.dailyLimit} complaints in 24 hours. Complaint ${complaint.complaintCode} has been held for admin review.`,
        { complaint: view }
      );
    }

    return res.status(201).json({
      success: true,
      message: routed
        ? `Complaint ${complaint.complaintCode} registered and routed to ${department}.`
        : `Complaint ${complaint.complaintCode} registered and sent for verification by an administrator.`,
      complaint: view,
    });
  } catch (err) {
    await removeImage(savedKey);
    next(err);
  }
}

/** The logged-in citizen's own complaints, optionally filtered by status. */
export async function listMyComplaints(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (COMPLAINT_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .select(`${CITIZEN_HIDDEN_FIELDS} -statusHistory`)
      .lean();

    return res.status(200).json({ success: true, complaints: complaints.map(withCategoryLabel) });
  } catch (err) {
    next(err);
  }
}

/** Officer: complaints routed to their department. Admin: complaints held for review or rejected. */
export async function listComplaintQueue(req, res, next) {
  try {
    const { role, department } = req.staff;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const filter = {};
    if (role === 'officer') {
      if (!department) return fail(res, 403, 'NO_DEPARTMENT', 'Your account is not linked to a complaint department.');
      filter.department = department; // held complaints have department=null, so officers never see them
      if (COMPLAINT_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    } else {
      filter.status = ADMIN_STATUSES.includes(req.query.status) ? req.query.status : { $in: ADMIN_STATUSES };
    }

    const [items, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-imageHash -imageHashBands -statusHistory')
        .populate('user', 'firstName lastName contactNo')
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return res.json({ success: true, items: items.map(withCategoryLabel), total, page });
  } catch (err) {
    next(err);
  }
}

/** Admin approves (routes to the department) or rejects a complaint held for review. */
export async function reviewComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    if (!mongoose.isValidObjectId(id)) return fail(res, 400, 'BAD_ID', 'Invalid complaint id.');
    if (!['approve', 'reject'].includes(decision)) {
      return fail(res, 400, 'BAD_DECISION', 'Decision must be "approve" or "reject".');
    }

    const held = await Complaint.findOne({ _id: id, status: 'Suspected Fake' }).select('category').lean();
    if (!held) return fail(res, 404, 'NOT_FOUND', 'No complaint awaiting review with that id.');

    const approved = decision === 'approve';
    const department = approved ? departmentFor(held.category) : null;
    const status = approved ? 'Pending Review' : 'Rejected';

    // Conditional update: if another admin already decided, this matches nothing instead of overwriting.
    const complaint = await Complaint.findOneAndUpdate(
      { _id: id, status: 'Suspected Fake' },
      {
        $set: { status, department, reviewedBy: req.staff.id },
        $push: {
          statusHistory: {
            status,
            changedBy: req.staff.id,
            changedByModel: 'Admin',
            remarks: approved ? `Approved by admin, routed to ${department}` : 'Rejected by admin',
          },
        },
      },
      { new: true }
    );
    if (!complaint) return fail(res, 409, 'ALREADY_REVIEWED', 'This complaint has already been reviewed.');

    return res.json({ success: true, id: complaint._id, status: complaint.status, department: complaint.department });
  } catch (err) {
    next(err);
  }
}

/**
 * Officer marks a complaint of their department as complete.
 * Multipart: remarks (required, 10-1000 chars, shown to the citizen) and proof (required photo of the fixed issue).
 */
export async function resolveComplaint(req, res, next) {
  let savedKey = null;
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 400, 'BAD_ID', 'Invalid complaint id.');

    const remarks = String(req.body.remarks || '').trim();
    if (remarks.length < 10 || remarks.length > 1000) {
      return fail(res, 400, 'BAD_TEXT', 'Describe the resolution in 10 to 1000 characters.');
    }
    if (!req.file) return fail(res, 400, 'NO_IMAGE', 'A photo of the resolved issue is required.');
    if (!sniffImageType(req.file.buffer)) {
      return fail(res, 400, 'BAD_IMAGE', 'The proof file is not a valid JPEG, PNG or WebP image.');
    }
    let proofPhoto;
    try {
      proofPhoto = await cleanPhoto(req.file.buffer);
    } catch {
      return fail(res, 400, 'BAD_IMAGE', 'The proof file is not a valid image.');
    }

    const proof = await saveImage(proofPhoto, 'image/jpeg', 'complaint-proofs');
    savedKey = proof.key;

    // Conditional update: a complaint is resolved once, and only by its own department.
    const complaint = await Complaint.findOneAndUpdate(
      { _id: id, department: req.staff.department, status: { $in: OFFICER_OPEN_STATUSES } },
      {
        $set: {
          status: 'Resolved',
          'resolution.resolvedAt': new Date(),
          'resolution.solutionGiven': remarks,
        },
        $push: {
          statusHistory: {
            status: 'Resolved',
            changedByModel: 'Officer',
            remarks: `Marked complete by officer ${req.staff.id}: ${remarks}`,
          },
          'resolution.afterPhotos': proof.url,
        },
      },
      { new: true }
    );
    if (!complaint) {
      await removeImage(savedKey);
      return fail(res, 404, 'NOT_FOUND', 'No open complaint with that id in your department.');
    }
    savedKey = null;

    return res.json({ success: true, id: complaint._id, status: complaint.status, resolution: complaint.resolution });
  } catch (err) {
    await removeImage(savedKey);
    next(err);
  }
}

/** Citizen rates the resolution of their own resolved complaint, which closes the complaint. */
export async function submitComplaintFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!mongoose.isValidObjectId(id)) return fail(res, 400, 'BAD_ID', 'Invalid complaint id.');

    // Conditional update: only the owner, only once resolved, and only once.
    const complaint = await Complaint.findOneAndUpdate(
      { _id: id, user: req.user._id, status: 'Resolved', 'userFeedback.rating': { $exists: false } },
      {
        $set: {
          status: 'Closed',
          'userFeedback.rating': Number(rating),
          'userFeedback.comment': comment,
          'userFeedback.respondedAt': new Date(),
        },
        $push: {
          statusHistory: {
            status: 'Closed',
            changedBy: req.user._id,
            changedByModel: 'User',
            remarks: `Citizen rated the resolution ${Number(rating)}/5`,
          },
        },
      },
      { new: true }
    );
    if (!complaint) {
      return fail(res, 409, 'CANNOT_RATE', 'Only your resolved complaints that are not rated yet can be rated.');
    }

    return res.status(200).json({
      success: true,
      message: 'Thanks for the feedback! Your complaint is now closed.',
      complaint: { _id: complaint._id, status: complaint.status, userFeedback: complaint.userFeedback },
    });
  } catch (err) {
    next(err);
  }
}

/** Public heatmap feed: coordinates, status and category only - no photos, text or citizen details. */
export async function listPublicComplaintMap(_req, res, next) {
  try {
    const items = await Complaint.find({ status: { $nin: ADMIN_STATUSES }, location: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(1000)
      .select('location status category createdAt -_id')
      .lean();
    return res.json({ success: true, items: items.map(withCategoryLabel) });
  } catch (err) {
    next(err);
  }
}
