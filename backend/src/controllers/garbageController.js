import { GarbageBooking } from '../models/GarbageBooking.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { generateReferenceNo } from '../utils/reference.js';

export async function createGarbageBooking(req, res, next) {
  try {
    const {
      wasteType,
      wasteTypes,
      wasteLabel,
      wasteLabels,
      volume,
      pickupAddress,
      pickupDate,
      timeSlot,
      notes,
    } = req.body;

    const bookingId = `GV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Multi-category: prefer arrays, fall back to singular values
    const resolvedTypes = Array.isArray(wasteTypes) && wasteTypes.length > 0
      ? wasteTypes
      : [wasteType || 'dry'];
    const resolvedLabels = Array.isArray(wasteLabels) && wasteLabels.length > 0
      ? wasteLabels
      : [wasteLabel || 'Dry Recyclable Waste'];

    let booking;
    const bookingData = {
      bookingId,
      user: req.user._id,
      wasteType: resolvedTypes[0],
      wasteTypes: resolvedTypes,
      wasteLabel: resolvedLabels.join(', '),
      wasteLabels: resolvedLabels,
      volume: volume || '1-2 Bins',
      pickupAddress: {
        fullName: pickupAddress?.fullName || `${req.user.firstName || 'Citizen'} ${req.user.lastName || ''}`.trim(),
        contactNo: pickupAddress?.contactNo || req.user.contactNo || '9876543210',
        streetAddress: pickupAddress?.streetAddress || req.user.streetAddress || 'Chhatrapati Sambhajinagar',
        ward: pickupAddress?.ward || 'Ward 4 - CIDCO',
        city: 'Chhatrapati Sambhajinagar',
      },
      pickupDate: pickupDate || new Date(),
      timeSlot: timeSlot || 'Morning 07:00 AM - 09:00 AM',
      notes: notes || '',
      status: 'request_submitted',
      routedDepartment: 'Sanitation Department',
      assignedVan: {
        vanNumber: `MH-20-GV-${Math.floor(1000 + Math.random() * 9000)}`,
        driverName: 'Santosh Gaikwad',
        driverPhone: '+91 94220 12345',
      },
      createdAt: new Date(),
    };

    if (GarbageBooking.db?.readyState === 1) {
      try {
        booking = await GarbageBooking.create(bookingData);
        await ServiceRequest.create({
          citizen: req.user._id,
          referenceNo: generateReferenceNo('GV'),
          type: 'garbage_van',
          address: booking.pickupAddress.streetAddress,
          preferredDate: booking.pickupDate,
          notes: `Garbage Van (${resolvedLabels.join(', ')}) - ${volume} | Booking: ${bookingId}`,
          status: 'request_submitted',
          routedDepartment: 'Sanitation Department',
        }).catch(() => {});
      } catch {
        booking = { ...bookingData, _id: `mem_gv_${Date.now()}` };
        inMemoryGarbageBookings.unshift(booking);
      }
    } else {
      booking = { ...bookingData, _id: `mem_gv_${Date.now()}` };
      inMemoryGarbageBookings.unshift(booking);
    }

    return res.status(201).json({
      success: true,
      message: 'Garbage van pickup scheduled successfully!',
      booking,
    });
  } catch (err) {
    next(err);
  }
}

const inMemoryGarbageBookings = [];

export async function getMyGarbageBookings(req, res, next) {
  try {
    let bookings = [];
    if (GarbageBooking.db?.readyState === 1) {
      try {
        bookings = await GarbageBooking.find({ user: req.user._id }).sort({ createdAt: -1 });
      } catch {
        bookings = inMemoryGarbageBookings.filter((b) => String(b.user) === String(req.user._id));
      }
    } else {
      bookings = inMemoryGarbageBookings.filter((b) => String(b.user) === String(req.user._id));
    }
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}

