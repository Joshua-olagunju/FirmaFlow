import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, Smartphone, Rocket } from 'lucide-react';
import './Stats.css'

export default function Hero() {
  const navigate = useNavigate();
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-700 to-blue-800"></div>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      {/* Floating glowing orbs */}
      <div className="absolute top-24 left-8 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl opacity-25 animate-pulse pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute bottom-16 left-1/3 w-64 h-64 bg-indigo-300 rounded-full filter blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2.4s' }}></div>
      <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-pink-400 rounded-full filter blur-3xl opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '0.6s' }}></div>

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
              <button onClick={() => navigate('/signup')} className="group bg-white text-purple-700 px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-white/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Rocket size={18} />
                Start Free Trial
              </button>
              <button
                onClick={() => scrollToSection('how-to-use')}
                className="bg-white/10 backdrop-blur-sm border border-white/40 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} />
                Learn More
              </button>
              <button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-green-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Download size={18} />
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
