import './Stats.css';

const stats = [
  { value: '10,000+', label: 'Active Businesses', accent: 'from-purple-400 to-violet-400' },
  { value: '₦2.5B+',  label: 'Revenue Managed',  accent: 'from-blue-400 to-cyan-400' },
  { value: '99.9%',   label: 'Uptime',            accent: 'from-green-400 to-emerald-400' },
  { value: '24/7',    label: 'Support',            accent: 'from-orange-400 to-amber-400' },
];

export default function Stats() {
  return (
    <div className="relative bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 py-16 overflow-hidden">
      {/* Subtle orb glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute right-1/4 bottom-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <div className={`text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r ${s.accent} bg-clip-text text-transparent`}>
                {s.value}
              </div>
              <div className="text-gray-400 text-sm md:text-base font-medium tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
