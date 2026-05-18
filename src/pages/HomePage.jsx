import HeroSection from '../components/home/HeroSection';
import BrandStrip from '../components/home/BrandStrip';
import CategoryGrid from '../components/home/CategoryGrid';
import SchemesSection from '../components/home/SchemesSection';
import ProductSection from '../components/home/ProductSection';
import BigBanner from '../components/home/BigBanner';
import PromiseBar from '../components/home/PromiseBar';
import ReviewsSection from '../components/home/ReviewsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import { products } from '../data/products';

export default function HomePage() {
  const bestSellers = products.filter(p => p.badge === 'sale').slice(0, 4);
  const newArrivals = products.filter(p => p.badge === 'new').concat(products.filter(p => !p.badge)).slice(0, 4);

  return (
    <>
      <HeroSection />
      <BrandStrip />
      <CategoryGrid />
      <SchemesSection />
      <ProductSection
        title='Best <i>Sellers</i>'
        subtitle="Top Picks"
        products={bestSellers}
        viewAllLink="/products"
      />
      <BigBanner />
      <ProductSection
        title='New <i>Arrivals</i>'
        subtitle="Just In"
        products={newArrivals}
        viewAllLink="/products"
      />
      <PromiseBar />
      <ReviewsSection />
      <NewsletterSection />
    </>
  );
}
