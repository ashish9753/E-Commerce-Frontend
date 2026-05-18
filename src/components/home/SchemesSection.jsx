import { useNavigate } from 'react-router-dom';

const schemes = [
  { bg: 'linear-gradient(150deg,#FFE8D9 0%,#FFD4B5 100%)', color: 'text-ink', accentLabel: false, label: 'Limited Time', title: 'Dashain Offer', visual: '🪔', pct: '50' },
  { bg: '#0A0A0A', color: 'text-white', accentLabel: true, label: 'Flash Sale', title: 'Flash Sale', visual: '⚡', pct: '30' },
  { bg: 'linear-gradient(150deg,#E8F1FE 0%,#D5E5FC 100%)', color: 'text-info', accentLabel: false, label: 'Season Special', title: 'Summer Scheme', visual: '☀️', pct: '25' },
];

export default function SchemesSection() {
  const navigate = useNavigate();
  return (
    <section className="py-18">
      <div className="wrap">
        <div className="flex items-end justify-between mb-9 gap-6">
          <div>
            <div className="kicker">Offers</div>
            <h2 className="font-serif text-[44px] leading-none tracking-[-0.025em] font-normal mt-2">Ongoing <i className="text-accent">schemes</i></h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
          {schemes.map((s, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-[20px] p-7 min-h-50 flex flex-col justify-between cursor-pointer ${s.color}`}
              style={{ background: s.bg }}
              onClick={() => navigate('/products')}
            >
              <div>
                <div className={`text-[11px] font-bold tracking-[0.12em] uppercase opacity-70 ${s.accentLabel ? '!text-accent !opacity-100' : ''}`}>{s.label}</div>
                <h3 className="font-serif font-normal text-[34px] leading-[1.05] tracking-[-0.02em] mt-3">{s.title}</h3>
                <div className="text-[80px] font-extrabold tracking-[-0.04em] leading-[0.9]">{s.pct}%</div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.bg === '#0A0A0A' ? 'bg-white/12' : 'bg-black/8'}`}>→</div>
              <span className="absolute -right-2.5 -bottom-5 text-[140px] leading-none opacity-85 pointer-events-none">{s.visual}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
