import { useNavigate } from 'react-router-dom';
import { categories } from '../../data/categories';

export default function CategoryGrid() {
  const navigate = useNavigate();
  return (
    <section className="py-18">
      <div className="wrap">
        <div className="flex items-end justify-between mb-9 gap-6">
          <div>
            <div className="kicker">Categories</div>
            <h2 className="font-serif text-[44px] leading-none tracking-[-0.025em] font-normal mt-2">Shop by <i className="text-accent">category</i></h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}>View all</button>
        </div>

        <div className="grid grid-cols-6 gap-3.5 max-lg:grid-cols-4 max-md:grid-cols-3">
          <div
            className="col-span-2 bg-ink text-white rounded-[18px] p-6 relative overflow-hidden flex flex-col justify-between items-start cursor-pointer min-h-40 transition-all duration-250 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => navigate('/products?category=Televisions')}
          >
            <div className="absolute -right-7 -top-7 w-45 h-45 rounded-full bg-accent/18" />
            <span className="text-[64px] leading-none relative">📺</span>
            <div>
              <div className="font-serif text-[22px] font-normal leading-[1.1]">Smart TVs</div>
              <div className="text-white/50 text-[11px] font-medium mt-0.75">95 Products</div>
            </div>
          </div>

          {categories.slice(0, 8).map(c => (
            <div
              key={c.id}
              className="bg-surface rounded-[18px] px-4 py-5.5 pb-4.5 text-center relative overflow-hidden cursor-pointer transition-all duration-250 border border-transparent hover:bg-white hover:border-line-2 hover:-translate-y-0.75 hover:shadow-md"
              onClick={() => navigate(`/products?category=${encodeURIComponent(c.name)}`)}
            >
              <span className="text-[42px] leading-none mb-3.5 block">{c.emo}</span>
              <div className="text-[13px] font-bold tracking-[-0.01em]">{c.name}</div>
              <div className="text-[11px] text-soft mt-0.75 font-medium">{c.count} Products</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
