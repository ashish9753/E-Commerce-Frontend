import { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import BrandStrip from '../components/home/BrandStrip';
import CategoryGrid from '../components/home/CategoryGrid';
import SchemesSection from '../components/home/SchemesSection';
import ProductSection from '../components/home/ProductSection';
import BigBanner from '../components/home/BigBanner';
import PromiseBar from '../components/home/PromiseBar';
import ReviewsSection from '../components/home/ReviewsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import { productsApi } from '../api/products';
import { normalizeProducts } from '../utils/normalizers';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);

  useEffect(() => {
    productsApi.getFeatured()
      .then(({ data }) => setFeatured(normalizeProducts(data.data?.products || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'newest', limit: 8 })
      .then(({ data }) => setNewest(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});
  }, []);

  return (
    <>
      <HeroSection />
      <BrandStrip />
      <CategoryGrid />
      <SchemesSection />
      {featured.length > 0 && (
        <ProductSection
          title='Featured <i>Products</i>'
          subtitle="Top Picks"
          products={featured.slice(0, 4)}
          viewAllLink="/products"
        />
      )}
      <BigBanner />
      {newest.length > 0 && (
        <ProductSection
          title='New <i>Arrivals</i>'
          subtitle="Just In"
          products={newest.slice(0, 4)}
          viewAllLink="/products?sort=newest"
        />
      )}
      <PromiseBar />
      <ReviewsSection />
      <NewsletterSection />
    </>
  );
}
