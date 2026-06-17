"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Grid3X3, Wrench, TreePine, ArrowRight } from "lucide-react";
import { ApplicationType } from "@prisma/client";
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
  }[];
}

const appIcons = {
  [ApplicationType.METAL]: Wrench,
  [ApplicationType.WOOD]: TreePine,
  [ApplicationType.BOTH]: Grid3X3,
};

export function CategoryMegaMenu({ departments }: { departments: MegaMenuDepartment[] }) {
  const [open, setOpen] = useState(false);
  const [activeDept, setActiveDept] = useState(0);

  const dept = departments[activeDept];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
      >
        Categories
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute left-0 top-full pt-2 transition-all duration-200 z-50",
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
        )}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-[720px] animate-fade-in">
          <div className="flex">
            <div className="w-52 bg-brand-950 text-white p-3 shrink-0">
              <Link
                href="/products"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm font-medium mb-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Grid3X3 className="w-4 h-4" />
                All Products
              </Link>
              {departments.map((d, i) => {
                const Icon = appIcons[d.application] || Grid3X3;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onMouseEnter={() => setActiveDept(i)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                      activeDept === i ? "bg-brand-600" : "hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {d.application === ApplicationType.METAL ? "Metal" : "Wood"} Application
                  </button>
                );
              })}
            </div>

            {dept && (
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{dept.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dept.children.length} subcategories
                    </p>
                  </div>
                  <Link
                    href={`/products?application=${dept.application.toLowerCase()}`}
                    className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1"
                    onClick={() => setOpen(false)}
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {dept.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-50 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                        {dept.imageUrl && (
                          <OptimizedImage
                            src={dept.imageUrl}
                            alt=""
                            sizes="40px"
                            className="opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700 truncate">
                          {sub.name}
                        </p>
                        <p className="text-xs text-gray-400">{sub.productCount} products</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
