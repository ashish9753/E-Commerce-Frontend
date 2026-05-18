import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

// Defined outside to prevent re-mount on every keystroke
function Field({ k, label, type = 'text', placeholder, form, errors, showPw, setShowPw, onChange }) {
  const isPw = k === 'password' || k === 'confirm';
  return (
    <div className="field mb-4">
      <label>{label}</label>
      <div className="relative">
        <input
          className={`input ${errors[k] ? 'error' : ''} ${isPw ? 'pr-11' : ''}`}
          type={isPw ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[k]}
          onChange={e => onChange(k, e.target.value)}
          autoComplete={k === 'password' || k === 'confirm' ? 'new-password' : k}
        />
        {k === 'password' && (
          <button
            type="button"
            onClick={() => setShowPw(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {errors[k] && <div className="field-error">{errors[k]}</div>}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const errs = {};
    const nameErr = validators.name(form.name);
    if (nameErr) errs.name = nameErr;
    const emailErr = validators.email(form.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validators.phone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    const pwErr = validators.password(form.password);
    if (pwErr) errs.password = pwErr;
    const cpErr = validators.confirmPassword(form.confirm, form.password);
    if (cpErr) errs.confirm = cpErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
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

  const fieldProps = { form, errors, showPw, setShowPw, onChange: set };

  return (
    <div className="grid grid-cols-2 min-h-screen max-md:grid-cols-1">
      <div className="bg-ink text-white px-15 py-15 flex flex-col justify-between relative overflow-hidden max-md:hidden">
        <div className="absolute -right-50 -bottom-50 w-125 h-125 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(255,90,31,.2) 0%,transparent 60%)' }} />
        <div className="flex items-center gap-2.5 font-extrabold tracking-[-0.02em] text-[19px] cursor-pointer text-white" onClick={() => navigate('/')}>
          <div className="logo-mark" />
          Trade<span className="text-accent">Engine</span>
        </div>
        <div>
          <div className="font-serif text-[80px] leading-[0.5] text-accent">"</div>
          <p className="font-serif text-[32px] leading-[1.2] mt-5 mb-5 tracking-[-0.01em]">
            Join thousands of customers enjoying the best deals on electronics.
          </p>
          <div className="text-[13px] text-white/50">— Trade Engine, Nepal</div>
        </div>
        <div className="text-[13px] text-white/40">© 2024 Trade Engine Pvt. Ltd.</div>
      </div>

      <div className="flex flex-col justify-center px-15 max-md:px-6">
        <div className="max-w-105">
          <h2 className="font-serif text-[40px] tracking-[-0.02em] mb-2 font-normal">Create account</h2>
          <p className="text-mute mb-8">Start shopping Nepal's best electronics store</p>
          <form onSubmit={handleSubmit} noValidate>
            <Field k="name" label="Full name" placeholder="Suman Shrestha" {...fieldProps} />
            <Field k="email" label="Email address" type="email" placeholder="you@example.com" {...fieldProps} />
            <Field k="phone" label="Phone number" type="tel" placeholder="+977 98XXXXXXXX" {...fieldProps} />
            <Field k="password" label="Password" placeholder="Min. 8 chars, 1 uppercase, 1 number" {...fieldProps} />
            <Field k="confirm" label="Confirm password" placeholder="Re-enter your password" {...fieldProps} />

            <div className="bg-surface rounded-[10px] px-[14px] py-3 text-xs text-mute mb-5">
              Password must be 8+ characters with at least one uppercase letter and one number.
            </div>

            <button type="submit" className="btn btn-primary w-full h-12" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-mute">
            Already have an account?{' '}
            <a onClick={() => navigate('/login')} className="text-ink font-semibold cursor-pointer hover:text-accent">Sign in</a>
          </div>
          <p className="text-[11px] text-soft text-center mt-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
