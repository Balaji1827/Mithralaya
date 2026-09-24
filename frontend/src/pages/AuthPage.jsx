import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import "../css/auth.css";

const OTP_LENGTH = 6;

// Strip +, spaces, dashes; remove leading 91 country code -> 10-digit number
const normalizePhone = (raw) => {
  let p = raw.replace(/[^\d]/g, '');
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
};

const BrandArt = () => (
  <svg viewBox="0 0 220 170" className="auth-brand-art" aria-hidden="true">
    <ellipse cx="110" cy="150" rx="80" ry="10" fill="rgba(0,0,0,0.12)" />
    <circle cx="168" cy="30" r="14" fill="#FFC53D" />
    <path d="M150 34 a18 18 0 0 1 30 6" fill="none" stroke="#FFC53D" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <rect x="46" y="58" width="128" height="82" rx="8" fill="#12224F" />
    <rect x="54" y="66" width="112" height="58" rx="4" fill="#F4F6FB" />
    <circle cx="110" cy="92" r="15" fill="#B9C4E0" />
    <path d="M90 118c4-12 14-18 20-18s16 6 20 18" fill="#B9C4E0" />
    <rect x="30" y="128" width="34" height="34" rx="6" fill="#FF5470" />
    <path d="M47 152l-8-8 3-3 5 5 11-11 3 3z" fill="#fff" />
    <rect x="160" y="120" width="34" height="34" rx="6" fill="#FFC53D" />
    <path d="M177 128v8m0 8h.02" stroke="#12224F" strokeWidth="3" strokeLinecap="round" />
    <rect x="6" y="112" width="26" height="26" rx="6" fill="#2E4A9E" />
    <path d="M13 125h12M19 119v12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// ---------- 6-box OTP input ----------
const OtpBoxes = ({ value, onChange, invalid, autoFocus }) => {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const setDigit = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').replace(/\s+$/, ''));
  };

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (!v) { setDigit(i, ''); return; }
    const chars = v.split('');
    const next = digits.slice();
    let idx = i;
    for (const c of chars) {
      if (idx >= OTP_LENGTH) break;
      next[idx] = c;
      idx += 1;
    }
    onChange(next.join('').replace(/\s+$/, ''));
    const focusIdx = Math.min(idx, OTP_LENGTH - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className={`otp-boxes ${invalid ? 'invalid' : ''}`} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
};

const AuthPage = () => {
  const [mode, setMode] = useState('login'); 
  const [form, setForm] = useState({ name: '', phone: '', otp: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { requestOtp, verifyOtpLogin, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name'),
    phone: (v) => (normalizePhone(v).length === 10 ? '' : 'Enter a valid 10-digit mobile number'),
    otp: (v) => (v.length === OTP_LENGTH ? '' : 'Enter the 6-digit code'),
  };

  const fieldError = (name) => (touched[name] ? validators[name](form[name]) : '');
  const isValid = (names) => names.every((n) => validators[n](form[n]) === '');

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };


  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digitsOnly }));
    if (error) setError('');
  };

  const handleBlur = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const markTouched = (names) =>
    setTouched((prev) => {
      const next = { ...prev };
      names.forEach((n) => { next[n] = true; });
      return next;
    });

  const requiredFields = mode === 'signup' ? ['name', 'phone'] : ['phone'];

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    markTouched(requiredFields);
    if (!isValid(requiredFields)) return triggerShake();
    setOtpLoading(true);
    setError('');
    try {
      await requestOtp(normalizePhone(form.phone));
      setOtpRequested(true);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      triggerShake();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpRequested(false);
    setResendTimer(0);
    setError('');
    setForm((prev) => ({ ...prev, otp: '' }));
    setTouched((prev) => ({ ...prev, otp: false }));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    markTouched(['otp']);
    if (!isValid(['otp'])) return triggerShake();
    setLoading(true);
    setError('');
    try {
      const data = mode === 'signup'
        ? await register({ name: form.name, phone: normalizePhone(form.phone), otp: form.otp })
        : await verifyOtpLogin({ phone: normalizePhone(form.phone), otp: form.otp });
      navigate(data.isAdmin ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setOtpRequested(false);
    setResendTimer(0);
    setError('');
    setTouched({});
    setForm({ name: '', phone: '', otp: '' });
  };

  const brandCopy = otpRequested
    ? { title: 'Verify', sub: 'Enter the OTP to finish.' }
    : mode === 'signup'
      ? { title: "Looks like you're new here!", sub: 'Sign up with your mobile number to get started.' }
      : { title: 'Login', sub: 'Get access to your Orders, Wishlist and Recommendations.' };

  return (
    <div className="auth-page">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        {/* ---------- brand panel ---------- */}
        <div className="auth-brand">
          <div className="auth-brand-text">
            <h1>{brandCopy.title}</h1>
            <p>{brandCopy.sub}</p>
          </div>
          <BrandArt />
        </div>

        {/* ---------- form panel ---------- */}
        <div className={`auth-form-panel ${otpRequested ? 'is-otp' : ''}`}>
          {!otpRequested ? (
            <form onSubmit={handleRequestOtp} noValidate>
              {mode === 'signup' && (
                <>
                  <label htmlFor="name" className="auth-label">Full Name</label>
                  <div className={`text-field ${fieldError('name') ? 'invalid' : ''}`}>
                    <input
                      id="name"
                      name="name"
                      autoFocus
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="name"
                    />
                  </div>
                  {fieldError('name') && <span className="field-error-text">{fieldError('name')}</span>}
                </>
              )}

              <label htmlFor="phone" className="auth-label">Enter Mobile Number</label>
              <div className={`phone-field ${fieldError('phone') ? 'invalid' : ''}`}>
                <span className="phone-prefix">+91</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  autoFocus={mode === 'login'}
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onBlur={handleBlur}
                  autoComplete="tel-national"
                />
              </div>
              {fieldError('phone') && <span className="field-error-text">{fieldError('phone')}</span>}

              <p className="auth-terms">
                By continuing, you agree to Bullrise's <a href="#terms">Terms of Use</a> and{' '}
                <a href="#privacy">Privacy Policy</a>.
              </p>

              {error && <div className="error-message" role="alert">{error}</div>}

              <button className="btn-primary" type="submit" disabled={otpLoading}>
                {otpLoading && <span className="spinner" />}
                {otpLoading ? 'Sending OTP…' : 'Request OTP'}
              </button>

              <p className="auth-switch">
                {mode === 'login' ? (
                  <>New to Bullrise? <button type="button" className="link-btn" onClick={() => switchMode('signup')}>Create an account</button></>
                ) : (
                  <>Already registered? <button type="button" className="link-btn" onClick={() => switchMode('login')}>Please login</button></>
                )}
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} noValidate>
              <p className="otp-sent-line">
                Please enter the OTP sent to <strong>+91 {form.phone}</strong>.{' '}
                <button type="button" className="link-btn" onClick={handleChangeNumber}>Change</button>
              </p>

              <OtpBoxes
                value={form.otp}
                onChange={(v) => { setForm((prev) => ({ ...prev, otp: v })); if (error) setError(''); }}
                invalid={!!fieldError('otp')}
                autoFocus
              />
              {fieldError('otp') && <span className="field-error-text center">{fieldError('otp')}</span>}

              {error && <div className="error-message center" role="alert">{error}</div>}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Verifying…' : 'Verify'}
              </button>

              <p className="auth-switch">
                Not received your code?{' '}
                <button
                  type="button"
                  className="link-btn"
                  disabled={otpLoading || resendTimer > 0}
                  onClick={handleRequestOtp}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
