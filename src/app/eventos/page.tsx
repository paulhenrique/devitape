import Link from "next/link";
import { getAllEvents } from "@/lib/events";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Eventos | devitape",
  description: "Confira os próximos meetups e eventos da comunidade devitape em Itapetininga e região.",
};

export default async function EventsPage() {
  const events = await getAllEvents();
  const now = new Date();
  
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  return (
    <div className="container mx-auto px-6 md:px-10 lg:px-16 py-16">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Eventos</h1>
      <p className="text-gray-400 mb-12 max-w-2xl text-lg">
        Fique por dentro de tudo o que acontece na nossa comunidade. Palestras, meetups e muito networking.
      </p>

      {upcomingEvents.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
            Próximos Eventos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map(event => (
              <EventCard key={event.slug} event={event} isPast={false} />
            ))}
          </div>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-8 text-gray-400">Eventos Passados</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-70">
            {pastEvents.map(event => (
              <EventCard key={event.slug} event={event} isPast={true} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-400">Fique atento ao nosso grupo do WhatsApp para novidades!</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isPast }: { event: any, isPast: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {isPast && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold uppercase tracking-widest text-sm border border-white/20 px-4 py-2 rounded">Encerrado</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center text-gray-400 text-xs mb-3">
          <Calendar className="mr-2 h-3 w-3 text-purple-400" />
          {format(new Date(event.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">{event.description}</p>
        <div className="flex items-center text-gray-500 text-xs mb-6">
          <MapPin className="mr-2 h-3 w-3" />
          {event.location}
        </div>
        <Button 
          variant={isPast ? "secondary" : "default"} 
          className={`w-full ${!isPast ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
          disabled={isPast}
          asChild
        >
          <Link href={event.externalLink} target="_blank" className="flex items-center justify-center">
            {isPast ? "Evento Finalizado" : "Ver detalhes / Inscrição"}
            {!isPast && <ExternalLink className="ml-2 h-4 w-4" />}
          </Link>
        </Button>
      </div>
    </div>
  );
}
