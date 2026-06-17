import { parseJSON } from "@/lib/utils";
import { Star, Quote } from "lucide-react";

interface TestimonialItem {
  author: string;
  company: string;
  text: string;
}

export function TestimonialsSection({ title, subtitle, content }: { title: string; subtitle?: string | null; content: string }) {
  const items = parseJSON<TestimonialItem[]>(content, []);
  if (items.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Quote className="w-8 h-8 text-brand-200 mb-3" />
              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{item.text}&rdquo;</p>
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{item.author}</div>
              <div className="text-xs text-gray-500">{item.company}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
