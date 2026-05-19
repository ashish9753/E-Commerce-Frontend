import { useNavigate } from 'react-router-dom';
import { categories } from '../../data/categories';

// Amazon-style: white card panels in a 5-col grid, each showing category + sub-items
const FEATURED_CATS = [
  { ...categories[2], subs: ['Smart TV', '4K TV', 'OLED', 'QLED'] },          // Televisions
  { ...categories[6], subs: ['Android', 'iPhones', 'Tablets', 'Accessories'] }, // Smartphones
  { ...categories[5], subs: ['Ultrabooks', 'Gaming', 'Business', '2-in-1'] },   // Laptops
  { ...categories[1], subs: ['Single Door', 'Double Door', 'Side-by-Side', 'French Door'] }, // Refrigerators
  { ...categories[0], subs: ['Split AC', 'Window AC', 'Tower AC', 'Cassette'] }, // AC
  { ...categories[4], subs: ['Microwave', 'Mixer', 'Gas Stove', 'Coffee Maker'] }, // Kitchen
  { ...categories[8], subs: ['Soundbars', 'Headphones', 'Earbuds', 'Speakers'] }, // Audio
  { ...categories[7], subs: ['Consoles', 'Gaming PCs', 'Accessories', 'Chairs'] }, // Gaming
];

export default function CategoryGrid() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
      {FEATURED_CATS.slice(0, 4).map(cat => (
        <div key={cat.id} style={{ background: 'white', borderRadius: 8, padding: '16px 16px 0', cursor: 'pointer', boxShadow: '0 1px 3px #0000000d' }}
          onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#0f172a' }}>
            {cat.emo} Shop {cat.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 0 }}>
            {cat.subs.map(sub => (
              <div key={sub}
                onClick={e => { e.stopPropagation(); navigate(`/products?category=${encodeURIComponent(cat.name)}`); }}
                style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', border: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                {sub}
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 0 12px', fontSize: 12, color: '#007185', fontWeight: 600 }}>
            See all →
          </div>
        </div>
      ))}
      {FEATURED_CATS.slice(4, 8).map(cat => (
        <div key={cat.id} style={{ background: 'white', borderRadius: 8, padding: '16px 16px 0', cursor: 'pointer', boxShadow: '0 1px 3px #0000000d' }}
          onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#0f172a' }}>
            {cat.emo} Shop {cat.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {cat.subs.map(sub => (
              <div key={sub}
                style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#374151', border: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                {sub}
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 0 12px', fontSize: 12, color: '#007185', fontWeight: 600 }}>
            See all →
          </div>
        </div>
      ))}
    </div>
  );
}
