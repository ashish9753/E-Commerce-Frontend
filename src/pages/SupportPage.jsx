import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supportApi } from '../api/support';
import { ordersApi } from '../api/orders';
import SupportIcon from '../components/icons/SupportIcon';

const STATUS_META = {
  OPEN:        { label: 'Open',        color: '#3b82f6', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  RESOLVED:    { label: 'Resolved',    color: '#16a34a', bg: '#dcfce7' },
  CLOSED:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.OPEN;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, background:m.bg, color:m.color }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />
      {m.label}
    </span>
  );
}

const ORDER_STATUS_META = {
  PLACED:           { label:'Order Placed',      color:'#f59e0b' },
  CONFIRMED:        { label:'Confirmed',          color:'#3b82f6' },
  PACKED:           { label:'Packed',             color:'#8b5cf6' },
  SHIPPED:          { label:'Shipped',            color:'#06b6d4' },
  OUT_FOR_DELIVERY: { label:'Out for Delivery',   color:'#FF5A1F' },
  DELIVERED:        { label:'Delivered',          color:'#16a34a' },
  CANCELLED:        { label:'Cancelled',          color:'#dc2626' },
  RETURNED:         { label:'Returned',           color:'#6b7280' },
};

function NewTicketModal({ onClose, onCreated, prefillOrderId = '' }) {
  const [subject, setSubject]     = useState('');
  const [message, setMessage]     = useState('');
  const [orderId, setOrderId]     = useState(prefillOrderId);
  const [orders, setOrders]       = useState([]);
  const [loadingOrders, setLO]    = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  useEffect(() => {
    ordersApi.getMy({ limit: 50 })
      .then(res => {
        const list = res.data?.data?.data || res.data?.data || [];
        setOrders(list);
        if (prefillOrderId && !list.find(o => o._id === prefillOrderId)) setOrderId('');
      })
      .catch(() => {})
      .finally(() => setLO(false));
  }, []);

  const submit = async () => {
    if (!orderId) { setError('Please select the order this ticket is about.'); return; }
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await supportApi.createTicket({ subject: subject.trim(), message: message.trim(), orderId });
      onCreated(res.data?.data?.ticket);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create ticket.');
    } finally { setSaving(false); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const fmtRs   = (n) => `Rs. ${Number(n||0).toLocaleString('en-IN')}`;

  const selectedOrder = orders.find(o => o._id === orderId);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) { onClose(); setPickerOpen(false); } }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:16, width:'100%', maxWidth:540,
        boxShadow:'0 20px 60px #0003', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'#131921', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ color:'white', fontWeight:700, fontSize:15 }}>Open a Support Ticket</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        <div style={{ padding:24, overflowY:'auto' }}>
          {/* Order picker */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:5 }}>Select Order *</label>

            {loadingOrders ? (
              <div style={{ height:52, border:'1px solid #ddd', borderRadius:10, display:'flex', alignItems:'center',
                padding:'0 14px', fontSize:13, color:'#aaa' }}>Loading your orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding:'12px 14px', border:'1px solid #fecaca', borderRadius:10, fontSize:13, color:'#dc2626', background:'#fef2f2' }}>
                You have no orders to raise a ticket for.
              </div>
            ) : (
              <div style={{ position:'relative' }} ref={pickerRef}>
                {/* Trigger button — shows selected order or placeholder */}
                <button
                  type="button"
                  onClick={() => setPickerOpen(v => !v)}
                  style={{ width:'100%', border:`1.5px solid ${orderId ? '#ddd' : '#fca5a5'}`,
                    borderRadius:10, padding:'8px 12px', background:'white', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:10, textAlign:'left', outline:'none' }}>
                  {selectedOrder ? (
                    <>
                      {/* Stacked thumbnails */}
                      <div style={{ display:'flex', flexShrink:0 }}>
                        {(selectedOrder.orderItems || []).slice(0, 3).map((item, i) => (
                          <div key={i} style={{ width:40, height:40, borderRadius:8, border:'2px solid white',
                            marginLeft: i === 0 ? 0 : -10, background:'#f3f4f6', overflow:'hidden',
                            display:'flex', alignItems:'center', justifyContent:'center', zIndex: 3 - i }}>
                            {item.image
                              ? <img src={item.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                              : <span style={{ fontSize:18 }}>📦</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, marginBottom:1 }}>
                          Order #{selectedOrder._id.slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize:11, color:'#888' }}>
                          {fmtRs(selectedOrder.totalPrice)} · {fmtDate(selectedOrder.createdAt)}
                          <span style={{ marginLeft:6, fontWeight:700,
                            color: ORDER_STATUS_META[selectedOrder.orderStatus]?.color || '#888' }}>
                            {ORDER_STATUS_META[selectedOrder.orderStatus]?.label || selectedOrder.orderStatus}
                          </span>
                        </div>
                      </div>
                      <span style={{ color:'#aaa', fontSize:11 }}>▼</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize:20 }}>🛍️</span>
                      <span style={{ fontSize:13, color:'#aaa', flex:1 }}>— Choose an order —</span>
                      <span style={{ color:'#aaa', fontSize:11 }}>▼</span>
                    </>
                  )}
                </button>

                {/* Dropdown list */}
                {pickerOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:100,
                    background:'white', border:'1px solid #e5e7eb', borderRadius:12,
                    boxShadow:'0 8px 24px #00000018', maxHeight:280, overflowY:'auto' }}>
                    {orders.map(o => {
                      const statusMeta = ORDER_STATUS_META[o.orderStatus] || {};
                      const isSelected = o._id === orderId;
                      return (
                        <div key={o._id}
                          onClick={() => { setOrderId(o._id); setPickerOpen(false); }}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                            cursor:'pointer', background: isSelected ? '#FFF5F0' : 'white',
                            borderBottom:'1px solid #f3f4f6', transition:'background .1s' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'white'; }}>

                          {/* Product images — stacked */}
                          <div style={{ display:'flex', flexShrink:0 }}>
                            {(o.orderItems || []).slice(0, 3).map((item, i) => (
                              <div key={i} style={{ width:44, height:44, borderRadius:8,
                                border:`2px solid ${isSelected ? '#FF5A1F' : 'white'}`,
                                marginLeft: i === 0 ? 0 : -12, background:'#f3f4f6', overflow:'hidden',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                position:'relative', zIndex: 3 - i, boxShadow:'0 1px 3px #0001' }}>
                                {item.image
                                  ? <img src={item.image} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                                  : <span style={{ fontSize:20 }}>📦</span>}
                              </div>
                            ))}
                            {(o.orderItems || []).length > 3 && (
                              <div style={{ width:44, height:44, borderRadius:8, marginLeft:-12,
                                background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:11, fontWeight:700, color:'#6b7280', border:'2px solid white', zIndex:0 }}>
                                +{o.orderItems.length - 3}
                              </div>
                            )}
                          </div>

                          {/* Order info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>
                              Order #{o._id.slice(-8).toUpperCase()}
                            </div>
                            <div style={{ fontSize:11, color:'#888', marginBottom:2, overflow:'hidden',
                              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {(o.orderItems || []).map(i => i.title).filter(Boolean).join(', ')}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:'#555' }}>{fmtRs(o.totalPrice)}</span>
                              <span style={{ fontSize:10, color:'#bbb' }}>·</span>
                              <span style={{ fontSize:11, color:'#888' }}>{fmtDate(o.createdAt)}</span>
                              <span style={{ fontSize:10, color:'#bbb' }}>·</span>
                              <span style={{ fontSize:11, fontWeight:700, color: statusMeta.color || '#888' }}>
                                {statusMeta.label || o.orderStatus}
                              </span>
                            </div>
                          </div>

                          {isSelected && <span style={{ color:'#FF5A1F', fontSize:16, flexShrink:0 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:5 }}>Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. My order hasn't arrived"
              style={{ width:'100%', height:38, border:'1px solid #ddd', borderRadius:8, padding:'0 12px',
                fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:5 }}>Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
              placeholder="Describe your issue in detail…"
              style={{ width:'100%', border:'1px solid #ddd', borderRadius:8, padding:'10px 12px',
                fontSize:13, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
          {error && <div style={{ color:'#dc2626', fontSize:13, fontWeight:600, marginBottom:12,
            padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
          <button onClick={submit} disabled={saving || loadingOrders || orders.length === 0}
            style={{ width:'100%', padding:12, borderRadius:10, background:'#FF5A1F', color:'white',
              border:'none', fontWeight:700, fontSize:14, cursor:'pointer',
              opacity: (saving || loadingOrders || orders.length === 0) ? 0.6 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatView({ ticket, onBack, onUpdated }) {
  const { user }           = useAuth();
  const { lastSupportMsg } = useNotifications();
  const [reply, setReply]  = useState('');
  const [sending, setSend] = useState(false);
  const [error, setError]  = useState('');
  const bottomRef          = useRef(null);

  // Append incoming message directly from SSE payload — zero extra API calls
  useEffect(() => {
    if (!lastSupportMsg || lastSupportMsg.ticketId !== ticket._id) return;
    onUpdated({
      ...ticket,
      status:   lastSupportMsg.status,
      messages: [...(ticket.messages || []), lastSupportMsg.message],
    });
  }, [lastSupportMsg]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const send = async () => {
    if (!reply.trim()) return;
    setSend(true); setError('');
    try {
      const res = await supportApi.replyToTicket(ticket._id, { message: reply.trim() });
      setReply('');
      onUpdated(res.data?.data?.ticket);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to send reply.');
    } finally { setSend(false); }
  };

  const isClosed       = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const isUser         = user?.role !== 'admin';
  const hasAdminReply  = (ticket.messages || []).some(m => m.senderRole === 'admin');
  const waitingForTeam = isUser && !hasAdminReply && !isClosed;
  const [mode, setMode] = useState('message'); // 'message' | 'call'

  const SUPPORT_PHONE   = '+977-1-4XXXXXX';
  const SUPPORT_HOURS   = 'Mon–Sat: 10am – 6pm  ·  Sun: 11am – 4pm';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Sticky header ── */}
      <div style={{ background:'white', borderBottom:'1px solid #ddd', padding:'12px 20px',
        display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
        <button onClick={onBack}
          style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#555', padding:'0 4px', lineHeight:1 }}>
          ←
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ticket.subject}</div>
          <div style={{ fontSize:11, color:'#888', marginTop:1 }}>
            Ticket #{ticket._id?.slice(-8).toUpperCase()}
            {ticket.order && ` · Order #${ticket.order.orderNumber || ticket.order._id?.slice(-8).toUpperCase()}`}
          </div>
        </div>

        {/* Message / Call toggle */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:3, gap:2, flexShrink:0 }}>
          {[{ id:'message', label:'💬 Message' }, { id:'call', label:'📞 Call' }].map(opt => (
            <button key={opt.id} onClick={() => setMode(opt.id)}
              style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                background: mode === opt.id ? 'white' : 'transparent',
                color:      mode === opt.id ? '#FF5A1F' : '#64748b',
                boxShadow:  mode === opt.id ? '0 1px 4px #0000001a' : 'none',
                transition: 'all .15s' }}>
              {opt.label}
            </button>
          ))}
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* ── Call view ── */}
      {mode === 'call' && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f2', padding:24 }}>
          <div style={{ background:'white', borderRadius:20, padding:'40px 48px', textAlign:'center',
            boxShadow:'0 4px 24px #0000000f', border:'1px solid #e5e7eb', maxWidth:380, width:'100%' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'#dcfce7',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:34,
              margin:'0 auto 20px' }}>📞</div>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>Call Support</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>
              Our support team is available during business hours.
            </div>
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g,'')}`}
              style={{ display:'block', textDecoration:'none', background:'#f0fdf4',
                border:'2px solid #86efac', borderRadius:14, padding:'18px 24px', marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', letterSpacing:'.08em',
                textTransform:'uppercase', marginBottom:6 }}>Phone Number</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#15803d', letterSpacing:'.02em' }}>
                {SUPPORT_PHONE}
              </div>
            </a>
            <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.7 }}>
              🕐 {SUPPORT_HOURS}
            </div>
            <button onClick={() => setMode('message')}
              style={{ marginTop:24, background:'none', border:'1px solid #e5e7eb', borderRadius:8,
                padding:'8px 20px', fontSize:13, fontWeight:600, color:'#555', cursor:'pointer' }}>
              Back to messages
            </button>
          </div>
        </div>
      )}

      {/* ── Messages — only this area scrolls ── */}
      {mode === 'message' && (
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, background:'#f0f2f2' }}>
        {(ticket.messages || []).map((msg, i) => {
          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
          const isAdmin = msg.senderRole === 'admin';
          return (
            <div key={i} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth:'72%' }}>
                {!isMe && (
                  <div style={{ fontSize:11, fontWeight:700, color: isAdmin ? '#7c3aed' : '#555',
                    marginBottom:4, paddingLeft:4 }}>
                    {isAdmin ? '🛡️ Support Team' : (msg.sender?.name || 'You')}
                  </div>
                )}
                <div style={{
                  padding:'10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? '#FF5A1F' : 'white',
                  color: isMe ? 'white' : '#1a1a1a',
                  border: isMe ? 'none' : '1px solid #e5e7eb',
                  fontSize:13, lineHeight:1.6, boxShadow:'0 1px 2px #00000010',
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:3,
                  textAlign: isMe ? 'right' : 'left', paddingLeft:4 }}>
                  {new Date(msg.createdAt).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      )}

      {/* ── Sticky reply box — only in message mode ── */}
      {mode === 'message' && isClosed ? (
        <div style={{ background:'#f9fafb', borderTop:'1px solid #e5e7eb', padding:'14px 20px',
          textAlign:'center', color:'#888', fontSize:13, flexShrink:0 }}>
          This ticket is {ticket.status.toLowerCase()}. No further replies can be sent.
        </div>
      ) : mode === 'message' && waitingForTeam ? (
        <div style={{ background:'#fffbeb', borderTop:'1px solid #fde68a', padding:'14px 20px',
          display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ fontSize:22, flexShrink:0 }}>⏳</div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#92400e' }}>Waiting for our support team</div>
            <div style={{ fontSize:12, color:'#b45309', marginTop:2 }}>
              You'll be able to reply once a support agent responds to your ticket.
            </div>
          </div>
        </div>
      ) : mode === 'message' ? (
        <div style={{ background:'white', borderTop:'1px solid #ddd', padding:'12px 16px', flexShrink:0 }}>
          {error && <div style={{ color:'#dc2626', fontSize:12, marginBottom:6 }}>{error}</div>}
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              rows={2}
              style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px',
                fontSize:13, resize:'none', outline:'none', fontFamily:'inherit',
                boxSizing:'border-box', lineHeight:1.5, maxHeight:120, overflowY:'auto' }}
            />
            <button onClick={send} disabled={sending || !reply.trim()}
              style={{ background:'#FF5A1F', color:'white', border:'none', borderRadius:10,
                padding:'10px 20px', fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0,
                opacity: (sending || !reply.trim()) ? 0.6 : 1, whiteSpace:'nowrap' }}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SupportPage() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const { user }        = useAuth();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTicket, setActive]   = useState(null);
  const [loadingTicket, setLoadingT] = useState(false);
  const [showNew, setShowNew]       = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchTickets();

    // auto-open ticket from query param
    const tid = params.get('ticketId');
    if (tid) openTicket(tid);

    // auto-open new ticket modal if coming from order page
    const oid = params.get('orderId');
    if (oid) setShowNew(true);
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await supportApi.getMyTickets({ limit: 50 });
      setTickets(res.data?.data?.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openTicket = async (id) => {
    setLoadingT(true);
    try {
      const res = await supportApi.getTicket(id);
      setActive(res.data?.data?.ticket);
    } catch { /* ignore */ } finally { setLoadingT(false); }
  };

  const handleCreated = (ticket) => {
    setShowNew(false);
    setTickets(prev => [ticket, ...prev]);
    setActive(ticket);
  };

  const handleUpdated = (ticket) => {
    setActive(ticket);
    setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, status: ticket.status, updatedAt: ticket.updatedAt } : t));
  };

  if (!user) return null;

  // Chat view — fixed overlay covering the entire screen (header + footer hidden)
  if (activeTicket) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:50, background:'#f0f2f2', display:'flex', flexDirection:'column' }}>
        {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={handleCreated} prefillOrderId={params.get('orderId') || ''} />}
        <ChatView
          ticket={activeTicket}
          onBack={() => { setActive(null); fetchTickets(); }}
          onUpdated={handleUpdated}
        />
      </div>
    );
  }

  return (
    <div style={{ background:'#f0f2f2', minHeight:'100vh', padding:'24px 0 60px' }}>
      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={handleCreated} prefillOrderId={params.get('orderId') || ''} />}

      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 16px', display:'flex', flexDirection:'column', gap:12 }}>
        {/* Header */}
        <div style={{ background:'white', borderRadius:8, border:'1px solid #ddd',
          padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Support</h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'#666' }}>Get help with your orders and account</p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ background:'#FF5A1F', color:'white', border:'none', borderRadius:8,
              padding:'10px 20px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + New Ticket
          </button>
        </div>

        {loading ? (
          <div style={{ background:'white', borderRadius:8, border:'1px solid #ddd', padding:60, textAlign:'center', color:'#888' }}>
            <div className="spinner" style={{ width:32, height:32, margin:'0 auto 12px' }} />
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ background:'white', borderRadius:8, border:'1px solid #ddd',
            padding:'60px 24px', textAlign:'center' }}>
            <div style={{ marginBottom:16, display:'flex', justifyContent:'center' }}><SupportIcon size={56} color="#9ca3af" /></div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No support tickets yet</div>
            <div style={{ color:'#888', marginBottom:24, fontSize:14 }}>Have a question or issue? Open a ticket and our team will help you.</div>
            <button onClick={() => setShowNew(true)}
              style={{ background:'#FF5A1F', color:'white', border:'none', borderRadius:8,
                padding:'10px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Open a Ticket
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tickets.map(t => (
              <div key={t._id}
                onClick={() => openTicket(t._id)}
                style={{ background:'white', borderRadius:8, border:'1px solid #ddd',
                  padding:'16px 20px', cursor:'pointer', transition:'box-shadow .15s',
                  display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px #0001'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width:40, height:40, borderRadius:10, background:'#f0f2f2',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <SupportIcon size={22} color="#6b7280" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:3, overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subject}</div>
                  <div style={{ fontSize:12, color:'#888' }}>
                    #{t._id?.slice(-8).toUpperCase()}
                    {t.order && ` · Order #${t.order.orderNumber || t.order._id?.slice(-8).toUpperCase()}`}
                    {' · '}
                    {new Date(t.updatedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <StatusBadge status={t.status} />
                <span style={{ fontSize:12, color:'#007185', fontWeight:600 }}>View →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
