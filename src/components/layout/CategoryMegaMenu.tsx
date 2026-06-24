"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ApplicationType } from "@/lib/catalog-shared";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

export interface MegaMenuDepartment {
  id: string;
  name: string;
  slug: string;
  application: ApplicationType;
  imageUrl: string | null;
  children: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    imageUrl?: string | null;
  }[];
}

export function CategoryMegaMenu({ departments }: { departments: MegaMenuDepartment[] }) {
  const [open, setOpen] = useState(false);
  const [activeDept, setActiveDept] = useState(0);

  const dept = departments[activeDept];

  if (departments.length === 0) return null;

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
          open
            ? "text-brand-700 bg-brand-50"
            : "text-gray-600 hover:text-brand-700 hover:bg-brand-50"
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Categories
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {/* Dropdown — high z-index, responsive width, not clipped by parent */}
      <div
        className={cn(
          "absolute left-0 top-full pt-2 z-[200] transition-all duration-200",
          open
            ? "opacity-100 visible translate-y-0 pointer-events-auto"
            : "opacity-0 invisible -translate-y-1 pointer-events-none"
        )}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-[min(720px,calc(100vw-2rem))] max-h-[min(420px,calc(100vh-8rem))] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-0 flex-1">
            {/* Sidebar */}
            <div className="w-44 sm:w-52 bg-brand-950 text-white p-2 shrink-0 flex flex-col gap-0.5 overflow-y-auto">
              <Link
                href="/products"
                className="px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
                onClick={() => setOpen(false)}
              >
                All Products
              </Link>
              {departments.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onMouseEnter={() => setActiveDept(i)}
                  onFocus={() => setActiveDept(i)}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeDept === i ? "bg-brand-600 text-white" : "text-slate-200 hover:bg-white/10"
                  )}
                >
                  {d.application === ApplicationType.METAL ? "Metal" : "Wood"} Application
                </button>
              ))}
            </div>

            {/* Subcategories */}
            {dept && (
              <div className="flex-1 min-w-0 flex flex-col p-4 overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dept.children.length} subcategories
                    </p>
                  </div>
                  <Link
                    href={`/products?application=${dept.application.toLowerCase()}`}
                    className="shrink-0 text-xs text-brand-600 font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
                    onClick={() => setOpen(false)}
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {dept.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-brand-50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-9 h-9 rounded-md bg-gray-100 overflow-hidden shrink-0 relative">
                          {(sub.imageUrl || dept.imageUrl) && (
                            <OptimizedImage
                              src={sub.imageUrl || dept.imageUrl!}
                              alt=""
                              sizes="36px"
                              className="opacity-90 group-hover:opacity-100"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700 leading-tight">
                            {sub.name}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {sub.productCount} products
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
