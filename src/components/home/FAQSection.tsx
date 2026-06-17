import { parseJSON } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection({ title, subtitle, content }: { title: string; subtitle?: string | null; content: string }) {
  const items = parseJSON<FAQItem[]>(content, []);
  if (items.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-gray-900 list-none">
                {item.question}
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
