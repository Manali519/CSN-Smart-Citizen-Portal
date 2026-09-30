import { TankerBooking } from '../models/TankerBooking.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { WATER_SOURCES, AVAILABLE_ADDONS, DRIVER_FLEET, generateRouteWaypoints } from '../utils/tankerData.js';
import { generateReferenceNo } from '../utils/reference.js';

/**
 * Returns available water reservoir sources, purity metrics, and add-on options.
 */
export async function getWaterSources(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      sources: WATER_SOURCES,
      addons: AVAILABLE_ADDONS,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new water tanker booking (Zomato-style order placement).
 * Calculates trusted server-side pricing to prevent tampering.
 */
export async function createTankerBooking(req, res, next) {
  try {
    const {
      sourceId,
      quantity,
      waterQualityGrade,
      selectedAddonIds = [],
      deliveryAddress,
      deliverySlot = 'Immediate (25-35 mins)',
      paymentMethod = 'upi',
    } = req.body;

    // 1. Verify Water Source
    const source = WATER_SOURCES.find((s) => s.id === sourceId) || WATER_SOURCES[0];

    // 2. Verify Fleet Pricing
    const fleetOption = source.tankerFleet.find((f) => f.capacity === Number(quantity)) || source.tankerFleet[0];
    const actualQuantity = fleetOption.capacity;
    const basePrice = fleetOption.price;

    // 3. Calculate Addons
    const validAddons = AVAILABLE_ADDONS.filter((a) => selectedAddonIds.includes(a.id));
    const addonsTotal = validAddons.reduce((sum, a) => sum + a.price, 0);

    // 4. Calculate Fees & Taxes
    const distanceKm = source.distanceKm || 3.5;
    const deliveryFee = Math.round(distanceKm * 28);
    const serviceFee = 49;
    const taxes = Math.round((basePrice + addonsTotal + deliveryFee + serviceFee) * 0.05);
    const totalAmount = basePrice + addonsTotal + deliveryFee + serviceFee + taxes;

    // 5. Select Random Driver from Fleet
    const driverIndex = Math.floor(Math.random() * DRIVER_FLEET.length);
    const driver = DRIVER_FLEET[driverIndex];

    // 6. Coordinates for Delivery
    const destCoords = deliveryAddress?.coordinates?.lat
      ? deliveryAddress.coordinates
      : { lat: 19.8762 + (Math.random() - 0.5) * 0.02, lng: 75.3433 + (Math.random() - 0.5) * 0.02 };

    const routeWaypoints = generateRouteWaypoints(source.coordinates, destCoords, 22);

    const bookingId = `WT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let booking;
    const bookingData = {
      bookingId,
      user: req.user._id,
      waterSource: {
        id: source.id,
        name: source.name,
        locationName: source.locationName,
        reservoirType: source.type,
        coordinates: source.coordinates,
      },
      quantity: actualQuantity,
      waterQuality: {
        grade: waterQualityGrade || source.waterQuality.grade,
        label: source.waterQuality.label,
        tds: source.waterQuality.tds,
        ph: source.waterQuality.ph,
        certification: source.waterQuality.certification,
      },
      addons: validAddons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      pricing: {
        basePrice,
        addonsTotal,
        distanceKm,
        deliveryFee,
        serviceFee,
        taxes,
        totalAmount,
      },
      deliveryAddress: {
        fullName: deliveryAddress?.fullName || `${req.user.firstName || 'Citizen'} ${req.user.lastName || ''}`.trim(),
        contactNo: deliveryAddress?.contactNo || req.user.contactNo || '9876543210',
        streetAddress: deliveryAddress?.streetAddress || req.user.streetAddress || 'Station Road, Sambhajinagar',
        landmark: deliveryAddress?.landmark || '',
        ward: deliveryAddress?.ward || 'Ward 3 - Central',
        city: 'Chhatrapati Sambhajinagar',
        pincode: deliveryAddress?.pincode || '431001',
        coordinates: destCoords,
      },
      deliverySlot,
      payment: {
        method: paymentMethod === 'cash' ? 'cash' : 'upi',
        status: paymentMethod === 'upi' ? 'completed' : 'pending',
        transactionId: paymentMethod === 'upi' ? `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        paidAt: paymentMethod === 'upi' ? new Date() : undefined,
      },
      status: 'confirmed',
      driver,
      tracking: {
        currentLocation: source.coordinates,
        startLocation: source.coordinates,
        destinationLocation: destCoords,
        routeCoordinates: routeWaypoints,
        currentStepIndex: 0,
        etaMinutes: source.etaMinutes || 25,
        speedKmh: 35,
        distanceRemainingKm: distanceKm,
      },
      statusTimeline: [
        {
          status: 'confirmed',
          title: 'Tanker Order Placed',
          description: `Tanker assigned: ${driver.vehicleNo} (${driver.name})`,
          timestamp: new Date(),
          completed: true,
        },
        {
          status: 'filling',
          title: 'Filling at Reservoir',
          description: `Quality testing & filling ${actualQuantity.toLocaleString()}L at ${source.shortName}`,
          timestamp: new Date(Date.now() + 2 * 60000),
          completed: false,
        },
        {
          status: 'on_the_way',
          title: 'Tanker Dispatched & On the Way',
          description: `Driver ${driver.name} is navigating towards your location`,
          timestamp: new Date(Date.now() + 7 * 60000),
          completed: false,
        },
        {
          status: 'arrived',
          title: 'Tanker Arrived at Gate',
          description: 'Connecting booster pipe and commencing transfer',
          timestamp: new Date(Date.now() + 25 * 60000),
          completed: false,
        },
        {
          status: 'completed',
          title: 'Water Delivery Completed',
          description: `${actualQuantity.toLocaleString()}L transferred successfully. Receipt generated.`,
          timestamp: new Date(Date.now() + 40 * 60000),
          completed: false,
        },
      ],
      createdAt: new Date(),
    };

    if (TankerBooking.db?.readyState === 1) {
      try {
        booking = await TankerBooking.create(bookingData);
        await ServiceRequest.create({
          citizen: req.user._id,
          referenceNo: generateReferenceNo('WT'),
          type: 'water_tanker',
          address: booking.deliveryAddress.streetAddress,
          preferredDate: new Date(),
          notes: `Water Tanker ${actualQuantity}L from ${source.name} | Total: ₹${totalAmount} | Booking: ${bookingId}`,
          status: 'scheduled',
        }).catch(() => {});
      } catch (err) {
        console.warn('[tanker] DB save error, using in-memory store:', err.message);
        booking = { ...bookingData, _id: `mem_${Date.now()}` };
        inMemoryTankerBookings.unshift(booking);
      }
    } else {
      booking = { ...bookingData, _id: `mem_${Date.now()}` };
      inMemoryTankerBookings.unshift(booking);
    }

    return res.status(201).json({
      success: true,
      message: 'Water tanker booked successfully!',
      booking,
    });
  } catch (err) {
    next(err);
  }
}

const inMemoryTankerBookings = [];

/**
 * Returns logged-in citizen's water tanker bookings.
 */
export async function getMyTankerBookings(req, res, next) {
  try {
    let bookings = [];
    if (TankerBooking.db?.readyState === 1) {
      try {
        bookings = await TankerBooking.find({ user: req.user._id }).sort({ createdAt: -1 });
      } catch {
        bookings = inMemoryTankerBookings.filter((b) => String(b.user) === String(req.user._id));
      }
    } else {
      bookings = inMemoryTankerBookings.filter((b) => String(b.user) === String(req.user._id));
    }
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns live tracking details with real-time GPS telemetry simulation.
 */
export async function getTankerTracking(req, res, next) {
  try {
    const { id } = req.params;

    let booking;
    const query = id.startsWith('WT-') ? { bookingId: id } : { _id: id };

    if (TankerBooking.db?.readyState === 1) {
      try {
        booking = await TankerBooking.findOne(query);
      } catch {
        booking = inMemoryTankerBookings.find((b) => b.bookingId === id || b._id === id);
      }
    } else {
      booking = inMemoryTankerBookings.find((b) => b.bookingId === id || b._id === id);
    }

    // If still not found, construct a demo booking so live tracking can always be previewed
    if (!booking) {
      const defaultSource = WATER_SOURCES[0];
      const destCoords = { lat: 19.8762, lng: 75.3433 };
      booking = {
        bookingId: id,
        _id: id,
        user: req.user._id,
        status: 'on_the_way',
        waterSource: defaultSource,
        quantity: 5000,
        waterQuality: defaultSource.waterQuality,
        deliveryAddress: {
          fullName: `${req.user?.firstName || 'Citizen'} ${req.user?.lastName || ''}`.trim(),
          contactNo: req.user?.contactNo || '9876543210',
          streetAddress: 'Plot 42, CIDCO Cannaught Place, Chhatrapati Sambhajinagar',
          ward: 'Ward 4 - CIDCO',
          coordinates: destCoords,
        },
        pricing: {
          basePrice: 1499,
          distanceKm: 3.5,
          deliveryFee: 150,
          taxes: 85,
          totalAmount: 1734,
        },
        payment: { method: 'upi', status: 'completed' },
        driver: DRIVER_FLEET[0],
        createdAt: new Date(Date.now() - 3 * 60000),
        tracking: {
          currentLocation: defaultSource.coordinates,
          startLocation: defaultSource.coordinates,
          destinationLocation: destCoords,
          routeCoordinates: generateRouteWaypoints(defaultSource.coordinates, destCoords, 22),
          currentStepIndex: 3,
          etaMinutes: 18,
          speedKmh: 34,
          distanceRemainingKm: 2.8,
        },
        statusTimeline: [
          { status: 'confirmed', title: 'Order Placed', completed: true },
          { status: 'filling', title: 'Filling at Reservoir', completed: true },
          { status: 'on_the_way', title: 'On the Way', completed: true },
          { status: 'arrived', title: 'Arrived at Gate', completed: false },
        ],
      };
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tanker booking not found.' });
    }

    // Security: Only the user who placed the booking (or admin) can view tracking
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
    }

    // Compute realistic dynamic progress based on time elapsed since booking
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 1000));
    const waypoints = booking.tracking.routeCoordinates || [];
    const totalWaypoints = waypoints.length;

    // Simulation timing:
    // 0 - 30 seconds: confirmed
    // 30s - 90s: filling
    // 90s - 300s: on_the_way (moving vehicle)
    // > 300s: arrived / completed
    let dynamicStatus = booking.status;
    let dynamicStepIndex = booking.tracking.currentStepIndex || 0;
    let dynamicEta = booking.tracking.etaMinutes;

    if (booking.status !== 'cancelled') {
      if (elapsedSeconds < 30) {
        dynamicStatus = 'confirmed';
        dynamicStepIndex = 0;
        dynamicEta = Math.max(1, (booking.waterSource.etaMinutes || 25) - Math.floor(elapsedSeconds / 60));
      } else if (elapsedSeconds < 90) {
        dynamicStatus = 'filling';
        dynamicStepIndex = 1;
        dynamicEta = Math.max(1, (booking.waterSource.etaMinutes || 25) - 2);
      } else if (elapsedSeconds < 360) {
        dynamicStatus = 'on_the_way';
        // Interpolate along waypoints
        const transitFraction = Math.min(1, (elapsedSeconds - 90) / 250);
        dynamicStepIndex = Math.min(totalWaypoints - 1, Math.floor(transitFraction * totalWaypoints));
        dynamicEta = Math.max(1, Math.ceil(20 * (1 - transitFraction)));
      } else {
        dynamicStatus = 'arrived';
        dynamicStepIndex = totalWaypoints > 0 ? totalWaypoints - 1 : 0;
        dynamicEta = 0;
      }
    }

    // Calculate moving location
    const currentLoc = waypoints[dynamicStepIndex] || booking.tracking.currentLocation;
    const distanceRem = Number((Math.max(0.2, (1 - dynamicStepIndex / (totalWaypoints || 1)) * booking.pricing.distanceKm)).toFixed(1));

    const responseData = {
      bookingId: booking.bookingId,
      _id: booking._id,
      status: dynamicStatus,
      waterSource: booking.waterSource,
      quantity: booking.quantity,
      waterQuality: booking.waterQuality,
      deliveryAddress: booking.deliveryAddress,
      pricing: booking.pricing,
      payment: booking.payment,
      driver: booking.driver,
      createdAt: booking.createdAt,
      tracking: {
        currentLocation: currentLoc,
        startLocation: booking.tracking.startLocation,
        destinationLocation: booking.tracking.destinationLocation,
        routeCoordinates: waypoints,
        currentStepIndex: dynamicStepIndex,
        totalSteps: totalWaypoints,
        etaMinutes: dynamicEta,
        speedKmh: dynamicStatus === 'on_the_way' ? 38 : 0,
        distanceRemainingKm: distanceRem,
      },
      statusTimeline: booking.statusTimeline.map((step, idx) => {
        let isDone = false;
        if (dynamicStatus === 'confirmed' && idx === 0) isDone = true;
        if (dynamicStatus === 'filling' && idx <= 1) isDone = true;
        if (dynamicStatus === 'on_the_way' && idx <= 2) isDone = true;
        if (dynamicStatus === 'arrived' && idx <= 3) isDone = true;
        if (dynamicStatus === 'completed') isDone = true;
        const stepData = typeof step.toObject === 'function' ? step.toObject() : { ...step };
        return {
          ...stepData,
          completed: isDone,
        };
      }),
    };

    return res.status(200).json({ success: true, tracking: responseData });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to manually advance or reset booking status (for demo / testing)
 */
export async function updateTankerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = id.startsWith('WT-') ? { bookingId: id } : { _id: id };
    const booking = await TankerBooking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (status) {
      booking.status = status;
      await booking.save();
    }

    return res.status(200).json({ success: true, message: 'Status updated.', booking });
  } catch (err) {
    next(err);
  }
}
