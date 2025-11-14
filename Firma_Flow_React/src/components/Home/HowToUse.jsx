import { UserPlus, Settings, BarChart3, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import './Stats.css';

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in minutes. No credit card required for the trial period.',
    step: '1',
  },
  {
    icon: Settings,
    title: 'Set Up Your Business',
    description: 'Add your business details, products, and customer information to get started.',
    step: '2',
  },
  {
    icon: BarChart3,
    title: 'Start Managing',
    description: 'Track inventory, create invoices, and manage your business operations seamlessly.',
    step: '3',
  },
  {
    icon: CheckCircle,
    title: 'Grow & Scale',
    description: 'Use analytics and insights to make data-driven decisions and grow your business.',
    step: '4',
  },
];

function StepCard({ step, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {step.step}
          </div>
        </div>
        <div className="ml-6 flex-grow">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <step.icon className="w-8 h-8 text-purple-600 mr-3" size={32} />
              <h3 className="text-2xl font-bold text-gray-800">{step.title}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">{step.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowToUse() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);
  const { ref: videoRef, isVisible: videoVisible } = useScrollAnimation(0.1);

  return (
    <section id="how-to-use" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            How to Get Started
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start managing your business in four simple steps
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 mb-16">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} delay={index * 150} />
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
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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
