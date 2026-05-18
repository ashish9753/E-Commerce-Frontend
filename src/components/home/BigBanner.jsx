import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BigBanner() {
  const navigate = useNavigate();
  const TARGET = Date.now() + (2 * 24 + 7) * 3600 * 1000 + 42 * 60 * 1000;
  const [time, setTime] = useState({ d: '02', h: '07', m: '42', s: '00' });

  useEffect(() => {
    const z = n => String(n).padStart(2, '0');
    const tick = () => {
      const left = Math.max(0, TARGET - Date.now());
      setTime({ d: z(Math.floor(left / 86400000)), h: z(Math.floor(left % 86400000 / 3600000)), m: z(Math.floor(left % 3600000 / 60000)), s: z(Math.floor(left % 60000 / 1000)) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-18">
      <div className="wrap">
        <div className="bg-ink text-white rounded-3xl p-16 grid grid-cols-[1.2fr_1fr] gap-12 items-center relative overflow-hidden max-md:grid-cols-1 max-md:p-8">
          <div className="absolute -right-25 -top-25 w-100 h-100 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(255,90,31,.2) 0%,transparent 70%)' }} />
          <div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-accent">Flash Sale</div>
            <h2 className="font-serif text-[56px] leading-none tracking-[-0.025em] font-normal mt-3.5">Best deals, <i className="text-accent">limited</i> time</h2>
            <p className="text-white/60 max-w-95 mt-3.5">Up to 50% off on top brands. Free delivery on all orders above Rs. 5,000. Don't miss out!</p>
            <button className="btn btn-accent mt-6" onClick={() => navigate('/products')}>Shop the Sale →</button>
          </div>
          <div className="flex gap-3.5 justify-end relative z-10 max-md:justify-start">
            {[['Days', time.d], ['Hours', time.h], ['Mins', time.m], ['Secs', time.s]].map(([label, val]) => (
              <div key={label} className="bg-white/6 border border-white/10 rounded-[14px] p-4.5 min-w-22 text-center backdrop-blur-sm">
                <div className="font-serif text-[48px] leading-none font-normal">{val}</div>
                <div className="text-[10px] tracking-[0.14em] uppercase text-white/50 mt-1.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
