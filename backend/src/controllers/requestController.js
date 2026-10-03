import { ServiceRequest } from '../models/ServiceRequest.js';

/** Lists the logged-in citizen's own service requests, newest first. */
export async function listMyRequests(req, res, next) {
  try {
    const requests = await ServiceRequest.find({ citizen: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
}
