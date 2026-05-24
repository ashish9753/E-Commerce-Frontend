import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AirVent,
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Camera,
  ChevronRight,
  Headphones,
  Laptop,
  Monitor,
  PackageCheck,
  Refrigerator,
  ShieldCheck,
  Smartphone,
  Speaker,
  Sparkles,
  Truck,
  Tv,
  WashingMachine,
} from 'lucide-react';
import { productsApi } from '../api/products';
import { couponsApi } from '../api/coupons';
import { useCatalog } from '../context/CatalogContext';
import { cached } from '../utils/apiCache';
import { normalizeProducts } from '../utils/normalizers';

const heroSlides = [
  {
    image: '/Banner1.png',
    brand: 'Tech Carnival',
    title: 'Smartphones & audio essentials',
    offer: 'Min. 40% Off',
    path: '/products?category=Electronics',
  },
  {
    image: '/Banner2.png',
    brand: 'Home Upgrade Fest',
    title: 'Appliances for every room',
    offer: 'Min. 35% Off',
    path: '/products',
  },
  {
    image: '/Banner3.png',
    brand: 'New Season Tech',
    title: 'Premium gadgets, better prices',
    offer: 'No Cost EMI',
    path: '/products?sort=popular',
  },
];

const fallbackCategories = [
  { name: 'Smartphones', offer: '40-70% OFF' },
  { name: 'Laptops', offer: '20-45% OFF' },
  { name: 'Televisions', offer: '30-60% OFF' },
  { name: 'Refrigerators', offer: '25-55% OFF' },
  { name: 'Washing Machines', offer: '30-60% OFF' },
  { name: 'Air Conditioners', offer: '25-50% OFF' },
  { name: 'Headphones', offer: '50-80% OFF' },
  { name: 'Kitchen Appliances', offer: '35-70% OFF' },
  { name: 'Cameras', offer: '20-45% OFF' },
  { name: 'Speakers', offer: '45-75% OFF' },
  { name: 'Monitors', offer: '25-55% OFF' },
  { name: 'Accessories', offer: '60-85% OFF' },
];

const fallbackBrands = ['Samsung', 'LG', 'Sony', 'Bosch', 'Panasonic', 'Philips', 'Xiaomi', 'IFB'];

const categoryIcons = {
  smartphones: Smartphone,
  mobiles: Smartphone,
  laptops: Laptop,
  televisions: Tv,
  tv: Tv,
  refrigerators: Refrigerator,
  'washing machines': WashingMachine,
  'air conditioners': AirVent,
  headphones: Headphones,
  audio: Speaker,
  speakers: Speaker,
  cameras: Camera,
  monitors: Monitor,
};

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

function getProductImage(product) {
  return product?.images?.[0] || '';
}

function getDiscountLabel(product, fallback = 'Min. 40% Off') {
  if (product?.off > 0) return `Min. ${product.off}% Off`;
  return fallback;
}

function SectionTitle({ children }) {
  return <h2 className="myn-section-title">{children}</h2>;
}

function HeroMyntraStyle() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const current = heroSlides[index];

  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % heroSlides.length), 4500);
    return () => clearInterval(timer);
  }, []);

  const move = (direction) => {
    setIndex((value) => (value + direction + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="myn-hero">
      <button className="myn-hero-arrow left" onClick={() => move(-1)} aria-label="Previous banner">
        <ArrowLeft size={22} />
      </button>
      <div className="myn-hero-media">
        <img src={current.image} alt={current.title} />
      </div>
      <div className="myn-hero-copy">
        <p>{current.brand}</p>
        <h1>{current.title}</h1>
        <strong>{current.offer}</strong>
        <button onClick={() => navigate(current.path)}>
          Explore <ChevronRight size={18} />
        </button>
      </div>
      <button className="myn-hero-arrow right" onClick={() => move(1)} aria-label="Next banner">
        <ArrowRight size={22} />
      </button>
      <div className="myn-dots" aria-label="Banner slides">
        {heroSlides.map((slide, slideIndex) => (
          <button
            key={slide.title}
            className={slideIndex === index ? 'active' : ''}
            onClick={() => setIndex(slideIndex)}
            aria-label={`Show ${slide.brand}`}
          />
        ))}
      </div>
    </section>
  );
}

function RisingStars({ products }) {
  const navigate = useNavigate();
  const items = products.slice(0, 5);
  if (!items.length) return null;

  return (
    <section>
      <SectionTitle>Rising Stars</SectionTitle>
      <div className="myn-brand-row">
        {items.map((product) => (
          <button className="myn-star-card" key={product._id} onClick={() => navigate(`/product/${product._id}`)}>
            <div className="myn-star-img">
              {getProductImage(product) ? (
                <img src={getProductImage(product)} alt={product.name} />
              ) : (
                <PackageCheck size={58} />
              )}
            </div>
            <div className="myn-star-offer">
              <span>{product.brand || product.category || 'Featured Pick'}</span>
              <p>{product.name}</p>
              <strong>{getDiscountLabel(product)}</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MedalBrands({ brands, products }) {
  const navigate = useNavigate();
  const brandList = brands.filter((brand) => brand.isActive !== false).slice(0, 6);
  const list = brandList.length ? brandList : fallbackBrands.map((name) => ({ name }));
  const productImages = products.map(getProductImage).filter(Boolean);

  return (
    <section>
      <SectionTitle>Medal Worthy Brands To Bag</SectionTitle>
      <div className="myn-medal-row">
        {list.slice(0, 6).map((brand, index) => (
          <button
            className="myn-medal-card"
            key={brand._id || brand.name}
            onClick={() => navigate(`/products?brand=${encodeURIComponent(brand.name)}`)}
          >
            <div className="myn-medal-img">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} />
              ) : productImages[index] ? (
                <img src={productImages[index]} alt={brand.name} />
              ) : (
                <Sparkles size={54} />
              )}
            </div>
            <div className="myn-medal-copy">
              <span>{brand.name}</span>
              <p>{index % 2 === 0 ? 'Trending Electronics' : 'Home Appliance Deals'}</p>
              <strong>Starting Rs. {index % 2 === 0 ? '999' : '1499'}</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ShopByCategory({ categories }) {
  const navigate = useNavigate();
  const displayCategories = useMemo(() => {
    if (!categories.length) return fallbackCategories;
    return categories.slice(0, 12).map((category, index) => ({
      ...category,
      offer: fallbackCategories[index % fallbackCategories.length].offer,
    }));
  }, [categories]);

  return (
    <section>
      <SectionTitle>Shop By Category</SectionTitle>
      <div className="myn-category-grid">
        {displayCategories.map((category, index) => {
          const key = category.name.toLowerCase();
          const Icon = categoryIcons[key] || categoryIcons[key.replace('&', '').trim()] || PackageCheck;
          return (
            <button
              className="myn-category-card"
              key={category._id || category.name}
              onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
            >
              <div className={`myn-category-visual tone-${index % 6}`}>
                {category.image ? <img src={category.image} alt={category.name} /> : <Icon size={70} strokeWidth={1.5} />}
              </div>
              <div className="myn-category-label">
                <span>{category.name}</span>
                <strong>{category.offer}</strong>
                <p>Shop Now</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CouponStrip({ coupons }) {
  const [copied, setCopied] = useState('');
  if (!coupons.length) return null;

  const copyCoupon = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 1800);
  };

  return (
    <section className="myn-coupons">
      <div>
        <BadgePercent size={22} />
        <span>Deal Desk</span>
        <strong>Extra savings on electronics and appliances</strong>
      </div>
      <div className="myn-coupon-list">
        {coupons.slice(0, 4).map((coupon) => (
          <button key={coupon._id || coupon.code} onClick={() => copyCoupon(coupon.code)}>
            <span>{coupon.code}</span>
            <strong>
              {coupon.discountType === 'PERCENTAGE'
                ? `${coupon.discountValue}% OFF`
                : `${money(coupon.discountValue)} OFF`}
            </strong>
            <small>{copied === coupon.code ? 'Copied' : 'Tap to copy'}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    { icon: Truck, title: 'Fast Delivery', text: 'Quick shipping on top cities' },
    { icon: ShieldCheck, title: 'Secure Checkout', text: 'Protected payments every time' },
    { icon: PackageCheck, title: 'Easy Returns', text: 'Simple returns on eligible items' },
  ];

  return (
    <section className="myn-trust-band">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title}>
          <Icon size={26} />
          <span>{title}</span>
          <p>{text}</p>
        </div>
      ))}
    </section>
  );
}

export default function HomePage() {
  const { brands, topCategories } = useCatalog();
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    cached(
      'home:myntraStyleProducts',
      10 * 60 * 1000,
      () => productsApi.getAll({ sort: 'popular', limit: 18 })
        .then(({ data }) => normalizeProducts(data.data?.products || data.data?.data || [])),
    ).then(setProducts).catch(() => {});

    couponsApi.getPublic()
      .then(({ data }) => setCoupons(data.data?.coupons || []))
      .catch(() => {});
  }, []);

  return (
    <main className="myn-home">
      <HeroMyntraStyle />
      <CouponStrip coupons={coupons} />
      <div className="myn-content">
        <RisingStars products={products} />
        <MedalBrands brands={brands} products={products.slice(5)} />
        <ShopByCategory categories={topCategories} />
        <TrustBand />
      </div>

      <style>{`
        .myn-home {
          min-height: 100vh;
          background: #ffffff;
          color: #202436;
        }

        .myn-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.9fr) minmax(320px, .9fr);
          min-height: clamp(330px, 38vw, 510px);
          background: #f7f6f4;
          overflow: hidden;
        }

        .myn-hero-media {
          min-width: 0;
          background: #edf1f4;
        }

        .myn-hero-media img {
          width: 100%;
          height: 100%;
          min-height: clamp(330px, 38vw, 510px);
          object-fit: cover;
          display: block;
        }

        .myn-hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 22px;
          padding: 54px 6vw 74px 52px;
          background: linear-gradient(90deg, #ffffff 0%, #fbfaf8 100%);
          border-left: 1px solid #ece7df;
        }

        .myn-hero-copy p {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .24em;
          text-transform: uppercase;
          color: #0f766e;
        }

        .myn-hero-copy h1 {
          margin: 0;
          max-width: 470px;
          font-size: clamp(34px, 4vw, 64px);
          line-height: .96;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 500;
          color: #171923;
        }

        .myn-hero-copy strong {
          font-size: clamp(24px, 2.3vw, 38px);
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 500;
          color: #55545c;
        }

        .myn-hero-copy button,
        .myn-star-card,
        .myn-medal-card,
        .myn-category-card,
        .myn-coupon-list button {
          font: inherit;
        }

        .myn-hero-copy button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 42px;
          padding: 0;
          border: 0;
          border-top: 1px solid #dfdedb;
          background: transparent;
          color: #71717a;
          font-weight: 800;
          cursor: pointer;
        }

        .myn-hero-arrow {
          position: absolute;
          top: 50%;
          z-index: 4;
          width: 46px;
          height: 72px;
          border: 0;
          background: rgba(38, 43, 62, .72);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .myn-hero-arrow.left { left: 0; transform: translateY(-50%); }
        .myn-hero-arrow.right { right: 0; transform: translateY(-50%); }

        .myn-dots {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 5;
        }

        .myn-dots button {
          width: 9px;
          height: 9px;
          border: 0;
          border-radius: 50%;
          background: #d7d8dd;
          padding: 0;
          cursor: pointer;
        }

        .myn-dots button.active { background: #8c909a; }

        .myn-content {
          max-width: 1560px;
          margin: 0 auto;
          padding: 44px 0 60px;
        }

        .myn-section-title {
          margin: 38px 38px 100px;
          font-size: clamp(26px, 2.5vw, 38px);
          line-height: 1.1;
          letter-spacing: .22em;
          text-transform: uppercase;
          font-weight: 800;
          color: #30384f;
        }

        .myn-brand-row,
        .myn-medal-row {
          display: grid;
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 22px;
        }

        .myn-medal-row {
          grid-template-columns: repeat(6, minmax(170px, 1fr));
        }

        .myn-star-card,
        .myn-medal-card {
          border: 0;
          background: #fff;
          padding: 0;
          text-align: center;
          cursor: pointer;
          min-width: 0;
        }

        .myn-star-img,
        .myn-medal-img {
          height: 330px;
          background: linear-gradient(135deg, #dfeaf0, #fafafa);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #566176;
        }

        .myn-medal-img { height: 260px; }

        .myn-star-img img,
        .myn-medal-img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 22px;
          transition: transform .25s ease;
        }

        .myn-star-card:hover img,
        .myn-medal-card:hover img,
        .myn-category-card:hover img,
        .myn-category-card:hover svg {
          transform: scale(1.04);
        }

        .myn-star-offer,
        .myn-medal-copy {
          margin: -64px 12px 0;
          min-height: 126px;
          position: relative;
          background: rgba(255, 255, 255, .94);
          border: 1px solid #e6e3df;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 16px 12px;
          box-shadow: 0 3px 12px rgba(19, 22, 31, .12);
        }

        .myn-medal-copy {
          margin: 0;
          min-height: 116px;
          border: 0;
          box-shadow: none;
          align-items: flex-start;
          text-align: left;
          padding: 16px;
        }

        .myn-star-offer span,
        .myn-medal-copy span {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #202436;
        }

        .myn-star-offer p,
        .myn-medal-copy p {
          margin: 7px 0 5px;
          color: #1f2937;
          font-size: 16px;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .myn-star-offer strong,
        .myn-medal-copy strong {
          font-size: 26px;
          line-height: 1.1;
          color: #050505;
        }

        .myn-medal-copy strong {
          font-size: 20px;
        }

        .myn-category-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(130px, 1fr));
          gap: 46px 42px;
          padding: 0 68px 20px;
        }

        .myn-category-card {
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          min-width: 0;
        }

        .myn-category-visual {
          aspect-ratio: 1 / 1.18;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #fff;
        }

        .myn-category-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .25s ease;
        }

        .myn-category-visual svg {
          transition: transform .25s ease;
        }

        .tone-0 { background: #1f6f78; }
        .tone-1 { background: #8a3f2d; }
        .tone-2 { background: #5b6f47; }
        .tone-3 { background: #31568a; }
        .tone-4 { background: #8d2244; }
        .tone-5 { background: #6a553f; }

        .myn-category-label {
          margin: -84px 10px 0;
          min-height: 106px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 12px 8px;
          background: rgba(193, 70, 37, .9);
          color: #fff;
          text-align: center;
        }

        .myn-category-label span {
          font-size: 18px;
          line-height: 1.15;
          font-weight: 800;
        }

        .myn-category-label strong {
          margin-top: 6px;
          font-size: 25px;
          line-height: 1;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 500;
        }

        .myn-category-label p {
          margin: 7px 0 0;
          font-size: 16px;
          font-weight: 700;
        }

        .myn-coupons {
          display: grid;
          grid-template-columns: minmax(240px, .55fr) minmax(0, 1.45fr);
          gap: 18px;
          align-items: center;
          max-width: 1480px;
          margin: 22px auto 0;
          padding: 14px 22px;
          background: #252b3d;
          color: #fff;
        }

        .myn-coupons > div:first-child {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .myn-coupons span {
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .myn-coupons strong {
          color: rgba(255, 255, 255, .78);
          font-size: 13px;
          font-weight: 700;
        }

        .myn-coupon-list {
          display: grid;
          grid-template-columns: repeat(4, minmax(130px, 1fr));
          gap: 10px;
        }

        .myn-coupon-list button {
          min-width: 0;
          border: 1px dashed rgba(255, 255, 255, .36);
          background: rgba(255, 255, 255, .08);
          color: #fff;
          padding: 9px 12px;
          text-align: left;
          cursor: pointer;
        }

        .myn-coupon-list button span,
        .myn-coupon-list button strong,
        .myn-coupon-list button small {
          display: block;
        }

        .myn-coupon-list button strong {
          color: #fff;
          font-size: 17px;
          margin: 3px 0;
        }

        .myn-coupon-list button small {
          color: rgba(255, 255, 255, .58);
          font-size: 11px;
        }

        .myn-trust-band {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          margin: 42px 38px 0;
          background: #e7e8ec;
        }

        .myn-trust-band div {
          min-height: 120px;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 7px;
          text-align: center;
          padding: 18px;
          color: #30384f;
        }

        .myn-trust-band span {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 13px;
        }

        .myn-trust-band p {
          margin: 0;
          color: #666b78;
          font-size: 13px;
        }

        @media (max-width: 1180px) {
          .myn-brand-row,
          .myn-medal-row {
            grid-template-columns: repeat(5, minmax(220px, 1fr));
            padding: 0 18px 20px;
          }

          .myn-category-grid {
            grid-template-columns: repeat(4, minmax(140px, 1fr));
            padding: 0 28px 20px;
            gap: 32px 24px;
          }
        }

        @media (max-width: 820px) {
          .myn-hero {
            grid-template-columns: 1fr;
          }

          .myn-hero-copy {
            padding: 28px 22px 58px;
            border-left: 0;
          }

          .myn-section-title {
            margin: 34px 18px 42px;
            letter-spacing: .14em;
          }

          .myn-brand-row,
          .myn-medal-row {
            display: flex;
            overflow-x: auto;
            padding: 0 16px 18px;
          }

          .myn-star-card,
          .myn-medal-card {
            width: 260px;
            flex: 0 0 260px;
          }

          .myn-star-img {
            height: 260px;
          }

          .myn-medal-img {
            height: 220px;
          }

          .myn-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px 14px;
            padding: 0 16px 20px;
          }

          .myn-coupons {
            grid-template-columns: 1fr;
            margin: 12px 12px 0;
          }

          .myn-coupon-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .myn-trust-band {
            grid-template-columns: 1fr;
            margin: 28px 16px 0;
          }
        }

        @media (max-width: 520px) {
          .myn-hero-arrow {
            width: 38px;
            height: 58px;
          }

          .myn-category-label {
            margin: -74px 8px 0;
            min-height: 96px;
          }

          .myn-category-label span {
            font-size: 15px;
          }

          .myn-category-label strong {
            font-size: 20px;
          }

          .myn-category-label p {
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}
