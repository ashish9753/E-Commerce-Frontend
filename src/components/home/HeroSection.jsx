import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    src: '/Banner1.png',
    badge: 'FLASH SALE',
    title: 'Up to 20% Off',
    sub: 'On Premium Home Appliances',
    cta: 'Shop Now',
    link: '/products',
    align: 'left',
  },
  {
    src: '/Banner2.png',
    badge: 'NEW ARRIVALS',
    title: 'Latest Electronics',
    sub: 'Brand new 2024 models with warranty',
    cta: 'Explore Now',
    link: '/products?sort=newest',
    align: 'left',
  },
  {
    src: '/Banner3.png',
    badge: 'DASHAIN SPECIAL',
    title: 'Flat 50% Off',
    sub: 'Select appliances — limited time only',
    cta: 'View Deals',
    link: '/products',
    align: 'left',
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const prev = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlide(s => (s + 1) % SLIDES.length);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#131921', lineHeight: 0 }}>
      {/* Sliding track */}
      <div style={{
        display: 'flex',
        transform: `translateX(-${slide * 100}%)`,
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}>
        {SLIDES.map((s, i) => (
          <div key={i} style={{ position: 'relative', width: '100%', flexShrink: 0, lineHeight: 0 }}>
            <img
              src={s.src}
              alt={`Banner ${i + 1}`}
              style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 500 }}
            />
            {/* Dark gradient on left so text is readable */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 45%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            {/* Text overlay */}
            <div style={{
              position: 'absolute', top: '50%', left: '6%', transform: 'translateY(-50%)',
              color: 'white', lineHeight: 1,
            }}>
              <div style={{
                display: 'inline-block', background: '#FF5A1F', color: 'white',
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 4,
                letterSpacing: '.1em', marginBottom: 14, lineHeight: 1.4,
              }}>
                {s.badge}
              </div>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900,
                lineHeight: 1.1, marginBottom: 10, letterSpacing: '-.02em',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>
                {s.title}
              </div>
              <div style={{
                fontSize: 'clamp(13px, 1.4vw, 17px)', color: 'rgba(255,255,255,0.82)',
                marginBottom: 22, fontWeight: 400, lineHeight: 1.5,
                textShadow: '0 1px 6px rgba(0,0,0,0.3)',
              }}>
                {s.sub}
              </div>
              <button onClick={() => navigate(s.link)} style={{
                background: '#FF5A1F', color: 'white', border: 'none', borderRadius: 6,
                padding: '11px 26px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                letterSpacing: '.01em', lineHeight: 1,
              }}>
                {s.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button onClick={prev}
        style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(0,0,0,.35)', border: 'none', color: 'white', fontSize: 32, cursor: 'pointer',
          padding: '28px 12px', lineHeight: 1 }}>
        ‹
      </button>

      {/* Right arrow */}
      <button onClick={next}
        style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(0,0,0,.35)', border: 'none', color: 'white', fontSize: 32, cursor: 'pointer',
          padding: '28px 12px', lineHeight: 1 }}>
        ›
      </button>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            style={{ width: i === slide ? 22 : 7, height: 7, borderRadius: 4,
              background: i === slide ? 'white' : 'rgba(255,255,255,.4)',
              border: 'none', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}
