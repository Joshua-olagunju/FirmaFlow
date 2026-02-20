import { BarChart3, Package, FileText, Users, TrendingUp, Smartphone } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get real-time insights into your business performance with comprehensive dashboards and detailed reports.',
    gradient: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/20',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, manage suppliers, and get automatic low-stock alerts to never run out of products.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: FileText,
    title: 'Invoice & Billing',
    description: 'Create professional invoices, track payments, and manage your billing cycle with ease.',
    gradient: 'from-indigo-500 to-blue-600',
    glow: 'shadow-indigo-500/20',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Build and maintain strong customer relationships with our comprehensive CRM tools.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Financial Tracking',
    description: 'Monitor expenses, revenue, and profitability with detailed financial tracking and forecasting.',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/20',
  },
  {
    icon: Smartphone,
    title: 'Mobile Access',
    description: 'Manage your business on the go with our mobile-responsive platform and PWA capabilities.',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/20',
  },
];

function FeatureCard({ icon: Icon, title, description, gradient, glow, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl ${glow} transition-all duration-500 transform hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Hover gradient border effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-br ${gradient} transition-opacity duration-300 -z-10 blur-sm`}></div>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

export default function Features() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-50 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-40 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block text-sm font-bold uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-4 py-1 mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Powerful Features for Your Business
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Everything you need to manage and grow your business in one comprehensive platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
