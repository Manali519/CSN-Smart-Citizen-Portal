import { ServiceRequest } from '../models/ServiceRequest.js';
import { generateReferenceNo } from '../utils/reference.js';

/** Department routing map: maps request type to the handling department */
const DEPARTMENT_ROUTING = {
  water_tanker: 'Water Supply and Drainage Department',
  garbage_van: 'Sanitation Department',
};

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

    const routedDepartment = DEPARTMENT_ROUTING[type] || null;

    const request = await ServiceRequest.create({
      citizen: req.user._id,
      referenceNo: generateReferenceNo('REQ'),
      type,
      address,
      preferredDate,
      notes,
      status: 'request_submitted',
      routedDepartment,
    });

    return res.status(201).json({ success: true, message: 'Request submitted.', request });
  } catch (err) {
    next(err);
  }
}

