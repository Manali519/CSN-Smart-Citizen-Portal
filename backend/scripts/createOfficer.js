// Creates (or resets the password / department of) an officer account.
// Usage: npm run create-officer -- <officerId> <password> <department> [name]
// <department> is a key (water, sanitation, administration, roads, electrical, others) or the full name.
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { DB_OPTIONS } from '../src/config/db.js';
import { Officer } from '../src/models/Officer.js';
import { COMPLAINT_CATEGORIES, canonicalDepartment, departmentFor } from '../src/config/complaintCategories.js';

const [officerId, password, departmentArg, name] = process.argv.slice(2);
const department = departmentFor(departmentArg) || canonicalDepartment(departmentArg);

if (!officerId || !password || password.length < 8 || !department) {
  console.error('Usage: npm run create-officer -- <officerId> <password (min 8 chars)> <department> [name]');
  console.error('Departments:');
  for (const c of COMPLAINT_CATEGORIES) console.error(`  ${c.key.padEnd(15)} ${c.department}`);
  process.exit(1);
}

await mongoose.connect(env.mongodbUri, DB_OPTIONS);
try {
  // Drops indexes left over from older schemas (e.g. the unique employeeId index), which otherwise
  // reject every new officer with a duplicate-null key error.
  await Officer.syncIndexes();
  const officer = (await Officer.findOne({ officerId: officerId.toLowerCase() })) || new Officer({ officerId });
  const isNew = officer.isNew;
  officer.department = department;
  officer.password = password; // hashed by the pre-save hook
  officer.isActive = true;
  if (name) officer.name = name;
  await officer.save();
  console.log(`${isNew ? 'Created' : 'Updated'} officer ${officer.officerId} (${department})`);
} finally {
  await mongoose.disconnect();
}
