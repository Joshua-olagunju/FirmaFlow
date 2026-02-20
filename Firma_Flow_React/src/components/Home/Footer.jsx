import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import './Stats.css'

export default function Footer() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-950 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-64 h-40 bg-purple-900 rounded-full filter blur-3xl opacity-20 pointer-events-none -translate-y-1/2"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <img src="./firmaflow-logo.jpg" className="w-9 h-9 logo" alt="" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                FirmaFlow Ledger
              </h3>
            </div>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Streamline your business operations with our comprehensive management platform.
            </p>
            <div className="flex space-x-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center hover:bg-purple-600 hover:border-purple-500 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Product</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-gray-500 hover:text-white transition-colors text-sm">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-500 hover:text-white transition-colors text-sm">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-to-use')} className="text-gray-500 hover:text-white transition-colors text-sm">
                  How to Use
                </button>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Contact Us</a></li>
              <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 text-sm">support@firmaflowledger.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 text-sm">+234 800 000 0000</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 text-sm">Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/80 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              &copy; 2026 FirmaFlow Ledger. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Powered by</span>
              <a
                href="https://sodatim.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-blue-300 transition-all duration-300 animate-pulse"
              >
                SODATIM TECHNOLOGIES
              </a>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
