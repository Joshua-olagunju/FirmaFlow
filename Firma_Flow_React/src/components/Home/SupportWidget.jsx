import { useState } from 'react';
import { X, Smartphone, Download, Clock } from 'lucide-react';

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(true);

  const handleInstall = () => {
    // Add install functionality here
    console.log('Installing app...');
  };

  const handleMaybeLater = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-40">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <h3 className="font-bold text-xl">Install FirmaFlow</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        <p className="text-gray-600 mb-6">Install FirmaFlow on your device for quick access and offline features!</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="text-purple-600" size={20} />
            <span>Faster loading</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Smartphone className="text-purple-600" size={20} />
            <span>App-like experience</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Download className="text-purple-600" size={20} />
            <span>Works offline</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all"
          >
            Install App
          </button>
          <button
            onClick={handleMaybeLater}
            className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-200 transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
