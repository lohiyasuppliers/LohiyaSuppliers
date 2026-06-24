"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  image: string;
  bio: string;
  location?: string;
}

function TeamCard({
  member,
  index,
  sectionVisible,
}: {
  member: TeamMember;
  index: number;
  sectionVisible: boolean;
}) {
  return (
    <article
      className={cn(
        "group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200/80 transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
        sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Portrait — tall enough for faces to show clearly */}
      <div className="relative w-full aspect-[3/4] max-h-[320px] bg-gradient-to-b from-gray-100 to-gray-200 overflow-hidden">
        <Image
          src={member.image}
          alt={member.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover object-[center_18%] group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>

      <div className="p-5 sm:p-6 border-t border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
        <p className="text-sm font-semibold text-brand-600 mt-1.5 leading-snug">{member.role}</p>

        {member.location && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-2.5">
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            {member.location}
          </p>
        )}

        <p className="text-sm text-gray-600 leading-relaxed mt-3">{member.bio}</p>
      </div>
    </article>
  );
}

export function AboutTeamSection({ team }: { team: TeamMember[] }) {
  const { ref, inView } = useInView(0.08);

  return (
    <section ref={ref} className="relative py-20 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Leadership"
          title={
            <>
              The minds behind{" "}
              <span className="text-gradient">Lohiya Suppliers</span>
            </>
          }
          subtitle="Vision, growth, technology, and digital innovation — driving India's industrial supply chain forward."
          inView={inView}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <TeamCard
              key={member.name}
              member={member}
              index={i}
              sectionVisible={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
