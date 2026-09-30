/**
 * Verified Water Sources / Reservoir Hubs in Chhatrapati Sambhajinagar
 * Includes hydrological specs, water testing metrics (TDS, pH, Hardness),
 * fleet size, and base pricing per quantity tier.
 */
export const WATER_SOURCES = [
  {
    id: 'jayakwadi-hub',
    name: 'Jayakwadi Dam Reservoir Hub',
    shortName: 'Jayakwadi Reservoir',
    type: 'Dam Reservoir',
    rating: 4.9,
    reviewsCount: 1840,
    distanceKm: 4.2,
    etaMinutes: 28,
    locationName: 'Paithan Feeder Canal Rd, South CSMC Zone',
    coordinates: { lat: 19.8350, lng: 75.3120 },
    waterQuality: {
      grade: 'potable_ro',
      label: 'Ultra-Pure RO + UV Mineral Enriched',
      tds: 92,
      ph: 7.2,
      hardness: '65 mg/L (Soft)',
      chlorine: '0.2 ppm (Safe)',
      certification: 'BIS IS 10500:2012 Certified',
      labReportDate: 'Today, 06:00 AM',
      labCertNo: 'CSMC-WTR-2026-9812',
    },
    tankerFleet: [
      { capacity: 1000, price: 449, type: 'Mini Tanker' },
      { capacity: 2000, price: 799, type: 'Standard Tanker' },
      { capacity: 5000, price: 1499, type: 'Family / Society Tanker' },
      { capacity: 10000, price: 2699, type: 'Heavy Multi-Axle Tanker' },
      { capacity: 20000, price: 4899, type: 'Bulk Industrial Tanker' },
    ],
    availableTankers: 9,
    tags: ['Drinking Water', 'CSMC Approved', 'Highest Purity', 'Best Seller'],
    badge: 'Municipal Grade A',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
    description: 'Direct from Jayakwadi Dam high-tech filtration works. Multi-stage sand filtration, activated carbon, and UV sterilisation for pure drinking water.',
  },
  {
    id: 'harsul-station',
    name: 'Harsul Lake Filtration Station',
    shortName: 'Harsul Lake Plant',
    type: 'Lake & Natural Catchment',
    rating: 4.8,
    reviewsCount: 1250,
    distanceKm: 3.1,
    etaMinutes: 20,
    locationName: 'Harsul T-Point, North Sambhajinagar',
    coordinates: { lat: 19.9125, lng: 75.3340 },
    waterQuality: {
      grade: 'potable_ro',
      label: 'Filtered Potable & Cooking Grade',
      tds: 135,
      ph: 7.4,
      hardness: '90 mg/L',
      chlorine: '0.2 ppm',
      certification: 'CSMC Health Lab Certified',
      labReportDate: 'Today, 07:15 AM',
      labCertNo: 'CSMC-WTR-2026-8741',
    },
    tankerFleet: [
      { capacity: 1000, price: 420, type: 'Mini Tanker' },
      { capacity: 2000, price: 749, type: 'Standard Tanker' },
      { capacity: 5000, price: 1399, type: 'Family Tanker' },
      { capacity: 10000, price: 2549, type: 'Heavy Duty Tanker' },
    ],
    availableTankers: 6,
    tags: ['Fastest ETA', 'Potable', 'North CSMC Fast Delivery'],
    badge: 'Express Hub',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    description: 'Servicing North Chh. Sambhajinagar, CIDCO N-series and Harsul. Fast dispatch with automated level metering.',
  },
  {
    id: 'salim-ali-aquifer',
    name: 'Salim Ali Lake Eco-Purified Aquifer',
    shortName: 'Salim Ali Station',
    type: 'Municipal Aquifer',
    rating: 4.7,
    reviewsCount: 890,
    distanceKm: 2.4,
    etaMinutes: 18,
    locationName: 'Near Delhi Gate, Central Sambhajinagar',
    coordinates: { lat: 19.8940, lng: 75.3420 },
    waterQuality: {
      grade: 'domestic_utility',
      label: 'Eco-Treated Domestic & Kitchen Utility',
      tds: 210,
      ph: 7.3,
      hardness: '110 mg/L',
      chlorine: '0.3 ppm',
      certification: 'CSMC Utility Standard Pass',
      labReportDate: 'Today, 08:00 AM',
      labCertNo: 'CSMC-WTR-2026-6420',
    },
    tankerFleet: [
      { capacity: 1000, price: 380, type: 'Mini Tanker' },
      { capacity: 2000, price: 699, type: 'Standard Tanker' },
      { capacity: 5000, price: 1299, type: 'Domestic Tanker' },
      { capacity: 10000, price: 2399, type: 'Large Utility Tanker' },
    ],
    availableTankers: 5,
    tags: ['Domestic Utility', 'Central Hub', 'Budget Friendly'],
    badge: 'Eco Pure',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    description: 'Ideal for household chores, overhead tank refills, gardening and residential societies.',
  },
  {
    id: 'chikalthana-midc-yard',
    name: 'MIDC Chikalthana Industrial & Commercial Yard',
    shortName: 'Chikalthana Yard',
    type: 'Industrial Treatment Complex',
    rating: 4.8,
    reviewsCount: 640,
    distanceKm: 5.5,
    etaMinutes: 35,
    locationName: 'Jalna Road, MIDC Industrial Area, East CSMC',
    coordinates: { lat: 19.8820, lng: 75.3950 },
    waterQuality: {
      grade: 'construction_raw',
      label: 'Industrial & Construction Raw Water',
      tds: 380,
      ph: 7.6,
      hardness: '180 mg/L',
      chlorine: '0.1 ppm',
      certification: 'Industrial Grade Compliant',
      labReportDate: 'Today, 06:30 AM',
      labCertNo: 'CSMC-IND-2026-4411',
    },
    tankerFleet: [
      { capacity: 5000, price: 1199, type: 'Bulk Utility Tanker' },
      { capacity: 10000, price: 2199, type: 'Heavy Construction Tanker' },
      { capacity: 20000, price: 3999, type: 'Dual-Axle Mega Tanker' },
    ],
    availableTankers: 8,
    tags: ['Heavy Duty', 'Commercial & Construction', 'Bulk Supply'],
    badge: 'Bulk Specialist',
    imageUrl: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?w=600&auto=format&fit=crop&q=80',
    description: 'High capacity tankers equipped with high-pressure booster pumps for construction sites, commercial setups and bulk storage.',
  },
];

export const AVAILABLE_ADDONS = [
  { id: 'extra_hose', name: '50ft Extended Booster Hose Pipe', price: 99, description: 'Reach 3rd floor overhead tanks without pressure drop' },
  { id: 'express_dispatch', name: 'Express Priority Rush (Within 20 Mins)', price: 149, description: 'Direct queue-jump dispatch with dedicated traffic routing' },
  { id: 'tds_meter_test', name: 'Digital TDS & Purity Test on Arrival', price: 49, description: 'Driver tests TDS & pH in front of you using digital meter' },
];

export const DRIVER_FLEET = [
  {
    name: 'Ramesh Patil',
    phone: '+91 98230 45678',
    vehicleNo: 'MH-20-CZ-4412',
    vehicleModel: 'Tata LPK 10000L Stainless Steel Tanker',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Santosh Gaikwad',
    phone: '+91 94220 98765',
    vehicleNo: 'MH-20-DE-8821',
    vehicleModel: 'Ashok Leyland 5000L Ecomet Tanker',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ganesh Shinde',
    phone: '+91 98901 23456',
    vehicleNo: 'MH-20-EF-1109',
    vehicleModel: 'BharatBenz 20000L Multi-Axle Tanker',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

/**
 * Generates an interpolated GPS route with 20 road waypoints
 * between source reservoir and destination in Chhatrapati Sambhajinagar.
 */
export function generateRouteWaypoints(start, end, stepsCount = 20) {
  const waypoints = [];
  
  // Add some realistic road curvature jitter
  for (let i = 0; i <= stepsCount; i++) {
    const fraction = i / stepsCount;
    // Base linear interpolation
    let lat = start.lat + (end.lat - start.lat) * fraction;
    let lng = start.lng + (end.lng - start.lng) * fraction;

    // Add gentle sinusoidal road bends
    if (i > 0 && i < stepsCount) {
      const bend = Math.sin(fraction * Math.PI) * 0.004;
      lat += (i % 2 === 0 ? bend : -bend * 0.5);
      lng += (i % 3 === 0 ? bend * 0.7 : -bend * 0.3);
    }

    waypoints.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    });
  }

  return waypoints;
}
