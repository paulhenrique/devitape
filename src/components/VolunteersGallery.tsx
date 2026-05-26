"use client";

import { useState, useMemo } from "react";
import { VolunteerCard } from "./VolunteerCard";
import { Search, Check, ChevronsUpDown, X, Mic2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VolunteerWithEvents {
  name: string;
  linkedin: string;
  events: { 
    name: string; 
    slug: string;
    isSpeaker?: boolean;
    talkTitle?: string;
  }[];
}

interface VolunteersGalleryProps {
  volunteers: VolunteerWithEvents[];
  allEvents: { name: string; slug: string }[];
}

export function VolunteersGallery({ volunteers, allEvents }: VolunteersGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [isSpeakersOnly, setIsSpeakersOnly] = useState(false);
  const [open, setOpen] = useState(false);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      const matchesEvent = selectedEvent === "all" || v.events.some((e) => e.slug === selectedEvent);
      const matchesSpeaker = !isSpeakersOnly || v.events.some((e) => e.isSpeaker);
      return matchesSearch && matchesEvent && matchesSpeaker;
    });
  }, [volunteers, search, selectedEvent, isSpeakersOnly]);

  const clearFilters = () => {
    setSearch("");
    setSelectedEvent("all");
    setIsSpeakersOnly(false);
  };

  const selectedEventLabel = useMemo(() => {
    if (selectedEvent === "all") return "Todos os Eventos";
    return allEvents.find((e) => e.slug === selectedEvent)?.name || "Todos os Eventos";
  }, [selectedEvent, allEvents]);

  return (
    <div className="space-y-12">
      {/* Filters Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-muted/20 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:max-w-3xl">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 bg-background/40 border border-border/50 px-4 py-2 rounded-xl">
            <Switch 
              id="speakers-only" 
              checked={isSpeakersOnly}
              onCheckedChange={setIsSpeakersOnly}
            />
            <Label htmlFor="speakers-only" className="text-xs font-medium cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
              <Mic2 className="h-3.5 w-3.5 text-purple-400" />
              Somente Palestrantes
            </Label>
          </div>
        </div>

        <div className="w-full lg:w-auto">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full md:w-[300px] justify-between bg-background/50 border-border/50 rounded-xl hover:bg-background/80"
              >
                <span className="truncate">
                  {selectedEventLabel}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full md:w-[300px] p-0 rounded-xl border-border/50 shadow-2xl">
              <Command className="bg-background">
                <CommandInput placeholder="Filtrar por evento..." className="h-10" />
                <CommandList>
                  <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedEvent("all");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEvent === "all" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Todos os Eventos
                    </CommandItem>
                    {allEvents.map((event) => (
                      <CommandItem
                        key={event.slug}
                        value={event.slug}
                        onSelect={() => {
                          setSelectedEvent(event.slug);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEvent === event.slug ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {event.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results Section with Animation */}
      <AnimatePresence mode="popLayout">
        {filteredVolunteers.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12"
          >
            {filteredVolunteers.map((volunteer) => (
              <motion.div
                key={volunteer.linkedin}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <VolunteerCard volunteer={volunteer} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50 flex flex-col items-center"
          >
            <p className="text-muted-foreground mb-4 text-lg">Nenhum voluntário encontrado com esses filtros.</p>
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-2"
            >
              <X className="h-4 w-4" /> Limpar filtros
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
