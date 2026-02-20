import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogIn, Rocket, Mail, MessageSquare, AlertCircle, Send } from 'lucide-react';
import SupportModal from './SupportModal.jsx';

export default function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
      setIsSupportOpen(false);
    }
  };

  const openSupportModal = (type) => {
    setModalType(type);
    setIsMenuOpen(false);
    setIsSupportOpen(false);
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/60 border-b border-gray-100'
          : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <img src="./firmaflow-logo.jpg" className="w-8 h-8" alt="" />
              <span>
                <button
                  onClick={() => navigate('/')}
                  className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
                >
                  FirmaFlow Ledger
                </button>
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-to-use')}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                How to Use
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Testimonials
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsSupportOpen(!isSupportOpen)}
                  className="flex items-center text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  Support <ChevronDown size={16} className="ml-1" />
                </button>
                {isSupportOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg py-2 w-48 border border-gray-200">
                    <button
                      onClick={() => openSupportModal('contact')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center"
                    >
                      <Mail size={16} className="mr-2" />
                      Contact Us
                    </button>
                    <button
                      onClick={() => openSupportModal('feedback')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Send Feedback
                    </button>
                    <button
                      onClick={() => openSupportModal('complaint')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center"
                    >
                      <AlertCircle size={16} className="mr-2" />
                      File a Complaint
                    </button>
                    <button
                      onClick={() => openSupportModal('email')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center"
                    >
                      <Send size={16} className="mr-2" />
                      Email Support
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleSignIn} className="text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-purple-50">
                <LogIn size={16} />
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 font-semibold text-sm">
                <Rocket size={15} />
                Get Started
              </button>
            </div>

            <button
              className="lg:hidden text-gray-700 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-3 bg-gray-50 rounded-lg p-4">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left text-gray-700 hover:text-purple-600 py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-to-use')}
                className="block w-full text-left text-gray-700 hover:text-purple-600 py-2"
              >
                How to Use
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left text-gray-700 hover:text-purple-600 py-2"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left text-gray-700 hover:text-purple-600 py-2"
              >
                Testimonials
              </button>
              <div className="border-t border-gray-300 pt-3 space-y-2">
                <button
                  onClick={() => openSupportModal('contact')}
                  className="w-full text-left text-gray-700 py-2 flex items-center"
                >
                  <Mail size={16} className="mr-2" />
                  Contact Us
                </button>
                <button
                  onClick={() => openSupportModal('feedback')}
                  className="w-full text-left text-gray-700 py-2 flex items-center"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Send Feedback
                </button>
                <button
                  onClick={() => openSupportModal('complaint')}
                  className="w-full text-left text-gray-700 py-2 flex items-center"
                >
                  <AlertCircle size={16} className="mr-2" />
                  File a Complaint
                </button>
                <button
                  onClick={() => openSupportModal('email')}
                  className="w-full text-left text-gray-700 py-2 flex items-center"
                >
                  <Send size={16} className="mr-2" />
                  Email Support
                </button>
              </div>
              <button className="w-full text-left text-gray-700 py-2 flex items-center">
                <LogIn size={16} className="mr-2" />
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center">
                <Rocket size={16} className="mr-1" />
                Get Started
              </button>
            </div>
          )}
        </nav>
      </header>

      {modalType && (
        <SupportModal type={modalType} onClose={() => setModalType(null)} />
      )}
    </>
  );
}
