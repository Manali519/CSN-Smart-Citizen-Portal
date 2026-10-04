/**
 * Complaint category -> department routing table (single source of truth on the Node side).
 * Keys must match the category keys in ./complaintPhrases.js.
 */
export const COMPLAINT_CATEGORIES = [
  { key: 'water', department: 'Water Supply and Drainage Department', hint: 'Pipe leaks, no water supply, blocked drains, sewage overflow' },
  { key: 'sanitation', department: 'Sanitation Department', hint: 'Uncollected garbage, overflowing bins, dirty toilets' },
  { key: 'administration', department: 'General Administration & Grievances', hint: 'Certificates, property tax, staff behaviour, pending applications' },
  { key: 'roads', department: 'Roads, Bridges & Infrastructure', hint: 'Potholes, broken roads, damaged bridges or footpaths' },
  { key: 'electrical', department: 'Electrical & Street Lighting', hint: 'Dead streetlights, hanging wires, damaged poles' },
  { key: 'others', department: 'Others', hint: 'Any other civic issue' },
];

export const CATEGORY_KEYS = COMPLAINT_CATEGORIES.map((c) => c.key);
export const DEPARTMENTS = COMPLAINT_CATEGORIES.map((c) => c.department);

export function departmentFor(categoryKey) {
  return COMPLAINT_CATEGORIES.find((c) => c.key === categoryKey)?.department || null;
}

/**
 * Maps a free-form department name (e.g. from officer credentials in .env) to its canonical
 * form: exact case-insensitive match first, then a prefix match so a truncated name still resolves.
 */
export function canonicalDepartment(name) {
  const n = String(name || '').trim().toLowerCase();
  if (n.length < 3) return null;
  return (
    DEPARTMENTS.find((d) => d.toLowerCase() === n) ||
    DEPARTMENTS.find((d) => d.toLowerCase().startsWith(n)) ||
    null
  );
}
