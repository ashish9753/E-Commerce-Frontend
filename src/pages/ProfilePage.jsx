import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Package, Heart, LogOut, Lock, MapPin, Plus, Pencil, Trash2, X, Check, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/users';
import { validators, cleanPhone, isValidPhone } from '../utils/validators';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

const EMPTY_ADDR = { fullName:'', phone:'', houseNo:'', area:'', city:'', state:'', pincode:'', landmark:'' };

function AddrField({ k, label, placeholder, type = 'text', half, form, errs, onSet }) {
  return (
    <div className={`field${half ? ' col-span-1' : ''}`}>
      <label>{label}</label>
      <input className={`input${errs[k] ? ' error' : ''}`} type={type}
        value={form[k]} onChange={e => onSet(k, e.target.value)} placeholder={placeholder} />
      {errs[k] && <div className="field-error">{errs[k]}</div>}
    </div>
  );
}

function AddressForm({ initial = EMPTY_ADDR, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const [errs, setErrs] = useState({});

  const set = (k, v) => {
    const value = k === 'phone' ? cleanPhone(v) : v;
    setForm(f => ({ ...f, [k]: value }));
    setErrs(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!isValidPhone(form.phone)) e.phone = 'Enter a 10-digit phone number';
    if (!form.houseNo.trim())  e.houseNo  = 'Required';
    if (!form.area.trim())     e.area     = 'Required';
    if (!form.city.trim())     e.city     = 'Required';
    if (!form.state)           e.state    = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode required';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onSave(form);
  };

  return (
    <div className="border border-line rounded-xl p-5 bg-surface mt-4">
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <AddrField k="fullName" label="Full Name *" placeholder="Recipient name" half form={form} errs={errs} onSet={set} />
        <AddrField k="phone"    label="Phone *"     placeholder="10-digit mobile" half form={form} errs={errs} onSet={set} />
        <AddrField k="houseNo"  label="House / Flat / Block *" placeholder="e.g. 12B, 3rd Floor" half form={form} errs={errs} onSet={set} />
        <AddrField k="area"     label="Street / Area / Locality *" placeholder="Colony or area name" half form={form} errs={errs} onSet={set} />
        <AddrField k="city"     label="City *" placeholder="City" half form={form} errs={errs} onSet={set} />
        <div className="field col-span-1">
          <label>State *</label>
          <select className={`input${errs.state ? ' error' : ''}`} value={form.state} onChange={e => set('state', e.target.value)}>
            <option value="">— Select State —</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errs.state && <div className="field-error">{errs.state}</div>}
        </div>
        <AddrField k="pincode"  label="Pincode *" placeholder="6-digit code" half form={form} errs={errs} onSet={set} />
        <AddrField k="landmark" label="Landmark (optional)" placeholder="Near school, temple…" half form={form} errs={errs} onSet={set} />
      </div>
      <div className="flex gap-3 mt-5">
        <button className="btn btn-primary flex items-center gap-2" onClick={submit} disabled={saving}>
          {saving ? <span className="spinner" /> : <Check size={15} />}
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [form, setForm]           = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  // Addresses
  const [addresses, setAddresses]   = useState(user?.addresses || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId]           = useState(null);
  const [addrSaving, setAddrSaving]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  useEffect(() => {
    if (activeTab === 'addresses') {
      usersApi.getProfile()
        .then(r => setAddresses(r.data?.data?.user?.addresses || r.data?.data?.addresses || r.data?.addresses || []))
        .catch(() => {});
    }
  }, [activeTab]);

  // Refund details
  const [refundTab, setRefundTab]       = useState('bank'); // 'bank' | 'upi'
  const [bankForm, setBankForm]         = useState({ accountName:'', accountNumber:'', ifscCode:'', bankName:'' });
  const [upiForm, setUpiForm]           = useState({ upiId:'' });
  const [upiConfirm, setUpiConfirm]     = useState('');
  const [upiMismatch, setUpiMismatch]   = useState(false);
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'refund-details') {
      setRefundLoading(true);
      usersApi.getRefundDetails()
        .then(({ data }) => {
          const s = data.data?.savedRefundDetails || {};
          const bt = s.bankTransfer || {};
          const up = s.upi || {};
          setBankForm({ accountName: bt.accountName||'', accountNumber: bt.accountNumber||'', ifscCode: bt.ifscCode||'', bankName: bt.bankName||'' });
          setUpiForm({ upiId: up.upiId||'' });
          setUpiConfirm(up.upiId||'');
          if (s.lastRefundMethod === 'upi') setRefundTab('upi');
        })
        .catch(() => {})
        .finally(() => setRefundLoading(false));
    }
  }, [activeTab]);

  const handleSaveBank = async () => {
    if (!bankForm.accountName || !bankForm.accountNumber || !bankForm.ifscCode || !bankForm.bankName) {
      toast('Please fill in all bank details.', 'error'); return;
    }
    setRefundSaving(true);
    try {
      await usersApi.updateRefundDetails({ method: 'bank_transfer', bankTransfer: bankForm });
      toast('Bank details saved!');
    } catch { toast('Failed to save bank details', 'error'); }
    finally { setRefundSaving(false); }
  };

  const handleSaveUpi = async () => {
    if (!upiForm.upiId) { toast('Please enter your UPI ID.', 'error'); return; }
    if (upiForm.upiId !== upiConfirm) { setUpiMismatch(true); toast('UPI IDs do not match.', 'error'); return; }
    setRefundSaving(true);
    try {
      await usersApi.updateRefundDetails({ method: 'upi', upi: { upiId: upiForm.upiId } });
      toast('UPI ID saved!');
    } catch { toast('Failed to save UPI ID', 'error'); }
    finally { setRefundSaving(false); }
  };

  if (!user) { navigate('/login'); return null; }

  const handleLogout = () => { logout(); toast('Signed out successfully'); navigate('/'); };

  const handleProfileSave = async () => {
    const errs = {};
    const nameErr = validators.name(form.name);
    if (nameErr) errs.name = nameErr;
    if (form.phone && !isValidPhone(form.phone)) errs.phone = 'Phone number must be exactly 10 digits';
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

  const handleAddAddress = async (data) => {
    setAddrSaving(true);
    try {
      const r = await usersApi.addAddress(data);
      setAddresses(r.data?.data?.addresses || r.data?.addresses || [...addresses, data]);
      setShowAddForm(false);
      toast('Address added!');
    } catch (e) {
      toast(e?.response?.data?.message || 'Failed to add address', 'error');
    } finally { setAddrSaving(false); }
  };

  const handleUpdateAddress = async (id, data) => {
    setAddrSaving(true);
    try {
      const r = await usersApi.updateAddress(id, data);
      setAddresses(r.data?.data?.addresses || r.data?.addresses || addresses.map(a => a._id === id ? { ...a, ...data } : a));
      setEditId(null);
      toast('Address updated!');
    } catch (e) {
      toast(e?.response?.data?.message || 'Failed to update address', 'error');
    } finally { setAddrSaving(false); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    setDeletingId(id);
    try {
      const r = await usersApi.deleteAddress(id);
      setAddresses(r.data?.data?.addresses || r.data?.addresses || addresses.filter(a => a._id !== id));
      toast('Address removed');
    } catch (e) {
      toast(e?.response?.data?.message || 'Failed to remove address', 'error');
    } finally { setDeletingId(null); }
  };

  const navItems = [
    { id: 'profile',        icon: <User size={16} />,        label: 'My Profile' },
    { id: 'addresses',      icon: <MapPin size={16} />,       label: 'My Addresses' },
    { id: 'refund-details', icon: <CreditCard size={16} />,  label: 'Refund Details' },
    { id: 'orders',         icon: <Package size={16} />,      label: 'My Orders',    action: () => navigate('/orders') },
    { id: 'wishlist',       icon: <Heart size={16} />,        label: 'Wishlist',     action: () => navigate('/wishlist') },
    { id: 'password',       icon: <Lock size={16} />,         label: 'Change Password' },
    { id: 'logout',         icon: <LogOut size={16} />,       label: 'Sign Out',     action: handleLogout, danger: true },
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
        <div className="card p-8 max-md:p-4">

          {/* ── My Profile ─────────────────────────────────── */}
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
                    className={`input${errors.phone ? ' error' : ''}`}
                    value={form.phone}
                    onChange={e => { setForm(f => ({ ...f, phone: cleanPhone(e.target.value) })); setErrors(err => ({ ...err, phone: undefined })); }}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                  />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
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

          {/* ── My Addresses ───────────────────────────────── */}
          {activeTab === 'addresses' && (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
                <h2 className="text-lg font-bold">My Addresses</h2>
                {!showAddForm && (
                  <button className="btn btn-primary flex items-center gap-2 text-sm py-2"
                    onClick={() => { setShowAddForm(true); setEditId(null); }}>
                    <Plus size={15} /> Add New Address
                  </button>
                )}
              </div>

              {/* Add form */}
              {showAddForm && (
                <AddressForm
                  onSave={handleAddAddress}
                  onCancel={() => setShowAddForm(false)}
                  saving={addrSaving}
                />
              )}

              {/* Address cards */}
              {addresses.length === 0 && !showAddForm ? (
                <div className="text-center py-16 text-mute">
                  <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                  <div className="font-semibold text-base mb-1">No saved addresses</div>
                  <div className="text-sm">Add an address for faster checkout</div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="border border-line rounded-xl overflow-hidden">
                      {editId === addr._id ? (
                        <div className="p-5">
                          <div className="font-semibold text-sm mb-1">Edit Address</div>
                          <AddressForm
                            initial={addr}
                            onSave={(data) => handleUpdateAddress(addr._id, data)}
                            onCancel={() => setEditId(null)}
                            saving={addrSaving}
                          />
                        </div>
                      ) : (
                        <div className="p-5 flex gap-4 items-start">
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin size={16} className="text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm">{addr.fullName}</div>
                            <div className="text-sm text-mute mt-0.5">{addr.phone}</div>
                            <div className="text-sm text-ink mt-1 leading-relaxed">
                              {[addr.houseNo, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                              {addr.landmark && <span className="text-mute"> · Near {addr.landmark}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => { setEditId(addr._id); setShowAddForm(false); }}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line hover:bg-surface transition-colors text-mute hover:text-ink">
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              disabled={deletingId === addr._id}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-500">
                              {deletingId === addr._id ? <span className="spinner" style={{ width:12, height:12 }} /> : <Trash2 size={12} />}
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Refund Details ─────────────────────────────── */}
          {activeTab === 'refund-details' && (
            <>
              <h2 className="text-lg font-bold mb-2 pb-4 border-b border-line">Refund Details</h2>
              <p className="text-sm text-mute mb-6">Saved bank or UPI details used for processing refunds on your return requests.</p>
              {refundLoading ? (
                <div className="text-center py-16 text-mute"><span className="spinner" /></div>
              ) : (
                <>
                  {/* Tab switcher */}
                  <div className="flex gap-2 mb-6">
                    {[{id:'bank', label:'🏦 Bank Transfer'}, {id:'upi', label:'📱 UPI'}].map(t => (
                      <button key={t.id} onClick={() => setRefundTab(t.id)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${refundTab===t.id ? 'bg-ink text-white border-ink' : 'bg-transparent text-mute border-line hover:bg-surface'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {refundTab === 'bank' && (
                    <>
                      <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
                        {[
                          { k:'accountName',   label:'Account Holder Name *', placeholder:'As per bank records' },
                          { k:'bankName',      label:'Bank Name *',            placeholder:'State Bank of India' },
                          { k:'accountNumber', label:'Account Number *',       placeholder:'1234567890' },
                          { k:'ifscCode',      label:'IFSC Code *',            placeholder:'SBIN0001234' },
                        ].map(({ k, label, placeholder }) => (
                          <div key={k} className="field">
                            <label>{label}</label>
                            <input className="input" value={bankForm[k]} placeholder={placeholder}
                              onChange={e => setBankForm(f => ({ ...f, [k]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-primary" onClick={handleSaveBank} disabled={refundSaving}>
                        {refundSaving ? <span className="spinner" /> : 'Save Bank Details'}
                      </button>
                    </>
                  )}

                  {refundTab === 'upi' && (
                    <>
                      <div className="flex flex-col gap-5 mb-5" style={{ maxWidth:420 }}>
                        <div className="field">
                          <label>UPI ID *</label>
                          <input className={`input ${upiMismatch ? 'error' : ''}`} value={upiForm.upiId} placeholder="yourname@paytm / @gpay / @ybl"
                            onChange={e => { setUpiForm({ upiId: e.target.value }); setUpiMismatch(false); }} />
                        </div>
                        <div className="field">
                          <label>Confirm UPI ID *</label>
                          <input className={`input ${upiMismatch ? 'error' : ''}`} value={upiConfirm} placeholder="Re-enter UPI ID to confirm"
                            onChange={e => { setUpiConfirm(e.target.value); setUpiMismatch(false); }} />
                          {upiMismatch && <div className="field-error">UPI IDs do not match</div>}
                          {!upiMismatch && upiForm.upiId && upiConfirm && upiForm.upiId === upiConfirm && (
                            <div className="text-[12px] text-green-600 font-semibold mt-1">✓ UPI IDs match</div>
                          )}
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={handleSaveUpi} disabled={refundSaving}>
                        {refundSaving ? <span className="spinner" /> : 'Save UPI ID'}
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Change Password ────────────────────────────── */}
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
