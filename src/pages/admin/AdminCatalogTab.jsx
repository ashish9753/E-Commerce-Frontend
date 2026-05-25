import { useState, useEffect } from 'react';
import { brandsApi, categoriesApi, attributesApi, eventsApi } from '../../api/catalog';
import { useCatalog } from '../../context/CatalogContext';
import { useFormDraft } from '../../hooks/useFormDraft';

const C = {
  accent: '#f97316', mute: '#6b7280', sub: '#9ca3af',
  border: '#252b3b', card: '#161a22', card2: '#1b2030',
  text: '#e8eaf2', bg: '#0d0f14', surface: '#111318',
  red: '#ef4444', green: '#22c55e',
};

const SECTIONS = [
  { id: 'brands',     label: 'Brands',            icon: '🏷️' },
  { id: 'categories', label: 'Categories',         icon: '📂' },
  { id: 'subcats',    label: 'Sub-categories',     icon: '📁' },
  { id: 'attributes', label: 'Attributes',         icon: '⚙️' },
  { id: 'events',     label: 'Events / Schemes',   icon: '🎉' },
];

/* ── shared helpers ── */
function Card({ children }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '22px', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.mute }}>{label}</label>}
      <input style={{ height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6,
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', background: C.bg, color: C.text }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.mute }}>{label}</label>}
      <select style={{ height: 38, padding: '0 10px', border: `1px solid ${C.border}`, borderRadius: 6,
        fontSize: 13, outline: 'none', background: C.bg, color: C.text, width: '100%' }} {...props}>
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant = 'primary', ...props }) {
  const styles = {
    primary: { background: C.accent,    color: 'white',  border: 'none' },
    danger:  { background: C.red,       color: 'white',  border: 'none' },
    ghost:   { background: C.card2,     color: C.sub,    border: `1px solid ${C.border}` },
  };
  return (
    <button style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif",
      ...styles[variant] }} {...props}>
      {children}
    </button>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(249,115,22,.12)',
      border: '1px solid rgba(249,115,22,.3)', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: C.accent }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: C.accent, fontWeight: 800, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
    </span>
  );
}

function EmptyRow({ cols, text }) {
  return (
    <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '32px', color: C.mute, fontSize: 13 }}>{text}</td></tr>
  );
}

function TableHead({ cols }) {
  return (
    <thead>
      <tr style={{ background: C.surface }}>
        {cols.map(c => (
          <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11,
            fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '.06em',
            borderBottom: `1px solid ${C.border}` }}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

/* ════════════════════ BRANDS ════════════════════ */
function BrandsSection({ onMutate }) {
  const [brands, setBrands] = useState([]);
  const [draft, setDraft, clearDraft] = useFormDraft('catalog-brand', { name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Admin view includes hidden (isActive=false) brands so they can be restored
  // instead of confusing the admin with "duplicate" errors when re-adding.
  const load = () => brandsApi.getAllAdmin().then(r => setBrands(r.data?.data?.brands || [])).catch(err => {
    console.error('Failed to load brands:', err);
    setError('Failed to load brands');
  });
  useEffect(() => { load(); }, []);

  const restore = async (id) => {
    setError('');
    try {
      await brandsApi.restore(id);
      load();
      onMutate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore brand');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await brandsApi.create({ name: draft.name.trim() });
      clearDraft();
      load(); 
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create brand';
      setError(msg);
      console.error('Brand creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await brandsApi.remove(id);
      load(); 
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete brand';
      setError(msg);
      console.error('Brand deletion error:', err);
    }
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Brand</SectionTitle>
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, 
            padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.red, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><Input label="Brand Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Samsung" required /></div>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : '+ Add Brand'}</Btn>
        </form>
      </Card>

      <Card>
        <SectionTitle>All Brands</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead cols={['Brand Name', 'Slug', 'Action']} />
          <tbody>
            {brands.length === 0 ? <EmptyRow cols={3} text="No brands yet" /> :
              brands.map(b => (
                <tr key={b._id} style={{ borderBottom: `1px solid ${C.border}`, opacity: b.isActive === false ? 0.6 : 1 }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {b.name}
                    {b.isActive === false && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(234,179,8,.15)', color: '#eab308', border: '1px solid rgba(234,179,8,.35)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Hidden
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute, fontFamily: 'monospace' }}>{b.slug}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {b.isActive === false
                      ? <Btn variant="primary" onClick={() => restore(b._id)}>Restore</Btn>
                      : <Btn variant="danger" onClick={() => remove(b._id)}>Delete</Btn>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ════════════════════ CATEGORIES ════════════════════ */
function CategoriesSection({ onMutate }) {
  const [cats, setCats] = useState([]);
  const [draft, setDraft, clearDraft] = useFormDraft('catalog-category', { name: '', desc: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const topLevel = cats.filter(c => !c.parent);
  const load = () => categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(err => {
    console.error('Failed to load categories:', err);
    setError('Failed to load categories');
  });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await categoriesApi.create({ name: draft.name.trim(), description: draft.desc });
      clearDraft();
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create category';
      setError(msg);
      console.error('Category creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await categoriesApi.remove(id);
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete category';
      setError(msg);
      console.error('Category deletion error:', err);
    }
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Category</SectionTitle>
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, 
            padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.red, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <Input label="Category Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Washing Machines" required />
          <Input label="Description (optional)" value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="Short description" />
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : '+ Add'}</Btn>
        </form>
      </Card>

      <Card>
        <SectionTitle>Top-level Categories</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead cols={['Name', 'Slug', 'Description', 'Action']} />
          <tbody>
            {topLevel.length === 0 ? <EmptyRow cols={4} text="No categories yet" /> :
              topLevel.map(c => (
                <tr key={c._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, color: C.text }}>{c.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute, fontFamily: 'monospace' }}>{c.slug}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>{c.description || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Btn variant="danger" onClick={() => remove(c._id)}>Delete</Btn>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ════════════════════ SUB-CATEGORIES ════════════════════ */
function SubCategoriesSection({ onMutate }) {
  const [cats, setCats] = useState([]);
  const [draft, setDraft, clearDraft] = useFormDraft('catalog-subcat', { name: '', parent: '', desc: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const topLevel = cats.filter(c => !c.parent);
  const subCats  = cats.filter(c => c.parent);
  const load = () => categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(err => {
    console.error('Failed to load categories:', err);
    setError('Failed to load categories');
  });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.parent) return;
    setSaving(true);
    setError('');
    try {
      await categoriesApi.create({ name: draft.name.trim(), description: draft.desc, parent: draft.parent });
      clearDraft();
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create sub-category';
      setError(msg);
      console.error('Sub-category creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await categoriesApi.remove(id);
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete sub-category';
      setError(msg);
      console.error('Sub-category deletion error:', err);
    }
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Sub-category</SectionTitle>
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, 
            padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.red, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <Select label="Parent Category" value={draft.parent} onChange={e => setDraft(d => ({ ...d, parent: e.target.value }))} required>
            <option value="">Select parent…</option>
            {topLevel.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Sub-category Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Front Load" required />
          <Input label="Description (optional)" value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="Short description" />
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : '+ Add'}</Btn>
        </form>
      </Card>

      <Card>
        <SectionTitle>All Sub-categories</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead cols={['Sub-category', 'Parent', 'Description', 'Action']} />
          <tbody>
            {subCats.length === 0 ? <EmptyRow cols={4} text="No sub-categories yet" /> :
              subCats.map(c => (
                <tr key={c._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, color: C.text }}>{c.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>{c.parent?.name || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>{c.description || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Btn variant="danger" onClick={() => remove(c._id)}>Delete</Btn>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ════════════════════ ATTRIBUTES ════════════════════ */
function AttributesSection({ onMutate }) {
  const [attrs, setAttrs] = useState([]);
  const [cats, setCats]   = useState([]);
  const [draft, setDraft, clearDraft] = useFormDraft('catalog-attr', { name: '', unit: '', subcat: '', options: [] });
  const [optInput, setOptInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subCats = cats.filter(c => c.parent);

  const load = () => {
    attributesApi.getAll().then(r => setAttrs(r.data?.data?.attributes || [])).catch(err => {
      console.error('Failed to load attributes:', err);
      setError('Failed to load attributes');
    });
    categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(err => {
      console.error('Failed to load categories:', err);
    });
  };
  useEffect(() => { load(); }, []);

  const addOption = () => {
    const val = optInput.trim();
    if (val && !draft.options.includes(val)) setDraft(d => ({ ...d, options: [...d.options, val] }));
    setOptInput('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.subcat) return;
    setSaving(true);
    setError('');
    try {
      await attributesApi.create({ name: draft.name.trim(), unit: draft.unit.trim(), subcategory: draft.subcat, options: draft.options });
      clearDraft();
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create attribute';
      setError(msg);
      console.error('Attribute creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await attributesApi.remove(id);
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete attribute';
      setError(msg);
      console.error('Attribute deletion error:', err);
    }
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Attribute</SectionTitle>
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, 
            padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.red, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Select label="Sub-category" value={draft.subcat} onChange={e => setDraft(d => ({ ...d, subcat: e.target.value }))} required>
              <option value="">Select sub-category…</option>
              {subCats.map(c => <option key={c._id} value={c._id}>{c.name} ({c.parent?.name})</option>)}
            </Select>
            <Input label="Attribute Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Capacity" required />
            <Input label="Unit (optional)" value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} placeholder="e.g. kg, ton, L" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 6 }}>Options</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={optInput} onChange={e => setOptInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                placeholder="Type option and press Enter or Add…"
                className="inp-dark"
                style={{ flex: 1, height: 36, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', background: C.bg, color: C.text }} />
              <Btn type="button" variant="ghost" onClick={addOption}>Add</Btn>
            </div>
            {draft.options.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {draft.options.map(o => <Tag key={o} label={o} onRemove={() => setDraft(d => ({ ...d, options: d.options.filter(x => x !== o) }))} />)}
              </div>
            )}
          </div>

          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : '+ Add Attribute'}</Btn>
        </form>
      </Card>

      <Card>
        <SectionTitle>All Attributes</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead cols={['Attribute', 'Unit', 'Sub-category', 'Options', 'Action']} />
          <tbody>
            {attrs.length === 0 ? <EmptyRow cols={5} text="No attributes yet" /> :
              attrs.map(a => (
                <tr key={a._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, color: C.text }}>{a.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>{a.unit || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>{a.subcategory?.name || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(a.options || []).map(o => (
                        <span key={o} style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 99,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#3730a3' }}>{o}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Btn variant="danger" onClick={() => remove(a._id)}>Delete</Btn>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ════════════════════ EVENTS ════════════════════ */
function EventsSection({ onMutate }) {
  const [events, setEvents] = useState([]);
  const [draft, setDraft, clearDraft] = useFormDraft('catalog-event', { name: '', badge: '', desc: '', discount: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const load = () => eventsApi.getAll().then(r => setEvents(r.data?.data?.events || [])).catch(err => {
    console.error('Failed to load events:', err);
    setError('Failed to load events');
  });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.startDate || !draft.endDate) return;
    setSaving(true);
    setError('');
    const fd = new FormData();
    fd.append('name', draft.name.trim());
    fd.append('badge', draft.badge.trim());
    fd.append('description', draft.desc);
    fd.append('discountPercent', draft.discount || 0);
    fd.append('startDate', draft.startDate);
    fd.append('endDate', draft.endDate);
    try {
      await eventsApi.create(fd);
      clearDraft();
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create event';
      setError(msg);
      console.error('Event creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await eventsApi.remove(id);
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete event';
      setError(msg);
      console.error('Event deletion error:', err);
    }
  };

  const toggleActive = async (ev) => {
    setError('');
    const fd = new FormData();
    fd.append('isActive', !ev.isActive);
    try {
      await eventsApi.update(ev._id, fd);
      load();
      onMutate?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to toggle event';
      setError(msg);
      console.error('Event toggle error:', err);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const isLive = (ev) => {
    const now = Date.now();
    return ev.isActive && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now;
  };

  return (
    <>
      <Card>
        <SectionTitle>Create Event / Scheme</SectionTitle>
        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, 
            padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.red, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Event Name *" value={draft.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dashain Mega Sale" required />
            <Input label="Badge / Code" value={draft.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. DASHAIN50" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Discount %" type="number" min="0" max="100" value={draft.discount} onChange={e => set('discount', e.target.value)} placeholder="e.g. 50" />
            <Input label="Start Date *" type="date" value={draft.startDate} onChange={e => set('startDate', e.target.value)} required />
            <Input label="End Date *" type="date" value={draft.endDate} onChange={e => set('endDate', e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 5 }}>Description</label>
            <textarea value={draft.desc} onChange={e => set('desc', e.target.value)} rows={2}
              placeholder="Short description of the event…"
              className="inp-dark"
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
                fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', background: C.bg, color: C.text }} />
          </div>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : '🎉 Create Event'}</Btn>
        </form>
      </Card>

      <Card>
        <SectionTitle>All Events / Schemes</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead cols={['Event', 'Badge', 'Discount', 'Dates', 'Status', 'Actions']} />
          <tbody>
            {events.length === 0 ? <EmptyRow cols={6} text="No events yet" /> :
              events.map(ev => (
                <tr key={ev._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{ev.name}</div>
                    {ev.description && <div style={{ fontSize: 11, color: C.mute, marginTop: 2 }}>{ev.description}</div>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {ev.badge ? (
                      <span style={{ background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 4,
                        padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: 'monospace' }}>
                        {ev.badge}
                      </span>
                    ) : <span style={{ color: C.mute }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: C.accent }}>
                    {ev.discountPercent > 0 ? `${ev.discountPercent}%` : <span style={{ color: C.mute }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>
                    {fmt(ev.startDate)} → {fmt(ev.endDate)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {isLive(ev) ? (
                      <span style={{ background: 'rgba(34,197,94,.15)', color: C.green, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Live</span>
                    ) : ev.isActive ? (
                      <span style={{ background: 'rgba(234,179,8,.15)', color: '#eab308', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Scheduled</span>
                    ) : (
                      <span style={{ background: 'rgba(107,114,128,.15)', color: C.mute, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', display: 'flex', gap: 6 }}>
                    <Btn variant="ghost" onClick={() => toggleActive(ev)}>{ev.isActive ? 'Deactivate' : 'Activate'}</Btn>
                    <Btn variant="danger" onClick={() => remove(ev._id)}>Delete</Btn>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ════════════════════ MAIN EXPORT ════════════════════ */
export default function AdminCatalogTab() {
  const [section, setSection] = useState('brands');
  const { refresh } = useCatalog();

  const renderSection = () => {
    if (section === 'brands')     return <BrandsSection onMutate={refresh} />;
    if (section === 'categories') return <CategoriesSection onMutate={refresh} />;
    if (section === 'subcats')    return <SubCategoriesSection onMutate={refresh} />;
    if (section === 'attributes') return <AttributesSection onMutate={refresh} />;
    if (section === 'events')     return <EventsSection onMutate={refresh} />;
  };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Left mini-nav */}
      <div style={{ width: 190, flexShrink: 0 }}>
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '8px 8px' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px',
                background: section === s.id ? '#1e2535' : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                fontSize: 13.5, fontWeight: section === s.id ? 600 : 400,
                color: section === s.id ? C.text : C.sub, textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              <span style={{ fontSize: 15, opacity: section === s.id ? 1 : 0.7 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderSection()}
      </div>
    </div>
  );
}
