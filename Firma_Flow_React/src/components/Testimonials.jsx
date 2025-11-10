import { Quote } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const testimonials = [
  {
    name: 'Adebayo Ogunleye',
    role: 'CEO, Fashion Hub Lagos',
    initials: 'AO',
    content: 'FirmaFlow Ledger has transformed how we manage our inventory and customer relationships. The analytics feature alone has helped us increase revenue by 40%.',
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Early Adopter, Retail Plus',
    initials: 'FI',
    content: 'The invoicing system is incredibly intuitive. We\'ve cut down our billing time by 70% and our customers love the professional invoices.',
  },
  {
    name: 'Chinedu Okoro',
    role: 'Beta Participant, Growth Hub',
    initials: 'CO',
    content: 'Best business management software I\'ve used. The mobile access feature means I can manage my business from anywhere. Highly recommended!',
  },
];

function TestimonialCard({ testimonial, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Quote size={48} className="w-12 h-12 text-purple-600 mb-6 opacity-50" />
      <p className="text-gray-700 mb-6 leading-relaxed italic">{testimonial.content}</p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold mr-3">
          {testimonial.initials}
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
          <p className="text-gray-600 text-sm">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of businesses that trust FirmaFlow Ledger
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
