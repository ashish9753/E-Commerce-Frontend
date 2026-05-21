import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, Tag, CreditCard, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

const PERKS = [
  { icon: <Package size={15} />,    text: 'Track all your orders in one place' },
  { icon: <Tag size={15} />,        text: 'Early access to flash sales & coupons' },
  { icon: <CreditCard size={15} />, text: 'Faster checkout with saved addresses' },
  { icon: <Headphones size={15} />, text: 'Priority customer support 24/7' },
];

function InputField({ label, name, type = 'text', placeholder, value, error, onChange, onFocus, onBlur, right }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          style={{
            width: '100%', height: 42, padding: right ? '0 42px 0 12px' : '0 12px',
            border: `1.5px solid ${error ? '#e53935' : '#e0e0e0'}`,
            borderRadius: 8, fontSize: 13, color: '#1a1a1a',
            outline: 'none', background: '#fff', boxSizing: 'border-box',
            transition: 'border-color .15s',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#0166b2'; if (onFocus) onFocus(e); }}
          onBlur={e => { if (!error) e.target.style.borderColor = '#e0e0e0'; if (onBlur) onBlur(e); }}
        />
        {right && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: '#e53935', marginTop: 3 }}>{error}</div>}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const errs = {};
    const nameErr = validators.name(form.name);         if (nameErr) errs.name = nameErr;
    const emailErr = validators.email(form.email);      if (emailErr) errs.email = emailErr;
    const phoneErr = validators.phone(form.phone);      if (phoneErr) errs.phone = phoneErr;
    const pwErr = validators.password(form.password);   if (pwErr) errs.password = pwErr;
    const cpErr = validators.confirmPassword(form.confirm, form.password); if (cpErr) errs.confirm = cpErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    setLoading(false);
    if (result.success) {
      toast(`Account created! Welcome, ${result.user.name.split(' ')[0]}!`);
      navigate('/');
    } else {
      toast(result.error, 'error');
      setErrors({ email: result.error });
    }
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }} className="auth-grid">
      {/* ── Left panel ── */}
      <div style={{
        background: 'linear-gradient(145deg, #0d1117 0%, #131921 50%, #1a2332 100%)',
        padding: '40px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,90,31,.18) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(1,102,178,.15) 0%,transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo-mark" />
          <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: -.4 }}>
            Trade<span style={{ color: '#FF5A1F' }}>Engine</span>
          </span>
        </div>

        {/* Main content */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FF5A1F', letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>
            Join for Free Today
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 14, letterSpacing: -.5 }}>
            Create your<br />account &amp;<br />start saving! 🎉
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginBottom: 36, lineHeight: 1.6, maxWidth: 340 }}>
            Join 50,000+ smart shoppers who trust Trade Engine for the best electronics deals in Nepal.
          </p>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {PERKS.map(p => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: 'rgba(255,90,31,.15)', border: '1px solid rgba(255,90,31,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FF5A1F', flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.4 }}>{p.text}</span>
              </div>
            ))}
          </div>

          {/* Already member prompt */}
          <div style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>Already have an account?</span>
            <button onClick={() => navigate('/login')}
              style={{ background: 'rgba(255,90,31,.15)', color: '#FF5A1F', border: '1px solid rgba(255,90,31,.3)', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
          © {new Date().getFullYear()} Trade Engine Pvt. Ltd.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        background: '#f5f7fa',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,.08)',
          padding: '32px 34px 28px',
        }}>
          {/* Card header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#131921,#1a2332)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <div className="logo-mark" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 3, letterSpacing: -.3 }}>Create your account</h2>
            <p style={{ fontSize: 12, color: '#888' }}>Start shopping Nepal's best electronics store</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Two-column row: Name + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputField label="Full Name" name="name" placeholder="Suman Shrestha"
                value={form.name} error={errors.name} onChange={set} />
              <InputField label="Phone Number" name="phone" type="tel" placeholder="+977 98XXXXXXXX"
                value={form.phone} error={errors.phone} onChange={set} />
            </div>

            <InputField label="Email Address" name="email" type="email" placeholder="you@example.com"
              value={form.email} error={errors.email} onChange={set} />

            <InputField label="Password" name="password" type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              value={form.password} error={errors.password} onChange={set}
              right={eyeBtn(showPw, () => setShowPw(s => !s))} />

            <InputField label="Confirm Password" name="confirm" type={showCp ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={form.confirm} error={errors.confirm} onChange={set}
              right={eyeBtn(showCp, () => setShowCp(s => !s))} />

            {/* Password hint */}
            <div style={{
              background: '#f8f9fa', border: '1px solid #e8eaed',
              borderRadius: 7, padding: '9px 12px', marginBottom: 18,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 11, color: '#888', lineHeight: 1.5, margin: 0 }}>
                Password must be 8+ characters with at least one uppercase letter and one number.
              </p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', height: 46, borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #FF5A1F, #e04a0f)',
                color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: .3,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(255,90,31,.35)',
                marginBottom: 16,
              }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                    Creating account…
                  </span>
                : 'Create Account'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <a href="#" style={{ color: '#0166b2', textDecoration: 'none' }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color: '#0166b2', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>

        {/* Sign in link */}
        <div style={{ marginTop: 16, fontSize: 13, color: '#666', textAlign: 'center' }}>
          Already have an account?{' '}
          <a onClick={() => navigate('/login')}
            style={{ color: '#0166b2', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
            Sign in here
          </a>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['🔒 Secure Signup', '✅ No Spam', '🛡️ Data Protected'].map(t => (
            <span key={t} style={{ fontSize: 11, color: '#999' }}>{t}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-grid > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  );
}
