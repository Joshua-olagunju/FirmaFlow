import Header from '../components/Home/Header.jsx';
import Hero from '../components/Home/Hero.jsx';
import Features from '../components/Home/Features.jsx';
import HowToUse from '../components/Home/HowToUse.jsx';
import Pricing from '../components/Home/Pricing.jsx';
import Testimonials from '../components/Home/Testimonials.jsx';
import CTA from '../components/Home/CTA.jsx';
import Footer from '../components/Home/Footer.jsx';
import SupportWidget from '../components/Home/SupportWidget.jsx';
import Stats  from '../components/Home/Stats.jsx';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <Features />
      <HowToUse />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
      <SupportWidget />
    </div>
  );
}
