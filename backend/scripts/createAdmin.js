// Creates (or resets the password of) an admin account.
// Usage: npm run create-admin -- <email> <password> [name]
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { DB_OPTIONS } from '../src/config/db.js';
import { Admin } from '../src/models/Admin.js';

const [email, password, name = 'Administrator'] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage: npm run create-admin -- <email> <password (min 8 chars)> [name]');
  process.exit(1);
}

await mongoose.connect(env.mongodbUri, DB_OPTIONS);
try {
  const admin = (await Admin.findOne({ email: email.toLowerCase() })) || new Admin({ email });
  const isNew = admin.isNew;
  admin.name = name;
  admin.password = password; // hashed by the pre-save hook
  await admin.save();
  console.log(`${isNew ? 'Created' : 'Updated'} admin ${admin.email}`);
} finally {
  await mongoose.disconnect();
}
