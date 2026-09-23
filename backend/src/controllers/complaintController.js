import { Complaint } from '../models/Complaint.js';

/**
 * Lists the logged-in citizen's own complaints, optionally filtered by
 * status. This only ever queries by req.user._id (set by requireAuth),
 * so one citizen can never see another citizen's complaints.
 */
export async function listMyComplaints(req, res, next) {
  try {
    const { status } = req.query; // 'pending' | 'in-progress' | 'resolved' | undefined (= all)

    const filter = { citizen: req.user._id };
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
