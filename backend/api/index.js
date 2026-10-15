// Vercel Function entry point: every request is rewritten here (backend/vercel.json) and handled by the Express app.
// The MongoDB connection is opened on the first request and reused while the instance stays warm.
// The app is imported lazily so a missing environment variable answers with a clear error instead of crashing
// the function (FUNCTION_INVOCATION_FAILED) with no explanation.

let loading = null;

function loadApp() {
  loading ??= Promise.all([import('../src/app.js'), import('../src/config/db.js')])
    .then(([{ createApp }, db]) => ({ app: createApp(), connectDB: db.connectDB }))
    .catch((err) => {
      loading = null; // retry on the next request (e.g. after the variables are fixed and the function restarts)
      throw err;
    });
  return loading;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  let app, connectDB;
  try {
    ({ app, connectDB } = await loadApp());
  } catch (err) {
    console.error('[startup] Backend configuration error:', err.message);
    return sendJson(res, 500, { success: false, message: 'Server is not configured. Please try again later.' });
  }

  // The health check reports the database state (see /api/health) but still answers while MongoDB is unreachable.
  if (req.url === '/api/health' || req.url.startsWith('/api/health?')) {
    await connectDB().catch(() => {});
    return app(req, res);
  }

  try {
    await connectDB();
  } catch {
    // The cause and the fix are logged by connectDB (Vercel -> backend project -> Logs).
    return sendJson(res, 503, { success: false, message: 'Service temporarily unavailable. Please try again.' });
  }
  return app(req, res);
}
