import { X } from "lucide-react";

const titles = {
  dashboard: "Dashboard Setup",
  install: "Install Firmaflow",
  update: "Update Available",
  default: "Modal",
};

export default function DashboardModal({ type = "default", onClose }) {
  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose} 
    >
      {/* floating modal bottom-right */}
      <div
        className="fixed bottom-6 right-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] 
        rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden
        animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        <div className="flex w-full items-center justify-center mt-5 text-4xl">
          📱
        </div>

        <div className="p-6 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {titles[type] || titles.default}
            </h2>

            {/* <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={22} />
            </button> */}
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <p className="m-0 text-slate-300 text-sm font-medium">Install FirmaFlow on your device for quick access and offline features!</p>
            <ul className="mt-1 space-y-1">
              <li className="text-sm text-slate-300">✓ Works offline</li>
              <li className="text-sm text-slate-300">✓ Faster loading</li>
              <li className="text-sm text-slate-300">✓ App-like experience</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button className="w-full bg-white text-blue-600 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all">
              Install App
            </button>

            <button className="w-full border border-white text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
