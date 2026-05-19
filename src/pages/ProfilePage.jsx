import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!user) { navigate('/login'); return null; }

  const handleLogout = () => { logout(); toast('Signed out successfully'); navigate('/'); };

  const handleProfileSave = async () => {
    const errs = {};
    const nameErr = validators.name(form.name);
    if (nameErr) errs.name = nameErr;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const result = await updateProfile({ name: form.name, phone: form.phone });
    setLoading(false);
    if (result.success) toast('Profile updated!');
    else toast(result.error, 'error');
  };

  const handlePasswordChange = async () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    const nextErr = validators.password(pwForm.newPassword);
    if (nextErr) errs.newPassword = nextErr;
    const confirmErr = validators.confirmPassword(pwForm.confirm, pwForm.newPassword);
    if (confirmErr) errs.confirm = confirmErr;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const result = await changePassword(pwForm.currentPassword, pwForm.newPassword);
    setLoading(false);
    if (result.success) { toast('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); }
    else toast(result.error, 'error');
  };

  const navItems = [
    { id: 'profile', icon: <User size={16} />, label: 'My Profile' },
    { id: 'orders', icon: <Package size={16} />, label: 'My Orders', action: () => navigate('/orders') },
    { id: 'wishlist', icon: <Heart size={16} />, label: 'Wishlist', action: () => navigate('/wishlist') },
    { id: 'password', icon: <Lock size={16} />, label: 'Change Password' },
    { id: 'logout', icon: <LogOut size={16} />, label: 'Sign Out', action: handleLogout, danger: true },
  ];

  return (
    <div className="wrap py-10">
      <div className="grid grid-cols-[260px_1fr] gap-8 items-start max-md:grid-cols-1">

        {/* Sidebar */}
        <div className="card p-6 sticky top-32.5 self-start">
          <div className="flex flex-col items-center text-center pb-6 border-b border-line mb-4">
            <div className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center text-2xl font-bold mb-3">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="font-bold text-base">{user.name}</div>
            <div className="text-xs text-mute mt-0.5">{user.email}</div>
            {user.role && user.role !== 'user' && (
              <span className="tag tag-accent mt-2 capitalize">{user.role}</span>
            )}
          </div>
          <nav className="flex flex-col gap-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-left w-full border-0 cursor-pointer transition-colors
                  ${item.danger ? 'text-bad hover:bg-bad-tint' : activeTab === item.id ? 'bg-ink text-white' : 'text-mute bg-transparent hover:bg-surface hover:text-ink'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="card p-8">
          {activeTab === 'profile' && (
            <>
              <h2 className="text-lg font-bold mb-6 pb-4 border-b border-line">Personal Information</h2>
              <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
                <div className="field">
                  <label>Full Name</label>
                  <input
                    className={`input ${errors.name ? 'error' : ''}`}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors({}); }}
                  />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
              </div>
              <div className="field mb-7">
                <label>Email Address</label>
                <input className="input bg-surface text-mute cursor-not-allowed" value={user.email} disabled />
                <div className="text-[11px] text-soft mt-1">Email cannot be changed</div>
              </div>
              <button className="btn btn-primary" onClick={handleProfileSave} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </>
          )}

          {activeTab === 'password' && (
            <>
              <h2 className="text-lg font-bold mb-6 pb-4 border-b border-line">Change Password</h2>
              {[
                { k: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                { k: 'newPassword', label: 'New Password', placeholder: 'Min. 8 chars, 1 uppercase, 1 number' },
                { k: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
              ].map(f => (
                <div key={f.k} className="field mb-5">
                  <label>{f.label}</label>
                  <input
                    className={`input ${errors[f.k] ? 'error' : ''}`}
                    type="password"
                    value={pwForm[f.k]}
                    onChange={e => { setPwForm(p => ({ ...p, [f.k]: e.target.value })); setErrors({}); }}
                    placeholder={f.placeholder}
                  />
                  {errors[f.k] && <div className="field-error">{errors[f.k]}</div>}
                </div>
              ))}
              <button className="btn btn-primary mt-2" onClick={handlePasswordChange} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
