import { BarChart3, Package, FileText, Users, TrendingUp, Smartphone } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get real-time insights into your business performance with comprehensive dashboards and detailed reports.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, manage suppliers, and get automatic low-stock alerts to never run out of products.',
  },
  {
    icon: FileText,
    title: 'Invoice & Billing',
    description: 'Create professional invoices, track payments, and manage your billing cycle with ease.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Build and maintain strong customer relationships with our comprehensive CRM tools.',
  },
  {
    icon: TrendingUp,
    title: 'Financial Tracking',
    description: 'Monitor expenses, revenue, and profitability with detailed financial tracking and forecasting.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Access',
    description: 'Manage your business on the go with our mobile-responsive platform and PWA capabilities.',
  },
];

function FeatureCard({ icon: Icon, title, description, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-white" size={32} />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Features() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Powerful Features for Your Business
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage and grow your business in one comprehensive platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
