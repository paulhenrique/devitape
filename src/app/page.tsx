import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLatestEvent } from "@/lib/events";
import { Calendar, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function Home() {
  const latestEvent = await getLatestEvent();

  return (
    <div className="flex flex-col">
      {latestEvent && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": latestEvent.title,
              "startDate": latestEvent.date,
              "location": {
                "@type": "Place",
                "name": latestEvent.location,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Itapetininga",
                  "addressRegion": "SP",
                  "addressCountry": "BR"
                }
              },
              "image": [latestEvent.image],
              "description": latestEvent.description,
              "offers": {
                "@type": "Offer",
                "url": latestEvent.externalLink,
                "availability": "https://schema.org/InStock"
              }
            }),
          }}
        />
      )}
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
        <div className="container relative mx-auto px-6 md:px-10 lg:px-16 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            A comunidade dev de <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              Itapetininga e região
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Unindo desenvolvedores, engenheiros de software e entusiastas de tecnologia para compartilhar conhecimento e fortalecer o ecossistema local.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-full h-14 text-lg font-semibold group" asChild>
              <Link href="https://chat.whatsapp.com/exemplo" target="_blank">
                Entrar na Comunidade
                <MessageCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 rounded-full h-14 text-lg" asChild>
              <Link href="/eventos">
                Ver Eventos
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Event Section */}
      {latestEvent && (
        <section className="py-20 bg-white/5 border-b border-white/5">
          <div className="container mx-auto px-6 md:px-10 lg:px-16">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <h2 className="text-3xl font-bold mb-4 md:mb-0">Próximo Evento</h2>
              <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto text-lg" asChild>
                <Link href="/eventos" className="flex items-center">
                  Ver todos os eventos <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center bg-black/40 border border-white/10 rounded-3xl overflow-hidden p-8 md:p-12 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <img 
                  src={latestEvent.image} 
                  alt={latestEvent.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    DESTAQUE
                  </span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-purple-400" />
                    {format(new Date(latestEvent.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 group-hover:text-purple-400 transition-colors">{latestEvent.title}</h3>
                <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                  {latestEvent.description}
                </p>
                <div className="flex items-center text-gray-400 mb-8">
                  <MapPin className="mr-2 h-5 w-5 text-purple-400" />
                  {latestEvent.location}
                </div>
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8" asChild>
                  <Link href={latestEvent.externalLink} target="_blank">
                    Garantir minha vaga
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-24 border-b border-white/5">
        <div className="container mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">O que é o <span className="text-purple-400">devitape</span>?</h2>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                Nascemos da vontade de conectar os talentos tech de Itapetininga e região. Acreditamos que o compartilhamento de experiências e o networking local são fundamentais para o crescimento profissional de cada membro.
              </p>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Seja você um desenvolvedor sênior, um estudante começando agora ou um entusiasta de engenharia de software, aqui é o seu lugar.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">+100</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Membros</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">Meetups</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Frequentes</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 text-sm">✓</span>
                Nossos Pilares
              </h3>
              <ul className="space-y-6">
                <li className="flex flex-col">
                  <span className="font-bold text-white mb-1">Networking Local</span>
                  <span className="text-gray-400 text-sm">Conecte-se com profissionais que moram e trabalham perto de você.</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold text-white mb-1">Compartilhamento de Conhecimento</span>
                  <span className="text-gray-400 text-sm">Palestras, workshops e discussões sobre tendências de mercado e engenharia.</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold text-white mb-1">Fortalecimento do Ecossistema</span>
                  <span className="text-gray-400 text-sm">Aproximar empresas locais e talentos, fomentando inovação em Itapetininga.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
