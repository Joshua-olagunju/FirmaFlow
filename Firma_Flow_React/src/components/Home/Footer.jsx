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
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex content-center justify-start gap-1 align-center mb-4">
              <img src="./firmaflow-logo.jpg" className="w-8 h-8 logo" alt="" />
              <span>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  FirmaFlow Ledger
                </h3>
              </span>
            </div>
            
            <p className="text-gray-400 mb-4">
              Streamline your business operations with our comprehensive management platform.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-to-use')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  How to Use
                </button>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail size={18} className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-400">support@firmaflowledger.com</span>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-400">+234 800 000 0000</span>
              </li>
              <li className="flex items-start">
                <MapPin size={18} className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-400">Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm mb-0">
              &copy; 2026 FirmaFlow Ledger. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Powered by</span>
              <a 
                href="https://sodatim.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-blue-300 transition-all duration-300 animate-pulse"
                style={{
                  textShadow: '0 0 20px rgba(167, 139, 250, 0.3)',
                  filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.4))'
                }}
              >
                SODATIM TECHNOLOGIES
              </a>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
