import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-city-test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

const { requireAuth } = await import('../src/middleware/requireAuth.js');
const { signSessionToken } = await import('../src/utils/token.js');
const { User } = await import('../src/models/User.js');

test('requireAuth rejects expired or unavailable database sessions', async () => {
  const previousDb = User.db;
  User.db = { readyState: 0 };

  const req = {
    cookies: {
      session: signSessionToken({
        _id: '507f1f77bcf86cd799439011',
        email: 'citizen@example.com',
      }),
    },
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 503);
  assert.equal(nextCalled, false);
  assert.match(res.body.message, /temporarily unavailable/i);

  User.db = previousDb;
});
