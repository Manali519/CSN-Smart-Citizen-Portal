import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  loginWithPassword,
  loginWithGoogle,
  verifyRegistrationOtp,
  resendRegistrationOtp,
} from '../api/auth.js';
import './CitizenLogin.css';

const RESEND_COOLDOWN_SECONDS = 60;

export default function CitizenLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [notRegistered, setNotRegistered] = useState(false);

  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setNotRegistered(false);
    setLoading(true);
    try {
      await loginWithPassword({ email, password });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'NOT_REGISTERED') {
        setNotRegistered(true);
        setFormError(err.message);
      } else if (err.code === 'NOT_VERIFIED') {
        goToOtpStep(err.data?.email || email, err.message);
      } else if (err.code === 'USE_GOOGLE') {
        setFormError(err.message);
      } else {
        setFormError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = async (credential) => {
    setFormError('');
    setNotRegistered(false);
    setLoading(true);
    try {
      await loginWithGoogle({ googleIdToken: credential });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'NOT_REGISTERED') {
        setNotRegistered(true);
        setFormError(err.message);
      } else if (err.code === 'NOT_VERIFIED') {
        goToOtpStep(err.data?.email || '', err.message);
      } else {
        setFormError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const { buttonRef, error: googleError } = useGoogleSignIn(handleGoogleCredential);

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setOtpError('');
    setLoading(true);
    try {
      await verifyRegistrationOtp({ email: otpEmail, otp });
      await refreshUser();
      navigate('/dashboard');
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

  if (step === 'otp') {
    return (
      <section className="section register">
        <div className="container register-inner">
          <div className="register-card otp-card">
            <span className="register-tag">Verify your email</span>
            <h1>One more step</h1>
            <p>
              Your account isn&rsquo;t verified yet, so we&rsquo;ve sent a fresh OTP to{' '}
              <strong>{otpEmail}</strong>. Enter it below to finish logging in.
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
                {loading ? 'Verifying\u2026' : 'Verify & Log In'}
              </button>
            </form>

            <button type="button" className="link-btn" onClick={handleResend} disabled={cooldown > 0}>
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
            </button>

            <button type="button" className="link-btn back-btn" onClick={() => setStep('login')}>
              &larr; Back to login
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section register">
      <div className="container register-inner">
        <div className="section-heading">
          <h1>Citizen Login</h1>
          <p>Log in to track complaints, request services, and manage your profile.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-grid">
            <label className="field">
              <span className="field-label">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in\u2026' : 'Log In'}
            </button>
          </div>

          <div className="divider"><span>or log in with email</span></div>

          <div className="register-card">
            <div className="google-block">
              <div ref={buttonRef} />
              {googleError && <p className="field-error">{googleError}</p>}
            </div>



            {formError && (
              <p className="form-error" role="alert">
                {formError}
                {notRegistered && (
                  <>
                    {' '}
                    <Link to="/citizen-register" className="link-btn inline-link">Register now</Link>
                  </>
                )}
              </p>
            )}
          </div>
        </form>
        <p className="login-hint">
          New here? <Link to="/citizen-register">Register as a citizen</Link>
        </p>
      </div>
    </section>
  )
}
