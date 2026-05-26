"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LinkedInIcon } from "./Icons";
import { Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VolunteerWithEvents {
  name: string;
  linkedin: string;
  events: { 
    name: string; 
    slug: string; 
    isSpeaker?: boolean; 
    talkTitle?: string 
  }[];
}

export function VolunteerCard({ volunteer }: { volunteer: VolunteerWithEvents }) {
  // Extract username more robustly
  const username = volunteer.linkedin
    .split("/in/")[1]
    ?.split(/[?#/]/)[0] || "";

  const avatarUrl = `https://unavatar.io/linkedin/${username}?fallback=false`;
  const [imgSrc, setImgSrc] = useState(avatarUrl);
  const [hasError, setHasError] = useState(false);

  // Robustly handle images that are already broken or fail later
  useEffect(() => {
    const img = new Image();
    img.src = avatarUrl;
    img.onerror = () => {
      setHasError(true);
      setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(volunteer.name)}&background=6b21a8&color=fff&size=256&font-size=0.33`);
    };
  }, [avatarUrl, volunteer.name]);

  const hasBeenSpeaker = volunteer.events.some(e => e.isSpeaker);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(volunteer.name)}&background=6b21a8&color=fff&size=256&font-size=0.33`);
    }
  };

  return (
    <div className="group flex flex-col items-center text-center relative">
      <div className="relative mb-6">
        {/* Speaker Badge */}
        {hasBeenSpeaker && (
          <div className="absolute -top-2 -right-2 z-10 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border border-purple-400/50">
            <Mic2 className="h-3 w-3" />
            PALESTRANTE
          </div>
        )}

        {/* Subtler gradient ring */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/40 to-blue-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-2 border-border/50 bg-muted shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:border-purple-500/50">
          <img 
            key={imgSrc}
            src={imgSrc} 
            alt={volunteer.name}
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              hasError ? "p-1 opacity-90" : ""
            )}
            onError={handleImageError}
          />
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors">
        {volunteer.name}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-1.5 mb-4 max-w-[180px]">
        {volunteer.events.map((event) => (
          <div key={event.slug} className="flex flex-col items-center gap-1">
            <span 
              className={cn(
                "text-[9px] font-semibold uppercase tracking-tight px-2 py-0.5 rounded-md backdrop-blur-sm border",
                event.isSpeaker 
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                  : "bg-secondary/50 border-border/50 text-muted-foreground"
              )}
              title={event.talkTitle ? `${event.name}: ${event.talkTitle}` : event.name}
            >
              {event.name.split('-')[0].trim()}
              {event.isSpeaker && " 🎙️"}
            </span>
          </div>
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
