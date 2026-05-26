"use client";

import { useState, useMemo } from "react";
import { VolunteerCard } from "./VolunteerCard";
import { Search, Filter, X } from "lucide-react";

interface VolunteerWithEvents {
  name: string;
  linkedin: string;
  events: { name: string; slug: string }[];
}

interface VolunteersGalleryProps {
  volunteers: VolunteerWithEvents[];
  allEvents: { name: string; slug: string }[];
}

export function VolunteersGallery({ volunteers, allEvents }: VolunteersGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      const matchesEvent = selectedEvent === "all" || v.events.some((e) => e.slug === selectedEvent);
      return matchesSearch && matchesEvent;
    });
  }, [volunteers, search, selectedEvent]);

  const clearFilters = () => {
    setSearch("");
    setSelectedEvent("all");
  };

  return (
    <div className="space-y-12">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar voluntário pelo nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full md:w-64 bg-background border border-border/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todos os Eventos</option>
            {allEvents.map((event) => (
              <option key={event.slug} value={event.slug}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Section */}
      {filteredVolunteers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
          {filteredVolunteers.map((volunteer) => (
            <VolunteerCard key={volunteer.linkedin} volunteer={volunteer} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center">
          <p className="text-muted-foreground mb-4 text-lg">Nenhum voluntário encontrado com esses filtros.</p>
          <button
            onClick={clearFilters}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-2"
          >
            <X className="h-4 w-4" /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
