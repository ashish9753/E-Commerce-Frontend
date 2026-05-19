import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../api/seller';
import { categoriesApi } from '../../api/categories';
import { getErrorMessage } from '../../api/client';

const TABS = ['Overview', 'My Products', 'Add Product'];

function StatCard({ label, value, color = '#FF5A1F' }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ profile, onRegister }) {
  if (!profile) {
    return (
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>You don't have a seller account yet</div>
        <div style={{ color: 'var(--mute)', marginBottom: 24 }}>Register as a seller to start listing products</div>
        <button className="btn btn-accent" onClick={onRegister}>Register as Seller</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Sales" value={`Rs. ${(profile.totalSales || 0).toLocaleString()}`} color="#22c55e" />
        <StatCard label="Rating" value={`${profile.rating?.toFixed(1) || '0.0'} ★`} color="#f59e0b" />
        <StatCard label="Verified" value={profile.isVerified ? 'Yes' : 'Pending'} color={profile.isVerified ? '#22c55e' : '#f59e0b'} />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Shop Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { label: 'Shop Name', value: profile.shopName },
            { label: 'GST Number', value: profile.gstNumber || '—' },
            { label: 'Business Address', value: profile.businessAddress || '—' },
            { label: 'Description', value: profile.shopDescription || '—' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontWeight: 600 }}>{f.value}</div>
            </div>
          ))}
        </div>

        {!profile.isVerified && (
          <div style={{ marginTop: 20, padding: 16, background: '#f59e0b11', border: '1px solid #f59e0b44', borderRadius: 12, fontSize: 13, color: '#f59e0b' }}>
            ⏳ Your seller account is pending admin verification. You can still add products, but they won't be publicly visible until verified.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── My Products ──────────────────────────────────────────────────────────────
function ProductsTab({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    sellerApi.getMyProducts({ limit: 100 }).then(r => {
      setProducts(r.data?.data?.products || r.data?.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    await sellerApi.deleteProduct(id).catch(() => {});
    setProducts(p => p.filter(x => x._id !== id));
    setDeleting(null);
  };

  const handleTogglePublish = async (p) => {
    setDeleting(p._id);
    await sellerApi.updateProduct(p._id, { isPublished: !p.isPublished }).catch(() => {});
    setProducts(prev => prev.map(x => x._id === p._id ? { ...x, isPublished: !p.isPublished } : x));
    setDeleting(null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading products…</div>;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>My Products ({products.length})</div>
      {products.length === 0 ? (
        <div style={{ color: 'var(--mute)', textAlign: 'center', padding: 48 }}>No products yet. Use "Add Product" tab to create one.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              {['Product', 'Category', 'Price', 'Stock', 'Published', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--mute)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--line)', opacity: deleting === p._id ? .5 : 1 }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--line)', overflow: 'hidden', flexShrink: 0 }}>
                      {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛍️</div>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mute)' }}>{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--mute)' }}>{typeof p.category === 'object' ? p.category?.name : p.category}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700 }}>Rs. {(p.discountPrice || p.price)?.toLocaleString()}</div>
                  {p.discountPrice && <div style={{ fontSize: 11, color: 'var(--mute)', textDecoration: 'line-through' }}>Rs. {p.price?.toLocaleString()}</div>}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: p.stock === 0 ? '#ef4444' : p.stock < 5 ? '#f59e0b' : 'inherit' }}>{p.stock}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => handleTogglePublish(p)} disabled={deleting === p._id}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: p.isPublished ? '#22c55e22' : '#ef444422', color: p.isPublished ? '#22c55e' : '#ef4444' }}>
                    {p.isPublished ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onEdit(p)}
                      style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p._id, p.title)} disabled={deleting === p._id}
                      style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid #ef444422', background: '#ef444411', cursor: 'pointer', color: '#ef4444' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Product Form (Add / Edit) ────────────────────────────────────────────────
function ProductForm({ initial, categories, onSave, onCancel }) {
  const empty = { title: '', description: '', shortDescription: '', brand: '', price: '', discountPrice: '', stock: '', category: '', isFeatured: false, isPublished: true };
  const [form, setForm] = useState(initial ? {
    title: initial.title || '',
    description: initial.description || '',
    shortDescription: initial.shortDescription || '',
    brand: initial.brand || '',
    price: initial.price || '',
    discountPrice: initial.discountPrice || '',
    stock: initial.stock ?? '',
    category: (typeof initial.category === 'object' ? initial.category?._id : initial.category) || '',
    isFeatured: initial.isFeatured || false,
    isPublished: initial.isPublished !== false,
  } : empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.price || !form.stock || !form.category) {
      setError('Title, description, price, stock, and category are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock),
      };
      await onSave(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
      <input
        type={type}
        className="input"
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24 }}>{initial ? 'Edit Product' : 'Add New Product'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field('Title *', 'title', 'text', 'Product name')}
        {field('Brand', 'brand', 'text', 'Brand name')}
        {field('Price (Rs.) *', 'price', 'number', '0')}
        {field('Discount Price (Rs.)', 'discountPrice', 'number', 'Leave blank if no discount')}
        {field('Stock *', 'stock', 'number', '0')}

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Category *</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Select category…</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Short Description</label>
        <input className="input" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="Brief product summary" />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Description *</label>
        <textarea className="input" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Full product description" style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
          Featured product
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />
          Publish immediately
        </label>
      </div>

      {error && <div style={{ marginTop: 16, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-accent" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="spinner" /> : initial ? 'Save Changes' : 'Add Product'}
        </button>
        {onCancel && <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
}

// ─── Register Seller Form ─────────────────────────────────────────────────────
function RegisterForm({ onDone }) {
  const [form, setForm] = useState({ shopName: '', shopDescription: '', gstNumber: '', businessAddress: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.shopName) { setError('Shop name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await sellerApi.registerSeller(form);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, maxWidth: 560 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Register as Seller</div>
      {[['Shop Name *', 'shopName'], ['GST Number', 'gstNumber'], ['Business Address', 'businessAddress']].map(([label, key]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
          <input className="input" value={form[key]} onChange={e => set(key, e.target.value)} />
        </div>
      ))}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Shop Description</label>
        <textarea className="input" rows={3} value={form.shopDescription} onChange={e => set('shopDescription', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <button className="btn btn-accent" onClick={handleSubmit} disabled={saving}>{saving ? <span className="spinner" /> : 'Register'}</button>
    </div>
  );
}

// ─── Main Seller Dashboard ────────────────────────────────────────────────────
export default function SellerDashboard() {
  const [tab, setTab] = useState('Overview');
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadProfile = useCallback(() => {
    sellerApi.getMyProfile().then(r => {
      setProfile(r.data?.data?.seller || r.data?.data || null);
    }).catch(() => setProfile(null)).finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
    categoriesApi.getAll().then(r => {
      setCategories(r.data?.data?.categories || r.data?.data || []);
    }).catch(() => {});
  }, [loadProfile]);

  const handleAddProduct = async (data) => {
    await sellerApi.createProduct(data);
    setTab('My Products');
  };

  const handleEditProduct = async (data) => {
    await sellerApi.updateProduct(editProduct._id, data);
    setEditProduct(null);
    setTab('My Products');
  };

  const tabs = profile ? TABS : ['Overview'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', paddingBottom: 60 }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--line)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Seller Dashboard</div>
            <div style={{ fontSize: 12, color: 'var(--mute)' }}>{profile ? `🏪 ${profile.shopName}` : `${user?.name} · ${user?.email}`}</div>
          </div>
          <button onClick={() => navigate('/')} style={{ fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer' }}>
            ← Storefront
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--line)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => { setTab(t); setEditProduct(null); }}
              style={{ fontWeight: 700, fontSize: 13, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--mute)', transition: 'all .15s' }}>
              {t}
            </button>
          ))}
          {editProduct && (
            <button style={{ fontWeight: 700, fontSize: 13, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid var(--accent)', color: 'var(--accent)' }}>
              Edit Product
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 40px' }}>
        {profileLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--mute)' }}>Loading…</div>
        ) : (
          <>
            {tab === 'Overview' && !profile && <RegisterForm onDone={() => { loadProfile(); setTab('Overview'); }} />}
            {tab === 'Overview' && profile && <OverviewTab profile={profile} />}
            {tab === 'My Products' && !editProduct && <ProductsTab onEdit={p => { setEditProduct(p); }} />}
            {tab === 'My Products' && editProduct && <ProductForm initial={editProduct} categories={categories} onSave={handleEditProduct} onCancel={() => setEditProduct(null)} />}
            {tab === 'Add Product' && <ProductForm categories={categories} onSave={handleAddProduct} />}
          </>
        )}
      </div>
    </div>
  );
}
