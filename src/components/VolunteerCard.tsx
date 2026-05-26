"use client";

import Link from "next/link";
import { LinkedInIcon } from "./Icons";

interface VolunteerWithEvents {
  name: string;
  linkedin: string;
  events: { name: string; slug: string }[];
}

export function VolunteerCard({ volunteer }: { volunteer: VolunteerWithEvents }) {
  // Extract username more robustly
  const username = volunteer.linkedin
    .split("/in/")[1]
    ?.split(/[?#/]/)[0] || "";
    
  const avatarUrl = `https://unavatar.io/linkedin/${username}`;

  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative mb-6">
        {/* Subtler gradient ring */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/40 to-blue-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-2 border-border/50 bg-muted shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:border-purple-500/50">
          <img 
            src={avatarUrl} 
            alt={volunteer.name}
            className="h-full w-full object-cover transition-all duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(volunteer.name)}&background=random&color=fff&size=256`;
            }}
          />
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors">
        {volunteer.name}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-1.5 mb-4 max-w-[180px]">
        {volunteer.events.map((event) => (
          <span 
            key={event.slug} 
            className="text-[9px] font-semibold uppercase tracking-tight text-muted-foreground bg-secondary/50 border border-border/50 px-2 py-0.5 rounded-md backdrop-blur-sm"
            title={event.name}
          >
            {event.name.split('-')[0].trim()}
          </span>
        ))}
      </div>
      
      <Link 
        href={volunteer.linkedin} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-secondary/30 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
        title="Perfil no LinkedIn"
      >
        <LinkedInIcon className="h-5 w-5" />
      </Link>
    </div>
  );
}
