import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Lohiya Suppliers | Premium Industrial Abrasives & Tools",
    template: "%s | Lohiya Suppliers",
  },
  description:
    "Supplying top-grade abrasives to meet the demands of the wooden and metal industries. Cutting wheels, grinding wheels, flap discs, and expert repair services.",
  keywords: [
    "abrasives",
    "cutting wheels",
    "grinding wheels",
    "flap discs",
    "woodworking tools",
    "metal industry",
    "B2B supplies",
    "Lohiya Suppliers",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
