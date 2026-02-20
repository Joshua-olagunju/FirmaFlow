import { Quote, Star } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const testimonials = [
  {
    name: 'Adebayo Ogunleye',
    role: 'CEO, Fashion Hub Lagos',
    initials: 'AO',
    gradient: 'from-purple-500 to-violet-600',
    content: 'FirmaFlow Ledger has transformed how we manage our inventory and customer relationships. The analytics feature alone has helped us increase revenue by 40%.',
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Early Adopter, Retail Plus',
    initials: 'FI',
    gradient: 'from-blue-500 to-cyan-600',
    content: 'The invoicing system is incredibly intuitive. We\'ve cut down our billing time by 70% and our customers love the professional invoices.',
  },
  {
    name: 'Chinedu Okoro',
    role: 'Beta Participant, Growth Hub',
    initials: 'CO',
    gradient: 'from-emerald-500 to-teal-600',
    content: 'Best business management software I\'ve used. The mobile access feature means I can manage my business from anywhere. Highly recommended!',
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array(5).fill(0).map((_, i) => (
        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, delay }) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top gradient accent line */}
      <div className={`absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r ${testimonial.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <StarRating />
      <div className="relative mb-6">
        <Quote size={36} className="absolute -top-1 -left-1 text-purple-100" />
        <p className="text-gray-600 leading-relaxed italic pl-4 relative z-10">{testimonial.content}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
          {testimonial.initials}
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">{testimonial.name}</h4>
          <p className="text-gray-500 text-xs">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.1);

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-100 rounded-full filter blur-3xl opacity-40 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block text-sm font-bold uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-4 py-1 mb-4">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Join thousands of businesses that trust FirmaFlow Ledger
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
