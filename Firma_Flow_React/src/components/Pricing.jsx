import { Check, Star } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const plans = [
  {
    name: 'Starter',
    price: '₦5,000',
    period: 'month',
    features: [
      '100 customers',
      '500 products',
      'Basic reporting',
      'Email support',
      '2 user accounts',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: '₦10,000',
    period: 'month',
    features: [
      '1,000 customers',
      '2,000 products',
      'Advanced reporting',
      'Email & chat support',
      '4 user accounts',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₦15,000',
    period: 'month',
    features: [
      'Unlimited customers',
      'Unlimited products',
      'Full analytics suite',
      'Priority support',
      '8 user accounts',
    ],
    popular: false,
  },
];

function PricingCard({ plan, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-700 hover:scale-105 ${
        plan.popular ? 'border-4 border-purple-600' : ''
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {plan.popular && (
        <div className="absolute top-0 sm:right-20 right-18 bg-gradient-to-r from-orange-600 to-yellow-600 text-white px-4 py-1 rounded-b-lg flex items-center">
          <Star size={16} className="mr-1 fill-current" />
          Most Popular
        </div>
      )}

      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{plan.name}</h3>
        <div className="mb-6">
          <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {plan.price}
          </span>
          <span className="text-gray-600">/{plan.period}</span>
        </div>

        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check size={20} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            plan.popular
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Get Started
        </button>
        
      </div>
    </div>
  );
}

export default function Pricing() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 grid gap-5 grid-col-1">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 sm:grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} delay={index * 100} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom plan for your enterprise? Contact our sales team.
          </p>
          <button className="text-purple-600 font-semibold hover:underline">
            Contact Sales →
          </button>
        </div>
      </div>
    </section>
  );
}
