import { Suspense } from "react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="gradient-hero text-white py-12 admin-hero">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold animate-slide-in-left">Contact Us</h1>
          <p className="text-brand-100 mt-2 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            Get in touch for quotes, bulk orders, or repair services
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading...</div>}>
        <ContactForm
          contactPhone={settings.contactPhone}
          contactEmail={settings.contactEmail}
          contactAddress={settings.contactAddress}
          businessHours={settings.businessHours}
        />
      </Suspense>
    </div>
  );
}
