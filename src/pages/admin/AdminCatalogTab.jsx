import { useState, useEffect } from 'react';
import { brandsApi, categoriesApi, attributesApi, eventsApi } from '../../api/catalog';
import { useCatalog } from '../../context/CatalogContext';

const C = { accent: '#FF5A1F', dark: '#0f172a', mute: '#6b7280', border: '#e5e7eb', surface: '#f8fafc' };

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
    <div style={{ background: 'white', borderRadius: 10, border: `1px solid ${C.border}`, padding: '24px', marginBottom: 20 }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontWeight: 800, fontSize: 17, color: C.dark, marginBottom: 16 }}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.mute }}>{label}</label>}
      <input style={{ height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6,
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.mute }}>{label}</label>}
      <select style={{ height: 38, padding: '0 10px', border: `1px solid ${C.border}`, borderRadius: 6,
        fontSize: 13, outline: 'none', background: 'white', width: '100%' }} {...props}>
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant = 'primary', ...props }) {
  const bg = variant === 'primary' ? C.accent : variant === 'danger' ? '#ef4444' : '#f1f5f9';
  const color = variant === 'ghost' ? C.dark : 'white';
  return (
    <button style={{ padding: '8px 18px', background: bg, color, border: 'none', borderRadius: 6,
      fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} {...props}>
      {children}
    </button>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0f4ff',
      border: '1px solid #c7d2fe', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#3730a3' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: '#6366f1', fontWeight: 800, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
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
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => brandsApi.getAll().then(r => setBrands(r.data?.data?.brands || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await brandsApi.create({ name: name.trim() }).catch(() => {});
    setName('');
    setSaving(false);
    load(); onMutate?.();
  };

  const remove = async (id) => {
    await brandsApi.remove(id).catch(() => {});
    load(); onMutate?.();
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Brand</SectionTitle>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><Input label="Brand Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samsung" required /></div>
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
                <tr key={b._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13 }}>{b.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute, fontFamily: 'monospace' }}>{b.slug}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Btn variant="danger" onClick={() => remove(b._id)}>Delete</Btn>
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
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const topLevel = cats.filter(c => !c.parent);
  const load = () => categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await categoriesApi.create({ name: name.trim(), description: desc }).catch(() => {});
    setName(''); setDesc('');
    setSaving(false);
    load(); onMutate?.();
  };

  const remove = async (id) => {
    await categoriesApi.remove(id).catch(() => {});
    load(); onMutate?.();
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Category</SectionTitle>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <Input label="Category Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Washing Machines" required />
          <Input label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description" />
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
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13 }}>{c.name}</td>
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
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const topLevel = cats.filter(c => !c.parent);
  const subCats  = cats.filter(c => c.parent);
  const load = () => categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !parent) return;
    setSaving(true);
    await categoriesApi.create({ name: name.trim(), description: desc, parent }).catch(() => {});
    setName(''); setDesc(''); setParent('');
    setSaving(false);
    load(); onMutate?.();
  };

  const remove = async (id) => {
    await categoriesApi.remove(id).catch(() => {});
    load(); onMutate?.();
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Sub-category</SectionTitle>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <Select label="Parent Category" value={parent} onChange={e => setParent(e.target.value)} required>
            <option value="">Select parent…</option>
            {topLevel.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Sub-category Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Load" required />
          <Input label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description" />
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
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13 }}>{c.name}</td>
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
  const [attrs, setAttrs]     = useState([]);
  const [cats, setCats]       = useState([]);
  const [name, setName]       = useState('');
  const [unit, setUnit]       = useState('');
  const [subcat, setSubcat]   = useState('');
  const [optInput, setOptInput] = useState('');
  const [options, setOptions] = useState([]);
  const [saving, setSaving]   = useState(false);

  const subCats = cats.filter(c => c.parent);

  const load = () => {
    attributesApi.getAll().then(r => setAttrs(r.data?.data?.attributes || [])).catch(() => {});
    categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addOption = () => {
    const val = optInput.trim();
    if (val && !options.includes(val)) setOptions(prev => [...prev, val]);
    setOptInput('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subcat) return;
    setSaving(true);
    await attributesApi.create({ name: name.trim(), unit: unit.trim(), subcategory: subcat, options }).catch(() => {});
    setName(''); setUnit(''); setSubcat(''); setOptions([]);
    setSaving(false);
    load(); onMutate?.();
  };

  const remove = async (id) => {
    await attributesApi.remove(id).catch(() => {});
    load(); onMutate?.();
  };

  return (
    <>
      <Card>
        <SectionTitle>Add Attribute</SectionTitle>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Select label="Sub-category" value={subcat} onChange={e => setSubcat(e.target.value)} required>
              <option value="">Select sub-category…</option>
              {subCats.map(c => <option key={c._id} value={c._id}>{c.name} ({c.parent?.name})</option>)}
            </Select>
            <Input label="Attribute Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Capacity" required />
            <Input label="Unit (optional)" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. kg, ton, L" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 6 }}>Options</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={optInput} onChange={e => setOptInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                placeholder="Type option and press Enter or Add…"
                style={{ flex: 1, height: 36, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none' }} />
              <Btn type="button" variant="ghost" onClick={addOption}>Add</Btn>
            </div>
            {options.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {options.map(o => <Tag key={o} label={o} onRemove={() => setOptions(prev => prev.filter(x => x !== o))} />)}
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
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13 }}>{a.name}</td>
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
  const [events, setEvents]     = useState([]);
  const [name, setName]         = useState('');
  const [badge, setBadge]       = useState('');
  const [desc, setDesc]         = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStart]   = useState('');
  const [endDate, setEnd]       = useState('');
  const [saving, setSaving]     = useState(false);

  const load = () => eventsApi.getAll().then(r => setEvents(r.data?.data?.events || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('badge', badge.trim());
    fd.append('description', desc);
    fd.append('discountPercent', discount || 0);
    fd.append('startDate', startDate);
    fd.append('endDate', endDate);
    await eventsApi.create(fd).catch(() => {});
    setName(''); setBadge(''); setDesc(''); setDiscount(''); setStart(''); setEnd('');
    setSaving(false);
    load(); onMutate?.();
  };

  const remove = async (id) => {
    await eventsApi.remove(id).catch(() => {});
    load(); onMutate?.();
  };

  const toggleActive = async (ev) => {
    const fd = new FormData();
    fd.append('isActive', !ev.isActive);
    await eventsApi.update(ev._id, fd).catch(() => {});
    load(); onMutate?.();
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
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Event Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dashain Mega Sale" required />
            <Input label="Badge / Code" value={badge} onChange={e => setBadge(e.target.value)} placeholder="e.g. DASHAIN50" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Discount %" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 50" />
            <Input label="Start Date *" type="date" value={startDate} onChange={e => setStart(e.target.value)} required />
            <Input label="End Date *" type="date" value={endDate} onChange={e => setEnd(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 5 }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Short description of the event…"
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
                fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{ev.name}</div>
                    {ev.description && <div style={{ fontSize: 11, color: C.mute, marginTop: 2 }}>{ev.description}</div>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {ev.badge ? (
                      <span style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4,
                        padding: '2px 8px', fontSize: 11, fontWeight: 800, color: '#c2410c', fontFamily: 'monospace' }}>
                        {ev.badge}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: C.accent }}>
                    {ev.discountPercent > 0 ? `${ev.discountPercent}%` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.mute }}>
                    {fmt(ev.startDate)} → {fmt(ev.endDate)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {isLive(ev) ? (
                      <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>🟢 Live</span>
                    ) : ev.isActive ? (
                      <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>⏳ Scheduled</span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: C.mute, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>⏸ Inactive</span>
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
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ background: 'white', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px',
                background: section === s.id ? '#FFF4F0' : 'transparent',
                borderLeft: `3px solid ${section === s.id ? C.accent : 'transparent'}`,
                border: 'none', borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                fontSize: 13, fontWeight: section === s.id ? 700 : 500,
                color: section === s.id ? C.accent : C.dark, textAlign: 'left' }}>
              <span>{s.icon}</span>
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
