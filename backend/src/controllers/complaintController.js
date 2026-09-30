import { Complaint } from '../models/Complaint.js';

/**
 * Lists the logged-in citizen's own complaints, optionally filtered by
 * status. This only ever queries by req.user._id (set by requireAuth),
 * so one citizen can never see another citizen's complaints.
 */
export async function listMyComplaints(req, res, next) {
  try {
    const { status } = req.query; // 'pending' | 'in-progress' | 'resolved' | undefined (= all)

    const filter = { $or: [{ citizen: req.user._id }, { user: req.user._id }] };
    if (status && ['pending', 'in-progress', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, complaints });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new civic complaint registered by the logged-in citizen.
 */
export async function createComplaint(req, res, next) {
  try {
    const { title, description, category, location } = req.body;
    const complaintCode = `SC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const complaint = await Complaint.create({
      complaintCode,
      user: req.user._id,
      title: title || `${category || 'Civic'} Issue`,
      description: description || '',
      location: {
        address: typeof location === 'string' ? location : location?.address || 'Chhatrapati Sambhajinagar',
        city: 'Chhatrapati Sambhajinagar',
      },
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          changedBy: req.user._id,
          changedByModel: 'User',
          remarks: 'Complaint lodged by citizen',
          changedAt: new Date(),
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: `Complaint registered successfully with reference ${complaintCode}.`,
      complaint,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Citizen submits feedback/rating on a resolved complaint - the final
 * step of the How-It-Works loop (officer submits proof -> citizen rates it).
 */
export async function submitComplaintFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const complaint = await Complaint.findOne({ _id: id, citizen: req.user._id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Feedback can only be left once a complaint is resolved.' });
    }

    complaint.feedback = { rating, comment, submittedAt: new Date() };
    await complaint.save();

    return res.status(200).json({ success: true, message: 'Thanks for the feedback!', complaint });
  } catch (err) {
    next(err);
  }
}
