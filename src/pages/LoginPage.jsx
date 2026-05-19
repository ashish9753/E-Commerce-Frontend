import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const errs = {};
    const emailErr = validators.email(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      navigate('/');
    } else {
      toast(result.error, 'error');
      setErrors({ password: result.error });
    }
  };

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
            The best place to shop for electronics in Nepal. Quality guaranteed.
          </p>
          <div className="text-[13px] text-white/50">— 50,000+ happy customers</div>
        </div>
        <div className="text-[13px] text-white/40">© 2024 Trade Engine Pvt. Ltd.</div>
      </div>

      <div className="flex flex-col justify-center px-15 max-md:px-6">
        <div className="max-w-105">
          <h2 className="font-serif text-[40px] tracking-[-0.02em] mb-2 font-normal">Welcome back</h2>
          <p className="text-mute mb-8">Sign in to your Trade Engine account</p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field mb-4">
              <label>Email address</label>
              <input
                className={`input ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            <div className="field mb-6">
              <label className="flex justify-between">
                Password
                <a onClick={() => navigate('/forgot-password')} className="text-accent font-semibold text-xs cursor-pointer">Forgot password?</a>
              </label>
              <div className="relative">
                <input
                  className={`input pr-11 ${errors.password ? 'error' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-full h-12" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-mute">
            Don't have an account?{' '}
            <a onClick={() => navigate('/register')} className="text-ink font-semibold cursor-pointer hover:text-accent">Create one</a>
          </div>
        </div>
      </div>
    </div>
  );
}
