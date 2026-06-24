"use client";

const ITEMS = [
  "Deerfros Authorized",
  "Leitz Partner",
  "AIPL Distributor",
  "Pan-India Shipping",
  "B2B Pricing",
  "GST Invoicing",
  "Metal & Wood",
  "Since 2011",
  "Jaipur HQ",
  "Industrial Grade",
];

export function AboutMarquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="relative py-5 bg-brand-950 overflow-hidden border-y border-brand-800/50">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-brand-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-brand-950 to-transparent z-10" />
      <div className="flex w-max animate-marquee">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-3 px-8 text-sm font-semibold text-brand-200 uppercase tracking-wider whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
