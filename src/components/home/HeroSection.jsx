import { useState, useEffect } from 'react';

const SLIDES = ['/Banner1.png', '/Banner2.png', '/Banner3.png'];

export default function HeroSection() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const prev = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlide(s => (s + 1) % SLIDES.length);

  return (
    <div style={{ background: '#111' }}>
      {/* ── Main slider ── */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 420 }}>
        <div style={{
          display: 'flex', height: '100%',
          transform: `translateX(-${slide * 100}%)`,
          transition: 'transform .6s cubic-bezier(.4,0,.2,1)',
        }}>
          {SLIDES.map((src, i) => (
            <div key={i} style={{ width: '100%', flexShrink: 0, height: '100%' }}>
              <img
                src={src}
                alt={`Banner ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>

        {/* Left arrow */}
        <button onClick={prev} style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,.45)', border: 'none', color: 'white',
          fontSize: 30, cursor: 'pointer', padding: '22px 14px', lineHeight: 1, zIndex: 3,
        }}>‹</button>

        {/* Right arrow */}
        <button onClick={next} style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,.45)', border: 'none', color: 'white',
          fontSize: 30, cursor: 'pointer', padding: '22px 14px', lineHeight: 1, zIndex: 3,
        }}>›</button>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 24 : 8, height: 8, borderRadius: 4, padding: 0, border: 'none', cursor: 'pointer',
              background: i === slide ? '#FF5A1F' : 'rgba(255,255,255,.4)',
              transition: 'all .3s',
            }} />
          ))}
        </div>
      </div>

    </div>
  );
}
