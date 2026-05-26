import { getAllEvents } from "@/lib/events";
import { VolunteersGallery } from "@/components/VolunteersGallery";

export const metadata = {
  title: "Equipe e Voluntários | devitape",
  description: "Conheça as pessoas que fazem a comunidade devitape acontecer.",
};

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

// Helper to normalize LinkedIn URLs for consistent mapping
const normalizeLinkedin = (url: string) => {
  try {
    return url
      .toLowerCase()
      .trim()
      .replace(/\/$/, "")
      .replace("www.", "")
      .split("?")[0];
  } catch {
    return url;
  }
};

export default async function TeamPage() {
  const allEvents = await getAllEvents();
  
  // Filter events to only include those that have already happened or are happening today
  const now = new Date();
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const events = allEvents.filter(event => new Date(event.date) < startOfTomorrow);
  
  const volunteersMap = new Map<string, VolunteerWithEvents>();
  const allEventsList: { name: string; slug: string }[] = [];
  
  // Track events and group volunteers
  events.forEach(event => {
    allEventsList.push({ name: event.title, slug: event.slug });
    
    if (event.volunteers && Array.isArray(event.volunteers)) {
      event.volunteers.forEach(v => {
        if (!v.linkedin || !v.name) return;

        const key = normalizeLinkedin(v.linkedin);
        const existing = volunteersMap.get(key);
        
        if (existing) {
          if (!existing.events.find(e => e.slug === event.slug)) {
            existing.events.push({ 
              name: event.title, 
              slug: event.slug,
              isSpeaker: v.isSpeaker,
              talkTitle: v.talkTitle
            });
          }
        } else {
          volunteersMap.set(key, {
            ...v,
            events: [{ 
              name: event.title, 
              slug: event.slug,
              isSpeaker: v.isSpeaker,
              talkTitle: v.talkTitle
            }]
          });
        }
      });
    }
  });

  const volunteersList = Array.from(volunteersMap.values());
  volunteersList.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-6 md:px-10 lg:px-16 py-16">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Equipe e Voluntários</h1>
      <p className="text-muted-foreground mb-12 max-w-2xl text-lg">
        Um agradecimento especial a todos que doam seu tempo e talento para fortalecer a comunidade tech de Itapetininga e região.
      </p>

      <VolunteersGallery 
        volunteers={volunteersList} 
        allEvents={allEventsList.sort((a, b) => a.name.localeCompare(b.name))} 
      />
    </div>
  );
}
