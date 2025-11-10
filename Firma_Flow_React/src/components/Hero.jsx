import { ArrowRight, Download, Smartphone, Rocket } from 'lucide-react';
import './Stats.css'

export default function Hero() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 opacity-90"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 sm:mb-10 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-in leading-tight">
              Streamline Your Business Operations with{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                FirmaFlow Ledger
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed animate-fade-in-delay">
              The complete business management platform that helps you track inventory,
              manage customers, handle invoicing, and grow your business with powerful analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2 flex-wrap">
              <button className="group bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center">
                <Rocket size={18} className="mr-2" />
                Start Free Trial
              </button>
              <button
                onClick={() => scrollToSection('how-to-use')}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                <ArrowRight size={18} className="mr-2" />
                Learn More
              </button>
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center">
                <Download size={18} className="mr-2" />
                Install App
              </button>
            </div>

            <p className="text-white/80 mt-8 text-sm animate-fade-in-delay-3 flex items-center">
                <span>✓No credit card required • 14-day free trial •</span><Smartphone className="mr-2" size={20} /><span>Install as app</span> 
            </p>
          </div>

          <div className="lg:block animate-fade-in-delay-2">
            <img
              src="./dashboard-preview.jpg"
              alt="Dashboard Preview"
              className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
      
    </section>
    
  );
}
