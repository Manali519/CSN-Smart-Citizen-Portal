import { TankerBooking } from '../models/TankerBooking.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { WATER_SOURCES, WATER_GRADES, AVAILABLE_ADDONS, gradedPrice } from '../utils/tankerData.js';
import { generateReferenceNo } from '../utils/reference.js';

const SERVICE_FEE = 49;
const DELIVERY_FEE_PER_KM = 28;
const TAX_RATE = 0.05;

/** Water sources with their tanker fleets, the water grades with their pricing, plus optional add-ons. */
export function getWaterSources(_req, res) {
  res.status(200).json({ success: true, sources: WATER_SOURCES, grades: WATER_GRADES, addons: AVAILABLE_ADDONS });
}

/** Creates a water tanker booking. Prices are computed here, never taken from the client. */
export async function createTankerBooking(req, res, next) {
  try {
    const { sourceId, quantity, waterQualityGrade, selectedAddonIds = [], deliveryAddress, deliverySlot, paymentMethod } =
      req.body;

    const source = WATER_SOURCES.find((s) => s.id === sourceId);
    const fleetOption = source?.tankerFleet.find((f) => f.capacity === Number(quantity));
    if (!fleetOption) {
      return res.status(400).json({ success: false, message: 'The selected tanker size is not available at this source.' });
    }
    // Defaults to the source's own grade for older clients that do not send one.
    const grade = WATER_GRADES.find((g) => g.id === (waterQualityGrade || source.waterQuality.grade));
    if (!grade) return res.status(400).json({ success: false, message: 'Select a valid water quality grade.' });

    const addons = AVAILABLE_ADDONS.filter((a) => selectedAddonIds.includes(a.id));
    const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const basePrice = gradedPrice(fleetOption.price, grade);
    const deliveryFee = Math.round(source.distanceKm * DELIVERY_FEE_PER_KM);
    const taxes = Math.round((basePrice + addonsTotal + deliveryFee + SERVICE_FEE) * TAX_RATE);
    const totalAmount = basePrice + addonsTotal + deliveryFee + SERVICE_FEE + taxes;

    const { lat, lng } = deliveryAddress.coordinates || {};
    const bookingId = generateReferenceNo('WT');

    const booking = await TankerBooking.create({
      bookingId,
      user: req.user._id,
      waterSource: {
        id: source.id,
        name: source.name,
        locationName: source.locationName,
        reservoirType: source.type,
        coordinates: source.coordinates,
      },
      quantity: fleetOption.capacity,
      waterQuality: {
        grade: grade.id,
        label: grade.label,
        tds: source.waterQuality.tds,
        ph: source.waterQuality.ph,
        certification: source.waterQuality.certification,
      },
      addons: addons.map(({ id, name, price }) => ({ id, name, price })),
      pricing: {
        basePrice,
        addonsTotal,
        distanceKm: source.distanceKm,
        deliveryFee,
        serviceFee: SERVICE_FEE,
        taxes,
        totalAmount,
      },
      deliveryAddress: {
        fullName: deliveryAddress.fullName,
        contactNo: deliveryAddress.contactNo,
        streetAddress: deliveryAddress.streetAddress,
        landmark: deliveryAddress.landmark,
        ward: deliveryAddress.ward,
        pincode: deliveryAddress.pincode,
        coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
      },
      deliverySlot,
      // Payment is collected on delivery (cash) or through the payment gateway; never assumed paid here.
      payment: { method: paymentMethod, status: 'pending' },
    });

    // Mirror as a service request so the Water department sees it in the officer queue.
    await ServiceRequest.create({
      citizen: req.user._id,
      referenceNo: generateReferenceNo('WT'),
      type: 'water_tanker',
      address: booking.deliveryAddress.streetAddress,
      preferredDate: new Date(),
      notes: `Water Tanker ${booking.quantity}L from ${source.name} | Total: ₹${totalAmount} | Booking: ${bookingId}`,
      status: 'scheduled',
      routedDepartment: 'Water Supply and Drainage Department',
    }).catch((err) => console.error('[tanker] Could not create officer service request:', err.message));

    return res.status(201).json({ success: true, message: 'Water tanker booked successfully!', booking });
  } catch (err) {
    next(err);
  }
}

/** The logged-in citizen's water tanker bookings, newest first. */
export async function getMyTankerBookings(req, res, next) {
  try {
    const bookings = await TankerBooking.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}
