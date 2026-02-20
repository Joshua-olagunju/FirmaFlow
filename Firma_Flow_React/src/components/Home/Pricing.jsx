import { Check, Star, Zap } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

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
    accent: 'from-gray-600 to-gray-700',
    btnClass: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
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
    accent: 'from-purple-600 to-blue-600',
    btnClass: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/30',
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
    accent: 'from-indigo-600 to-purple-600',
    btnClass: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
];

function PricingCard({ plan, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`relative rounded-3xl overflow-hidden transform transition-all duration-700 hover:scale-105 ${
        plan.popular
          ? 'shadow-2xl shadow-purple-500/20 ring-2 ring-purple-500/40'
          : 'shadow-lg hover:shadow-xl bg-white border border-gray-100'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Popular gradient top bar */}
      {plan.popular && (
        <div className={`h-1.5 w-full bg-gradient-to-r ${plan.accent}`}></div>
      )}

      {plan.popular && (
        <div className="absolute top-5 right-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
          <Star size={12} className="fill-white" />
          Most Popular
        </div>
      )}

      <div className={`p-8 ${plan.popular ? 'bg-white' : 'bg-white'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.accent} flex items-center justify-center`}>
            <Zap size={15} className="text-white fill-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
        </div>
        <div className="my-5">
          <span className={`text-5xl font-extrabold bg-gradient-to-r ${plan.accent} bg-clip-text text-transparent`}>
            {plan.price}
          </span>
          <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.accent} flex items-center justify-center flex-shrink-0`}>
                <Check size={11} className="text-white font-bold" />
              </div>
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button className={`w-full py-3.5 rounded-xl font-semibold transition-all text-sm ${plan.btnClass}`}>
          Get Started
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-100 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block text-sm font-bold uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-4 py-1 mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 sm:grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} delay={index * 100} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">
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
