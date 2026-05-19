import { useNavigate } from 'react-router-dom';
import ProductCard from '../product/ProductCard';

export default function ProductSection({ title, subtitle, products, viewAllLink }) {
  const navigate = useNavigate();
  return (
    <section className="py-18">
      <div className="wrap">
        <div className="flex items-end justify-between mb-9 gap-6">
          <div>
            <div className="kicker">{subtitle}</div>
            <h2 className="font-serif text-[44px] leading-none tracking-tight font-normal mt-2" dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(viewAllLink || '/products')}>View all</button>
        </div>
        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-3 max-md:grid-cols-2">
          {products.map(p => <ProductCard key={p._id || p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
