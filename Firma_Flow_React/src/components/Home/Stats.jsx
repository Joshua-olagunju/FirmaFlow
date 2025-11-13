import './Stats.css';

export default function Stats() {
    return (
        <div className="h-50 m-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 stats">
          <div className="animate-fade-in-delay-3">
            <div className="text-5xl font-bold mb-2">10,000+</div>
            <div className="text-white/80 desc">Active Businesses</div>
          </div>
          <div className="animate-fade-in-delay-3">
            <div className="text-5xl font-bold mb-2">₦2.5B+</div>
            <div className="text-white/80 desc">Revenue Managed</div>
          </div>
          <div className="animate-fade-in-delay-3">
            <div className="text-5xl font-bold mb-2">99.9%</div>
            <div className="text-white/80 desc">Uptime</div>
          </div>
          <div className="animate-fade-in-delay-3">
            <div className="text-5xl font-bold mb-2">24/7</div>
            <div className="text-white/80 desc">Support</div>
          </div>
        </div>
    );
}
