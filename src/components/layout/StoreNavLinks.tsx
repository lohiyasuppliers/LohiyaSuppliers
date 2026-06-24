"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CategoryMegaMenu, MegaMenuDepartment } from "@/components/layout/CategoryMegaMenu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "All Products", match: "products-all" },
  { href: "/products?application=metal", label: "Metal Application", match: "metal" },
  { href: "/products?application=wood", label: "Wood Application", match: "wood" },
  { href: "/about", label: "About", match: "about" },
  { href: "/contact", label: "Contact", match: "contact" },
];

function linkIsActive(pathname: string, application: string | null, href: string): boolean {
  if (href === "/about") return pathname === "/about";
  if (href === "/contact") return pathname === "/contact";
  if (href === "/products") return pathname === "/products" && !application;
  if (href.includes("application=metal")) return pathname === "/products" && application === "metal";
  if (href.includes("application=wood")) return pathname === "/products" && application === "wood";
  return pathname === href;
}

interface StoreNavLinksProps {
  catalogTree: MegaMenuDepartment[];
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function StoreNavLinks({ catalogTree, variant, onNavigate }: StoreNavLinksProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const application = searchParams.get("application");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const linkClass = (href: string) =>
    cn(
      "nav-link-motion whitespace-nowrap motion-btn-press",
      variant === "desktop"
        ? "px-3 py-1.5 text-sm font-medium rounded-lg"
        : "px-3 py-2.5 text-sm font-medium rounded-lg block",
      linkIsActive(pathname, application, href)
        ? "bg-brand-600 text-white shadow-md shadow-brand-600/20 nav-link-active scale-[1.02]"
        : variant === "desktop"
          ? "text-gray-600 hover:text-brand-700 hover:bg-brand-50"
          : "text-gray-700 hover:bg-brand-50"
    );

  if (variant === "desktop") {
    return (
      <>
        {catalogTree.length > 0 && <CategoryMegaMenu departments={catalogTree} />}
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass(link.href)}>
            {link.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setCatalogOpen(!catalogOpen)}
        className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 rounded-lg"
      >
        <span>Browse Categories</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", catalogOpen && "rotate-180")} />
      </button>

      {catalogOpen && (
        <div className="ml-3 space-y-3 pb-2 border-l-2 border-brand-100 pl-3">
          <Link
            href="/products"
            className="block text-sm text-brand-700 font-medium py-1"
            onClick={onNavigate}
          >
            All Products
          </Link>
          {catalogTree.map((dept) => (
              <div key={dept.id}>
                <Link
                  href={`/products?application=${dept.application.toLowerCase()}`}
                  className="text-sm font-semibold text-gray-800 py-1 block"
                  onClick={onNavigate}
                >
                  {dept.name}
                </Link>
                <div className="ml-5 space-y-0.5">
                  {dept.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      className="block text-xs text-gray-600 py-1 hover:text-brand-600"
                      onClick={onNavigate}
                    >
                      {sub.name} ({sub.productCount})
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={linkClass(link.href)}
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
