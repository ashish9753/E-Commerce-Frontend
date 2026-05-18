import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="pt-12 pb-0">
      <div className="wrap">
        <div className="grid grid-cols-[1.05fr_.95fr] gap-12 items-stretch max-md:grid-cols-1">
          <div className="flex flex-col justify-center gap-5">
            <div className="inline-flex items-center gap-2.5 bg-surface rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-ink w-fit">
              <b className="bg-accent text-white text-[10px] tracking-[0.06em] px-2.25 py-0.75 rounded-full font-bold">NEW</b>
              2024 Season Appliances
            </div>
            <h1 className="font-serif text-[clamp(48px,5.5vw,80px)] leading-[.98] tracking-[-0.035em] font-semibold text-ink">
              Power your <i className="text-accent">home</i> with the <span className="hero-underline">best</span> tech
            </h1>
            <p className="text-[17px] text-mute max-w-120 leading-[1.55]">
              Nepal's largest electronics & home appliances store. Authorized dealer warranty, EMI options, doorstep delivery across the Valley.
            </p>
            <div className="flex gap-3 mt-1">
              <button className="btn btn-accent" onClick={() => navigate('/products')}>Shop Now</button>
              <button className="btn btn-ghost" onClick={() => navigate('/products?category=Air Conditioners')}>View Deals</button>
            </div>
            <div className="flex gap-9 mt-6 pt-6 border-t border-line">
              {[['50K+','Happy Customers'],['200+','Brands'],['10K+','Products']].map(([n,l]) => (
                <div key={l}>
                  <div className="text-[28px] font-bold tracking-[-0.02em]">{n}</div>
                  <div className="text-xs text-mute font-medium tracking-[0.04em] uppercase mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1.3fr_1fr] grid-rows-[1fr_.8fr] gap-3.5 min-h-[540px] max-md:hidden">
            <div className="row-span-2 rounded-[18px] relative overflow-hidden flex items-end justify-center p-6" style={{ background: 'linear-gradient(170deg,#FFF4EE 0%,#FFE8D9 100%)' }}>
              <span className="text-[200px] leading-none absolute top-2/5 left-1/2 -translate-x-1/2 -translate-y-1/2">🧊</span>
              <span className="absolute top-3.5 left-3.5 bg-accent text-white text-[10px] font-bold px-2.5 py-1.25 rounded-full uppercase tracking-[0.06em]">−42%</span>
              <div className="relative z-10 w-full flex items-end justify-between">
                <span className="text-sm font-bold">Samsung Refrigerator</span>
                <span className="text-[13px] font-semibold"><s className="text-soft mr-1.5 font-normal">Rs. 64,900</s>Rs. 37,500</span>
              </div>
            </div>
            <div className="rounded-[18px] bg-ink text-white relative overflow-hidden flex items-end justify-center p-6">
              <span className="text-[100px] leading-none absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2">📺</span>
              <span className="absolute top-3.5 left-3.5 bg-white text-ink text-[10px] font-bold px-2.5 py-1.25 rounded-full uppercase tracking-[0.06em]">New</span>
              <div className="relative z-10 w-full flex items-end justify-between">
                <span className="text-sm font-bold">Sony 55" 4K TV</span>
                <span className="text-[13px] font-semibold">Rs. 1,12,000</span>
              </div>
            </div>
            <div className="rounded-[18px] bg-surface relative overflow-hidden flex items-end justify-center p-6">
              <span className="text-[100px] leading-none absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2">❄️</span>
              <div className="relative z-10 w-full flex items-end justify-between">
                <span className="text-sm font-bold">LG Inverter AC</span>
                <span className="text-[13px] font-semibold">Rs. 72,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
