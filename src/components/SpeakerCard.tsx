"use client";

import { useState } from "react";
import Link from "next/link";
import { LinkedInIcon } from "./Icons";
import { Mic2 } from "lucide-react";

interface SpeakerCardProps {
  name: string;
  linkedin: string;
  talkTitle?: string;
}

export function SpeakerCard({ name, linkedin, talkTitle }: SpeakerCardProps) {
  const username = linkedin.split("/in/")[1]?.split(/[?#/]/)[0] || "";
  const avatarUrl = `https://unavatar.io/linkedin/${username}?fallback=false`;
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="bg-card border border-border/50 rounded-[2rem] p-8 hover:border-purple-500/50 transition-all group relative overflow-hidden flex flex-col items-center text-center">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
      
      <div className="relative mb-6">
        {/* Speaker Badge */}
        <div className="absolute -top-2 -right-2 z-10 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-purple-400/50">
          <Mic2 className="h-3 w-3" />
          PALESTRANTE
        </div>

        {/* Avatar Container - Made Larger */}
        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-3xl overflow-hidden border-2 border-border/50 bg-muted shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:border-purple-500/50 flex items-center justify-center">
          {hasError ? (
            <div className="h-full w-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white font-bold text-4xl tracking-tighter">
              {initials}
            </div>
          ) : (
            <img 
              src={avatarUrl} 
              alt={name}
              className="h-full w-full object-cover transition-all duration-500"
              onError={() => setHasError(true)}
            />
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-2xl font-bold group-hover:text-purple-400 transition-colors mb-2">{name}</h3>
        <Link 
          href={linkedin} 
          target="_blank" 
          className="text-muted-foreground hover:text-blue-500 transition-colors inline-flex items-center gap-2 text-sm"
        >
          <LinkedInIcon className="h-4 w-4" />
          LinkedIn
        </Link>
      </div>

      {talkTitle && (
        <div className="w-full mt-auto bg-muted/50 rounded-2xl p-5 border border-border/50 relative overflow-hidden group/talk">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/talk:opacity-100 transition-opacity" />
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] block mb-2 relative z-10">PALESTRA</span>
          <p className="font-semibold text-foreground leading-tight italic relative z-10 text-lg">
            &quot;{talkTitle}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
