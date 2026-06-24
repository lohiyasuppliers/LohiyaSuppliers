import { prisma } from "@/lib/prisma";
import { CATALOG_IMAGES as IMG } from "@/lib/catalog-images";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutMarquee } from "@/components/about/AboutMarquee";
import { AboutBusinessSection } from "@/components/about/AboutBusinessSection";
import { AboutValues } from "@/components/about/AboutValues";
import { AboutTeamSection } from "@/components/about/AboutTeamSection";
import { AboutStatsSection } from "@/components/about/AboutStatsSection";
import { AboutFeatures } from "@/components/about/AboutFeatures";
import { AboutOfferBento } from "@/components/about/AboutOfferBento";
import { AboutCTA } from "@/components/about/AboutCTA";

export const metadata = { title: "About Us" };

const TEAM = [
  {
    name: "Anil Kumar Lohiya",
    role: "Founder & Chief Strategic Advisor",
    initials: "AL",
    image: IMG.teamAnil,
    bio: "Established Lohiya Suppliers in 2011 as a proprietorship business from Plot No. 145, Ram Nagar Shopping Centre, Shastri Nagar, Jaipur. With deep business insight and visionary thinking, he leads long-term strategic direction — emphasizing sustainable expansion, structured decision-making, and a strong organizational foundation for industrial abrasives and engineering supplies.",
  },
  {
    name: "Sunil Lohiya",
    role: "Director — Business Growth & Strategic Development",
    initials: "SL",
    image: IMG.teamSunil,
    bio: "Brings strong expertise in business development, organizational planning, and strategic execution. Identifies growth opportunities and strengthens operational direction — contributing significantly to Lohiya Suppliers' evolving success across metal and wood industry segments.",
  },
  {
    name: "Shivam Lohiya",
    role: "Co-Founder — Operations & Technology",
    initials: "SH",
    image: IMG.teamShivam,
    bio: "Strategic leader building the technology and operations backbone of the business. With consulting rigor from large-scale government projects at PwC for Rajasthan, he drives digital systems, finance, operations integration, and scalable processes that power reliable B2B service for thousands of industrial clients.",
  },
  {
    name: "Ishant Goyal",
    role: "Vice President — Head of Website Development & Management and AI Specialist",
    initials: "IG",
    image: IMG.teamIshant,
    location: "Jaipur, Rajasthan",
    bio: "Leads the planning, development, optimization, and management of web platforms to ensure high performance and exceptional user experiences. With expertise in modern web technologies and digital transformation, he drives innovative solutions that align with business goals. He also focuses on integrating Artificial Intelligence (AI) technologies to enhance website functionality, automation, personalization, and operational efficiency.",
  },
];

export default async function AboutPage() {
  const [productCount, categoryCount, orderCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <div className="overflow-x-hidden">
      <AboutHero image={IMG.aboutHero} />
      <AboutMarquee />

      <AboutBusinessSection workshopImage={IMG.aboutWorkshop} warehouseImage={IMG.aboutWarehouse} />

      <AboutValues />

      <AboutTeamSection team={TEAM} />

      <AboutStatsSection
        productCount={productCount}
        categoryCount={categoryCount}
        orderCount={orderCount}
      />

      <AboutFeatures />

      <AboutOfferBento
        items={[
          {
            title: "Metal Industry",
            desc: "Cutting wheels, grinding discs, flap discs, and INOX-rated abrasives for metal fabrication.",
            image: IMG.aboutMetal,
            href: "/products?application=metal",
          },
          {
            title: "Wood Industry",
            desc: "Sanding belts, polishing discs, and finishing abrasives for woodworking and furniture.",
            image: IMG.aboutWood,
            href: "/products?application=wood",
          },
          {
            title: "Repair Services",
            desc: "Expert bandsaw blade repair and sharpening for bookbinding equipment.",
            image: IMG.aboutRepair,
            href: "/categories/book-repair-services",
          },
        ]}
      />

      <AboutCTA image={IMG.aboutFactory} />
    </div>
  );
}
