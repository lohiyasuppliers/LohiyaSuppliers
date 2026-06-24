import { COMPANY_PHONES } from "@/lib/constants";

export function ContactPhoneLinks({
  className = "",
  linkClassName = "hover:text-white transition-colors",
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {COMPANY_PHONES.map((p, i) => (
        <span key={p.number} className="inline-flex items-center gap-1">
          {i > 0 && <span className="opacity-50 mx-1">·</span>}
          <a href={`tel:+91${p.number}`} className={linkClassName}>
            {p.number} ({p.name})
          </a>
        </span>
      ))}
    </span>
  );
}

export function ContactPhonesText() {
  return COMPANY_PHONES.map((p) => `${p.number} (${p.name})`).join(", ");
}
