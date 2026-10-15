import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchComplaintQueue, reviewComplaint, resolveComplaint } from '../services/complaints/index.js';
import { officerLogoutApi } from '../services/officer/index.js';
import { adminLogoutApi, fetchAdminProfile } from '../services/admin/index.js';
import { assetUrl, MAX_PHOTO_MB, photoTooLarge } from '../api/client.js';
import MapView from '../components/MapView.jsx';
import AdminStats from '../components/AdminStats.jsx';
import './ComplaintDashboard.css';

// Verified complaints are handled by officers only; admins see what the automatic checks held back.
const TABS = {
  officer: ['Pending Review', 'Resolved', 'Closed'],
  admin: ['Suspected Fake', 'Rejected'],
};

const OFFICER_OPEN_STATUSES = ['Pending Review', 'In Progress', 'Reopened'];

const FLAG_LABELS = {
  rate_limited: 'Over daily limit',
  ml_unavailable: 'AI check unavailable',
  image_mismatch: 'Photo does not match department',
  text_mismatch: 'Description does not match department',
  low_confidence: 'Low AI confidence',
  duplicate_image: 'Duplicate photo',
};

const LOCATION_SOURCES = { exif: 'photo GPS', gps: 'device GPS', manual: 'map pin' };

/** Officer display info saved at login (the session itself is the httpOnly cookie). */
function officerIdentity() {
  try {
    const session = JSON.parse(sessionStorage.getItem('officer_session'));
    return session && { name: session.department, subtitle: `Officer ID: ${session.officerId}` };
  } catch {
    return null;
  }
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

const MIN_REMARKS = 10;

/** Officer marks a complaint complete; a resolution description and a proof photo are both required. */
function ResolveForm({ complaint, onDone, onCancel }) {
  const [remarks, setRemarks] = useState('');
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (remarks.trim().length < MIN_REMARKS) {
      setError(`Describe the resolution in at least ${MIN_REMARKS} characters.`);
      return;
    }
    if (!proof) {
      setError('Upload a photo of the resolved issue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resolveComplaint(complaint._id, { remarks: remarks.trim(), proof });
      onDone(complaint._id);
    } catch (err) {
      setError(err.message || 'Could not mark the complaint as complete.');
      setBusy(false);
    }
  }

  return (
    <form className="cq-resolve" onSubmit={submit}>
      <label className="cq-field">
        <span>Resolution description (required, shown to the citizen)</span>
        <textarea
          rows={3}
          required
          minLength={MIN_REMARKS}
          maxLength={1000}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </label>
      <label className="cq-field">
        <span>Resolution photo (required)</span>
        <input
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files[0] || null;
            const tooLarge = photoTooLarge(file);
            setError(tooLarge ? `Proof photo must be ${MAX_PHOTO_MB} MB or smaller.` : '');
            if (tooLarge) e.target.value = '';
            setProof(tooLarge ? null : file);
          }}
        />
      </label>
      {error && <p className="cq-error" role="alert">{error}</p>}
      <div className="cq-resolve-actions">
        <button type="submit" className="cq-btn cq-approve" disabled={busy || !proof || remarks.trim().length < MIN_REMARKS}>
          {busy ? 'Saving…' : 'Confirm complete'}
        </button>
        <button type="button" className="cq-btn cq-btn-muted" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Officer: complaints routed to their department. Admin: overview + review queue for held complaints. */
export default function ComplaintDashboard({ role }) {
  const navigate = useNavigate();
  const loginPath = role === 'admin' ? '/admin-login' : '/officer-login';
  const tabs = TABS[role];

  const [status, setStatus] = useState(tabs[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [identity, setIdentity] = useState(() => (role === 'officer' ? officerIdentity() : null));

  useEffect(() => {
    if (role !== 'admin') return;
    fetchAdminProfile()
      .then((res) => setIdentity({ name: res.admin.name, subtitle: 'Administrator' }))
      .catch(() => navigate(loginPath));
  }, [role, navigate, loginPath]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchComplaintQueue({ status })
      .then((res) => setItems(res.items || []))
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          navigate(loginPath);
          return;
        }
        setItems([]);
        setError(err.message || 'Could not load complaints.');
      })
      .finally(() => setLoading(false));
  }, [status, navigate, loginPath]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id, decision) {
    setBusyId(id);
    setError('');
    try {
      await reviewComplaint(id, decision);
      setItems((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message || 'Review action failed.');
    } finally {
      setBusyId(null);
    }
  }

  function onResolved(id) {
    setResolvingId(null);
    setItems((prev) => prev.filter((c) => c._id !== id));
  }

  async function logout() {
    try {
      await (role === 'admin' ? adminLogoutApi() : officerLogoutApi());
    } catch {
      // ignore
    }
    if (role === 'officer') sessionStorage.removeItem('officer_session');
    navigate(loginPath);
  }

  const markers = useMemo(
    () =>
      items.filter((c) => Array.isArray(c.location?.coordinates)).map((c) => ({
        id: c._id,
        lat: c.location.coordinates[1],
        lng: c.location.coordinates[0],
        status: c.status,
        label: `${c.complaintCode} · ${c.categoryLabel}: ${c.description}`,
      })),
    [items]
  );

  return (
    <>
      <header className="cq-topbar">
        <div className="cq-topbar-inner">
          <div className="cq-identity">
            <span className="cq-avatar" aria-hidden="true">{initials(identity?.name) || '·'}</span>
            <div>
              <strong>{identity?.name}</strong>
              <small>{identity?.subtitle}</small>
            </div>
          </div>
          <div className="cq-header-actions">
            {role === 'officer' && <Link to="/officer/dashboard" className="cq-btn">Service Requests</Link>}
            <button type="button" className="cq-btn" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="cq-btn cq-btn-muted" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className="cq-page">
        <div className="cq-heading">
          <h1>{role === 'admin' ? 'Complaint Review' : 'Department Complaints'}</h1>
          <p className="cq-sub">
            {role === 'admin'
              ? 'Complaints that failed automatic verification wait here for a decision.'
              : 'Verified citizen complaints routed to your department.'}
          </p>
        </div>

        {role === 'admin' && <AdminStats />}

        <div className="cq-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`cq-tab ${t === status ? 'active' : ''}`}
              onClick={() => setStatus(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <div className="cq-error" role="alert">{error}</div>}

        <MapView markers={markers} />

        {!loading && items.length === 0 && !error && <p className="cq-empty">No complaints in this queue.</p>}

        <ul className="cq-list">
          {items.map((c) => (
            <li key={c._id} className="cq-item">
              <a href={assetUrl(c.imageUrl)} target="_blank" rel="noreferrer">
                <img src={assetUrl(c.imageUrl)} alt={`Photo for ${c.complaintCode}`} className="cq-thumb" />
              </a>
              <div className="cq-body">
                <div className="cq-title">
                  <strong>{c.complaintCode}</strong>
                  <span>{c.categoryLabel}</span>
                  {c.department && c.department !== c.categoryLabel && <em>→ {c.department}</em>}
                </div>
                <p className="cq-text">{c.description}</p>
                <div className="cq-meta">
                  {c.user && (
                    <span>
                      {`${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || 'Citizen'}
                      {c.user.contactNo && ` · ${c.user.contactNo}`}
                    </span>
                  )}
                  {Array.isArray(c.location?.coordinates) && (
                    <span>
                      {c.location.coordinates[1].toFixed(5)}, {c.location.coordinates[0].toFixed(5)} (
                      {LOCATION_SOURCES[c.locationSource]})
                    </span>
                  )}
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  {role === 'admin' && (
                    <span>
                      AI score {c.fusionScore != null ? c.fusionScore.toFixed(2) : 'n/a'}
                      {c.imageScore != null && ` (image ${c.imageScore.toFixed(2)}, text ${c.textScore.toFixed(2)})`}
                    </span>
                  )}
                </div>
                {role === 'admin' && c.flags?.length > 0 && (
                  <div className="cq-flags">
                    {c.flags.map((f) => (
                      <span key={f} className="cq-flag">{FLAG_LABELS[f] || f}</span>
                    ))}
                  </div>
                )}
                {role === 'admin' && c.aiReason && (
                  <p className="cq-ai-reason">
                    <strong>AI reason:</strong> {c.aiReason}
                  </p>
                )}
                {c.resolution?.resolvedAt && (
                  <div className="cq-resolution">
                    <span>Completed {new Date(c.resolution.resolvedAt).toLocaleString()}</span>
                    {c.resolution.solutionGiven && <p className="cq-text">{c.resolution.solutionGiven}</p>}
                    {c.resolution.afterPhotos?.map((url) => (
                      <a key={url} href={assetUrl(url)} target="_blank" rel="noreferrer">
                        <img src={assetUrl(url)} alt={`Proof for ${c.complaintCode}`} className="cq-proof" />
                      </a>
                    ))}
                    <span>
                      {c.userFeedback?.rating ? `Citizen rating: ${'★'.repeat(c.userFeedback.rating)} (${c.userFeedback.rating}/5)` : 'Awaiting citizen rating'}
                    </span>
                    {c.userFeedback?.comment && <p className="cq-text">Citizen: “{c.userFeedback.comment}”</p>}
                  </div>
                )}
                {resolvingId === c._id && (
                  <ResolveForm complaint={c} onDone={onResolved} onCancel={() => setResolvingId(null)} />
                )}
              </div>
              {role === 'officer' && OFFICER_OPEN_STATUSES.includes(c.status) && resolvingId !== c._id && (
                <div className="cq-actions">
                  <button type="button" className="cq-btn cq-approve" onClick={() => setResolvingId(c._id)}>
                    Mark as complete
                  </button>
                </div>
              )}
              {role === 'admin' && c.status === 'Suspected Fake' && (
                <div className="cq-actions">
                  <button type="button" className="cq-btn cq-approve" disabled={busyId === c._id} onClick={() => review(c._id, 'approve')}>
                    Approve
                  </button>
                  <button type="button" className="cq-btn cq-reject" disabled={busyId === c._id} onClick={() => review(c._id, 'reject')}>
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
