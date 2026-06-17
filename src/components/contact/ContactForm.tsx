"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export function ContactForm({ contactPhone, contactEmail, contactAddress, businessHours }: {
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  businessHours: string;
}) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
    type: "GENERAL",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && ["GENERAL", "BULK_ORDER", "REPAIR", "QUOTE"].includes(type)) {
      setForm((f) => ({
        ...f,
        type,
        subject: type === "BULK_ORDER" ? "Bulk Order Inquiry" : type === "REPAIR" ? "Repair Service Request" : type === "QUOTE" ? "Price Quote Request" : f.subject,
      }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const subject = encodeURIComponent(`[${form.type}] ${form.subject || "Inquiry from website"}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCompany: ${form.company}\n\n${form.message}`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {[
            { icon: Phone, title: "Phone", value: contactPhone },
            { icon: Mail, title: "Email", value: contactEmail },
            { icon: MapPin, title: "Address", value: contactAddress },
            { icon: Clock, title: "Business Hours", value: businessHours },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 bg-white rounded-xl border p-5">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-600">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-green-800">Message Sent!</h2>
              <p className="text-green-600 mt-2">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Company</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Inquiry Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="GENERAL">General Inquiry</option>
                    <option value="BULK_ORDER">Bulk Order</option>
                    <option value="REPAIR">Repair Service</option>
                    <option value="QUOTE">Price Quote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Subject *</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-6 px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50">
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
