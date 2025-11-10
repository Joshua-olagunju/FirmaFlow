import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Features from './components/Features.jsx';
import HowToUse from './components/HowToUse.jsx';
import Pricing from './components/Pricing.jsx';
import Testimonials from './components/Testimonials.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';
import SupportWidget from './components/SupportWidget.jsx';
import Stats  from './components/Stats.jsx';

function App() {
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

export default App;
