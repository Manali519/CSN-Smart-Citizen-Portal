import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleSignIn, decodeGoogleCredentialForDisplay } from '../hooks/useGoogleSignIn.js';
import { registerCitizen, verifyRegistrationOtp, resendRegistrationOtp } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import './CitizenRegister.css';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  contactNo: '',
  email: '',
  streetAddress: '',
  password: '',
  confirmPassword: '',
};

const RESEND_COOLDOWN_SECONDS = 60; // mirrors the backend's OTP_RESEND_COOLDOWN_SECONDS default

export default function CitizenRegister() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [signupMethod, setSignupMethod] = useState('manual');
  const [googleIdToken, setGoogleIdToken] = useState(null);

  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'done'
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [otpError, setOtpError] = useState('');
  const [notice, setNotice] = useState('');

  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  const handleGoogleCredential = async (credential) => {
    const profile = decodeGoogleCredentialForDisplay(credential);
    const nextForm = {
      ...form,
      email: profile.email,
      firstName: profile.firstName || form.firstName,
      lastName: profile.lastName || form.lastName,
    };

    setSignupMethod('google');
    setGoogleIdToken(credential);
    setForm(nextForm);
    setFormError('');

    setLoading(true);
    try {
      const res = await registerCitizen({
        ...nextForm,
        signupMethod: 'google',
        googleIdToken: credential,
      });
      goToOtpStep(res.email, res.message);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { buttonRef, error: googleError } = useGoogleSignIn(handleGoogleCredential);

  useEffect(() => () => clearInterval(cooldownTimer.current), []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function goToOtpStep(emailForOtp, message) {
    setOtpEmail(emailForOtp);
    setNotice(message);
    setStep('otp');
    startCooldown();
  }

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function switchToManual() {
    setSignupMethod('manual');
    setGoogleIdToken(null);
    setForm((f) => ({ ...f, email: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    const isEmailOnlyFlow = signupMethod === 'manual' &&
      !form.firstName &&
      !form.lastName &&
      !form.dob &&
      !form.contactNo &&
      !form.streetAddress &&
      !!form.email;

    if (signupMethod === 'manual' && form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await registerCitizen({
        ...payload,
        signupMethod,
        googleIdToken,
        ...(isEmailOnlyFlow ? { firstName: '', lastName: '', dob: '', contactNo: '', streetAddress: '' } : {}),
      });
      goToOtpStep(res.email, res.message);
    } catch (err) {
      setFormError(err.message);
      const fe = {};
      (err.fieldErrors || []).forEach((f) => { fe[f.field] = f.message; });
      setFieldErrors(fe);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setOtpError('');
    setLoading(true);
    try {
      await verifyRegistrationOtp({ email: otpEmail, otp });
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setOtpError('');
    try {
      const res = await resendRegistrationOtp({ email: otpEmail });
      setNotice(res.message);
      startCooldown();
    } catch (err) {
      setOtpError(err.message);
    }
  }

  return (
    <section className="section register">
      <div className="container register-inner">
        {step === 'form' && (
          <>
            <div className="section-heading">
              <h1>Register as a Citizen</h1>
              <p>Create your account to file complaints, request water tankers, and track everything in one place.</p>
            </div>

            <div className="register-card">
              <div className="google-block">
                <div ref={buttonRef} />
                {googleError && <p className="field-error">{googleError}</p>}
                {signupMethod === 'google' && (
                  <p className="google-active">
                    Signed in with Google as <strong>{form.email}</strong>.{' '}
                    <button type="button" className="link-btn" onClick={switchToManual}>Use a different email instead</button>
                  </p>
                )}
              </div>

              <div className="divider"><span>or fill the form manually</span></div>

              {formError && <p className="form-error" role="alert">{formError}</p>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <Field label="First name" error={fieldErrors.firstName}>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      autoComplete="given-name"
                    />
                  </Field>

                  <Field label="Last name" error={fieldErrors.lastName}>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      autoComplete="family-name"
                    />
                  </Field>

                  <Field label="Date of birth" error={fieldErrors.dob}>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={form.dob}
                      onChange={(e) => updateField('dob', e.target.value)}
                      autoComplete="bday"
                    />
                  </Field>

                  <Field label="Contact number" error={fieldErrors.contactNo}>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={form.contactNo}
                      onChange={(e) => updateField('contactNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Email address" error={fieldErrors.email} full>
                    <input
                      type="email"
                      required
                      readOnly={signupMethod === 'google'}
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      autoComplete="email"
                    />
                    {signupMethod === 'google' && (
                      <span className="field-hint">Locked to your Google account &mdash; the OTP goes here.</span>
                    )}
                  </Field>

                  <Field label="Street address" error={fieldErrors.streetAddress} full>
                    <textarea
                      required
                      rows={3}
                      maxLength={240}
                      value={form.streetAddress}
                      onChange={(e) => updateField('streetAddress', e.target.value)}
                      autoComplete="street-address"
                    />
                  </Field>

                  {signupMethod === 'manual' && (
                    <>
                      <Field label="Create password" error={fieldErrors.password}>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          autoComplete="new-password"
                        />
                        <span className="field-hint">At least 8 characters, with a letter and a number.</span>
                      </Field>

                      <Field label="Confirm password" error={fieldErrors.confirmPassword}>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={form.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          autoComplete="new-password"
                        />
                      </Field>
                    </>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending OTP\u2026' : 'Send OTP'}
                </button>
              </form>

              <p className="login-hint">
                Already registered? <Link to="/citizen-login">Log in instead</Link>
              </p>
            </div>
          </>
        )}

        {step === 'otp' && (
          <div className="register-card otp-card">
            <span className="register-tag">Verify your email</span>
            <h1>Enter the OTP</h1>
            <p>
              We sent a 4 digit code to <strong>{otpEmail}</strong>. Expires in 3 minutes
              &mdash; enter it below to create your account.
            </p>

            {notice && <p className="notice" role="status">{notice}</p>}
            {otpError && <p className="form-error" role="alert">{otpError}</p>}

            <form onSubmit={handleVerifyOtp} className="otp-form">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="otp-input"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading || otp.length < 4}>
                {loading ? 'Verifying\u2026' : 'Verify & Create Account'}
              </button>
            </form>

            <button
              type="button"
              className="link-btn"
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
            </button>

            <button type="button" className="link-btn back-btn" onClick={() => setStep('form')}>
              &larr; Edit details
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="register-card done-card">
            <span className="register-tag success-tag">Verified</span>
            <h1>You&rsquo;re all set!</h1>
            <p>Your citizen account has been created and verified successfully.</p>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, error, full, children }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
