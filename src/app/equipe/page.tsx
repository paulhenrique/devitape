import { getAllEvents } from "@/lib/events";
import { VolunteerCard } from "@/components/VolunteerCard";

export const metadata = {
  title: "Equipe e Voluntários | devitape",
  description: "Conheça as pessoas que fazem a comunidade devitape acontecer.",
};

interface VolunteerWithEvents {
  name: string;
  linkedin: string;
  events: { name: string; slug: string }[];
}

// Helper to normalize LinkedIn URLs for consistent mapping
const normalizeLinkedin = (url: string) => {
  try {
    return url
      .toLowerCase()
      .trim()
      .replace(/\/$/, "") // Remove trailing slash
      .replace("www.", "") // Remove www.
      .split("?")[0]; // Remove query params
  } catch {
    return url;
  }
};

export default async function TeamPage() {
  const events = await getAllEvents();
  
  const volunteersMap = new Map<string, VolunteerWithEvents>();
  
  events.forEach(event => {
    if (event.volunteers && Array.isArray(event.volunteers)) {
      event.volunteers.forEach(v => {
        if (!v.linkedin || !v.name) return;

        const key = normalizeLinkedin(v.linkedin);
        const existing = volunteersMap.get(key);
        
        if (existing) {
          if (!existing.events.find(e => e.slug === event.slug)) {
            existing.events.push({ name: event.title, slug: event.slug });
          }
        } else {
          volunteersMap.set(key, {
            ...v,
            events: [{ name: event.title, slug: event.slug }]
          });
        }
      });
    }
  });

  const volunteersList = Array.from(volunteersMap.values());

  // Sort by name
  volunteersList.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-6 md:px-10 lg:px-16 py-16">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Equipe e Voluntários</h1>
      <p className="text-muted-foreground mb-12 max-w-2xl text-lg">
        Um agradecimento especial a todos que doam seu tempo e talento para fortalecer a comunidade tech de Itapetininga e região.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
        {volunteersList.map((volunteer) => (
          <VolunteerCard key={volunteer.linkedin} volunteer={volunteer} />
        ))}
      </div>

      {volunteersList.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border">
          <h3 className="text-xl font-bold mb-2">Nenhum voluntário encontrado</h3>
          <p className="text-muted-foreground">Em breve teremos mais novidades!</p>
        </div>
      )}
    </div>
  );
}
