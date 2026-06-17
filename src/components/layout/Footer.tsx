"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export function Footer({
  contactPhone = "",
  contactEmail = "",
  contactAddress = "",
  gstNumber = "",
  siteName = "Lohiya Suppliers",
  siteTagline = "",
  categories = [],
}: {
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  gstNumber?: string;
  siteName?: string;
  siteTagline?: string;
  categories?: { href: string; label: string }[];
}) {
  const quickLinks = [
    { href: "/products", label: "All Products" },
    ...categories.slice(0, 4),
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="bg-brand-950 text-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-lg">
                LS
              </div>
              <div>
                <div className="font-bold text-white text-lg">{siteName}</div>
                <div className="text-xs text-brand-400">Industrial Abrasives & Tools</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {siteTagline || "Supplying top-grade abrasives to meet the demands of the wooden and metal industries."}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all text-brand-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" />
                <span>{contactAddress || "Contact us for address"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-brand-400" />
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-brand-400" />
                <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                  {contactEmail}
                </a>
              </li>
            </ul>
            <div className="mt-5 p-4 bg-brand-900/80 rounded-xl border border-brand-800 text-xs">
              <div className="text-gray-400 mb-1">GSTIN</div>
              <div className="text-white font-mono">{gstNumber || "—"}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">B2B Account</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Register for custom pricing, GST invoicing, and order approval workflows.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 w-full justify-center py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-colors"
            >
              Open B2B Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`mailto:${contactEmail}?subject=B2B%20Inquiry`}
              className="inline-flex items-center gap-2 w-full justify-center py-2.5 mt-2 border border-brand-700 text-sm rounded-xl hover:bg-brand-900 transition-colors"
            >
              Email Sales Team
            </Link>
          </div>
        </div>

        <div className="border-t border-brand-900 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
