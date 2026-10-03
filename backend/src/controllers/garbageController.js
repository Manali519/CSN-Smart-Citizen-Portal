import crypto from 'crypto';
import { GarbageBooking } from '../models/GarbageBooking.js';
import { generateReferenceNo } from '../utils/reference.js';

export async function createGarbageBooking(req, res, next) {
  try {
    const { wasteType, wasteTypes, wasteLabel, wasteLabels, volume, pickupAddress, pickupDate, timeSlot, notes = '' } = req.body;

    // Several categories may be selected; otherwise fall back to the single required wasteType.
    const types = Array.isArray(wasteTypes) && wasteTypes.length > 0 ? wasteTypes : [wasteType];
    const labels = Array.isArray(wasteLabels) && wasteLabels.length > 0 ? wasteLabels : [wasteLabel || wasteType];

    const booking = await GarbageBooking.create({
      bookingId: generateReferenceNo('GV'),
      user: req.user._id,
      wasteType: types[0],
      wasteTypes: types,
      wasteLabel: labels.join(', '),
      wasteLabels: labels,
      volume,
      pickupAddress: {
        fullName: pickupAddress.fullName,
        contactNo: pickupAddress.contactNo,
        streetAddress: pickupAddress.streetAddress,
        ward: pickupAddress.ward || undefined,
      },
      pickupDate,
      timeSlot,
      notes,
      status: 'request_submitted',
      routedDepartment: 'Sanitation Department',
      assignedVan: { vanNumber: `MH-20-GV-${crypto.randomInt(1000, 10000)}` },
    });

    return res.status(201).json({
      success: true,
      message: 'Garbage van pickup scheduled successfully!',
      booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyGarbageBookings(req, res, next) {
  try {
    const bookings = await GarbageBooking.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}
