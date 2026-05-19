import { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import BrandStrip from '../components/home/BrandStrip';
import CategoryGrid from '../components/home/CategoryGrid';
import SchemesSection from '../components/home/SchemesSection';
import ProductSection from '../components/home/ProductSection';
import ProductCardsGrid from '../components/home/ProductCardsGrid';
import BigBanner from '../components/home/BigBanner';
import PromiseBar from '../components/home/PromiseBar';
import ReviewsSection from '../components/home/ReviewsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import { productsApi } from '../api/products';
import { normalizeProducts } from '../utils/normalizers';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    productsApi.getFeatured()
      .then(({ data }) => setFeatured(normalizeProducts(data.data?.products || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'newest', limit: 8 })
      .then(({ data }) => setNewest(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'rating', limit: 8 })
      .then(({ data }) => setTopRated(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'popular', limit: 8 })
      .then(({ data }) => setDeals(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f0f2f2', minHeight: '100vh' }}>
      <HeroSection />
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '12px 12px 40px' }}>
        <CategoryGrid />
        <SchemesSection />
        {featured.length > 0 && (
          <ProductSection
            title="Featured Products"
            subtitle="Top Picks"
            products={featured.slice(0, 8)}
            viewAllLink="/products"
          />
        )}
        <BigBanner />
        {newest.length > 0 && (
          <ProductSection
            title="New Arrivals"
            subtitle="Just In"
            products={newest.slice(0, 8)}
            viewAllLink="/products?sort=newest"
          />
        )}
        <ProductCardsGrid
          featured={featured.slice(0, 4)}
          newest={newest.slice(0, 4)}
          topRated={topRated.slice(0, 4)}
          deals={deals.slice(0, 4)}
        />
        <BrandStrip />
        <PromiseBar />
        <ReviewsSection />
        <NewsletterSection />
      </div>
    </div>
  );
}
