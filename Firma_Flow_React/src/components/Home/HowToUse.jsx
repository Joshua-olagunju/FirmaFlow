import { UserPlus, Settings, BarChart3, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import './Stats.css';

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in minutes. No credit card required for the trial period.',
    step: '1',
    color: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-200',
  },
  {
    icon: Settings,
    title: 'Set Up Your Business',
    description: 'Add your business details, products, and customer information to get started.',
    step: '2',
    color: 'from-blue-500 to-indigo-600',
    ring: 'ring-blue-200',
  },
  {
    icon: BarChart3,
    title: 'Start Managing',
    description: 'Track inventory, create invoices, and manage your business operations seamlessly.',
    step: '3',
    color: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200',
  },
  {
    icon: CheckCircle,
    title: 'Grow & Scale',
    description: 'Use analytics and insights to make data-driven decisions and grow your business.',
    step: '4',
    color: 'from-orange-500 to-amber-500',
    ring: 'ring-orange-200',
  },
];

function StepCard({ step, index, total, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const isLast = index === total - 1;

  return (
    <div
      ref={ref}
      className={`relative flex gap-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step number + connector line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-16 h-16 bg-gradient-to-br ${step.color} ring-4 ${step.ring} rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg z-10`}>
          {step.step}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-transparent mt-2 mb-2 min-h-[40px]"></div>}
      </div>
      {/* Card */}
      <div className="flex-grow pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
              <step.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
          </div>
          <p className="text-gray-500 leading-relaxed text-sm">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HowToUse() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);
  const { ref: videoRef, isVisible: videoVisible } = useScrollAnimation(0.1);

  return (
    <section id="how-to-use" className="py-24 bg-gradient-to-b from-white via-violet-50/60 to-blue-50/60">
      <div className="container mx-auto px-4">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block text-sm font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-4 py-1 mb-4">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            How to Get Started
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Start managing your business in four simple steps
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} total={steps.length} delay={index * 150} />
          ))}
        </div>

        <div
          ref={videoRef}
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            videoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="how p-5 text-center text-black">
              <h3 className="text-xl font-bold">How to Use FirmaFlow</h3>
              <p className="text-sm opacity-95">
                Watch our comprehensive tutorial to get started with FirmaFlow and learn 
                how to make the most of all features.
              </p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* YouTube iframe - responsive 16:9 */}
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/hmO5M9qFvGU"
                title="How to Use FirmaFlow | Simplify Your Business Accounting & Finance"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Purple callout box below the video */}
            <div className="p-6 h-50 grid grid-cols-1 text-center bg-gradient-to-br from-purple-600 to-blue-600 text-white">
              <h3 className="text-xl font-bold mb-2">Complete FirmaFlow Tutorial</h3>
              <p className="text-sm opacity-95">
                Learn how to manage your business efficiently with FirmaFlow. This tutorial covers
                everything from setting up your account to advanced features like inventory
                tracking, customer management, and financial reporting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
