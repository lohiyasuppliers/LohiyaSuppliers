import { parseJSON } from "@/lib/utils";

interface WhyItem {
  title: string;
  text: string;
}

const icons = ["🏭", "🔧", "📦", "🤝", "⚡", "✅"];

export function WhyChooseSection({ title, subtitle, content }: { title: string; subtitle?: string | null; content: string }) {
  const items = parseJSON<WhyItem[]>(content, []);
  if (items.length === 0) return null;

  return (
    <section className="py-16 bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-brand-200 mt-2">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-brand-900/50 rounded-xl p-6 border border-brand-800 hover:border-brand-600 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-3xl mb-3">{icons[i % icons.length]}</div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-brand-200 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
