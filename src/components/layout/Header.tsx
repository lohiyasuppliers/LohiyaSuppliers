"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, Suspense } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  User,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Phone,
  Mail,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { MegaMenuDepartment } from "@/components/layout/CategoryMegaMenu";
import { StoreNavLinks } from "@/components/layout/StoreNavLinks";
import { ContactPhoneLinks } from "@/components/layout/ContactPhoneLinks";

const HeaderSearch = dynamic(
  () => import("@/components/layout/HeaderSearch").then((m) => ({ default: m.HeaderSearch })),
  {
    ssr: false,
    loading: () => <div className="h-10 w-full rounded-xl bg-gray-100 animate-pulse" />,
  }
);

export function Header({
  contactEmail = "",
  catalogTree = [],
}: {
  contactEmail?: string;
  catalogTree?: MegaMenuDepartment[];
}) {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm animate-fade-in">
      <div className="bg-brand-950 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-brand-300" />
            Worldwide Shipping · Premium Industrial Abrasives
          </span>
          <span className="hidden sm:flex items-center gap-4 text-brand-200">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <ContactPhoneLinks linkClassName="hover:text-white transition-colors" />
            </span>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-1 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" /> {contactEmail}
              </a>
            )}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-900/20 group-hover:scale-105 transition-transform">
              LS
            </div>
            <div>
              <div className="font-bold text-lg text-brand-900 leading-tight">Lohiya Suppliers</div>
              <div className="text-xs text-gray-500 hidden sm:block">Industrial Abrasives & Tools</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl hover:bg-brand-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center ring-2 ring-brand-200">
                    <User className="w-4 h-4 text-brand-700" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {session.user?.name || "Account"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-600" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Account
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-brand-700 hover:text-brand-900">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-5">
                  Register
                </Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 pb-3 border-t border-gray-100 pt-3 overflow-visible relative z-40">
          <Suspense fallback={<div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <StoreNavLinks catalogTree={catalogTree} variant="desktop" />
          </Suspense>
        </nav>
      </div>

      <div
        className={cn(
          "lg:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-[32rem] overflow-y-auto" : "max-h-0"
        )}
      >
        <nav className="px-4 py-3 flex flex-col gap-1">
          <Suspense fallback={null}>
            <StoreNavLinks catalogTree={catalogTree} variant="mobile" onNavigate={closeMobile} />
          </Suspense>
          {!session && (
            <>
              <Link href="/login" className="px-3 py-2.5 text-sm font-medium text-brand-700" onClick={closeMobile}>
                Login
              </Link>
              <Link href="/register" className="px-3 py-2.5 text-sm font-medium text-brand-700" onClick={closeMobile}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
