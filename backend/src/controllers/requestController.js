import { ServiceRequest } from '../models/ServiceRequest.js';
import { generateReferenceNo } from '../utils/reference.js';

/** Lists the logged-in citizen's own service requests, newest first. */
export async function listMyRequests(req, res, next) {
  try {
    const requests = await ServiceRequest.find({ citizen: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
}

/** Creates a new water tanker / garbage van request for the logged-in citizen. */
export async function createRequest(req, res, next) {
  try {
    const { type, address, preferredDate, notes } = req.body;

    const request = await ServiceRequest.create({
      citizen: req.user._id,
      referenceNo: generateReferenceNo('REQ'),
      type,
      address,
      preferredDate,
      notes,
    });

    return res.status(201).json({ success: true, message: 'Request submitted.', request });
  } catch (err) {
    next(err);
  }
}
