"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, ExternalLink, Camera, Users, Mic2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { LinkedInIcon } from "@/components/Icons";
import { SpeakerCard } from "@/components/SpeakerCard";
import { motion } from "framer-motion";
import { Event } from "@/types/event";

interface EventPageClientProps {
  event: Event;
}

export default function EventPageClient({ event }: EventPageClientProps) {
  const speakers = event.volunteers?.filter((v) => v.isSpeaker) || [];
  const volunteers = event.volunteers?.filter((v) => !v.isSpeaker) || [];
  const isPast = new Date(event.date) < new Date();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="container mx-auto px-6 pt-8"
      >
        <Button variant="ghost" asChild className="mb-6 hover:bg-purple-500/10 hover:text-purple-400 transition-colors">
          <Link href="/eventos" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Eventos
          </Link>
        </Button>
      </motion.div>

      {/* Main Hero */}
      <section className="container mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={stagger}
            className="order-2 lg:order-1"
          >
            <motion.div variants={fadeIn} className="flex items-center gap-3 text-purple-400 font-semibold mb-4 text-sm uppercase tracking-widest">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
              {event.title}
            </motion.h1>
            <motion.div variants={fadeIn} className="flex items-center text-muted-foreground mb-8 text-lg">
              <MapPin className="mr-2 h-5 w-5 text-purple-500/70" />
              {event.location}
            </motion.div>
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-10 leading-relaxed">
              {event.description}
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 text-white text-lg h-14 px-8 rounded-xl shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02]"
                asChild
              >
                <Link href={event.externalLink} target="_blank">
                  {isPast ? "Ver no Sympla" : "Garantir minha vaga"}
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {event.photosLink && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/10 text-lg h-14 px-8 rounded-xl transition-all"
                  asChild
                >
                  <Link href={event.photosLink} target="_blank">
                    <Camera className="mr-2 h-5 w-5" />
                    Fotos do Evento
                  </Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-purple-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity" />
              
              <div className="relative aspect-[1600/868] rounded-[2rem] overflow-hidden shadow-2xl border border-border/50 bg-muted">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {isPast && (
                  <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md text-white font-bold uppercase tracking-widest text-xs border border-white/20 px-4 py-2 rounded-full">
                    Evento Encerrado
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Speakers Hero */}
      {speakers.length > 0 && (
        <section className="py-32 container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold uppercase tracking-wider mb-6">
              <Mic2 className="h-4 w-4" />
              Palestrantes
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Quem passou pelo palco</h2>
          </motion.div>
          
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {speakers.map((speaker, index) => (
              <motion.div key={index} variants={fadeIn}>
                <SpeakerCard 
                  name={speaker.name}
                  linkedin={speaker.linkedin}
                  talkTitle={speaker.talkTitle}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Volunteers Hero */}
      {volunteers.length > 0 && (
        <section className="py-32 bg-muted/20 border-t border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-wider mb-6">
                <Users className="h-4 w-4" />
                Time de Voluntários
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Quem fez acontecer</h2>
            </motion.div>
            
            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8"
            >
              {volunteers.map((volunteer, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeIn}
                  className="flex flex-col items-center text-center group"
                >
                  <VolunteerAvatar name={volunteer.name} linkedin={volunteer.linkedin} />
                  <h3 className="font-bold text-sm mb-1">{volunteer.name}</h3>
                  <Link 
                    href={volunteer.linkedin} 
                    target="_blank" 
                    className="text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    <LinkedInIcon className="h-4 w-4" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Photos CTA Hero */}
      <section className="py-32 container mx-auto px-6">
        {event.photosLink ? (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-[3rem] p-12 md:p-24 text-center text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group"
          >
            {/* Animated background shapes */}
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
                x: [0, 20, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-white/20 transition-colors duration-700" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                x: [0, -30, 0],
                y: [0, 20, 0]
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-[80px] -ml-20 -mb-20" 
            />
            
            <div className="relative z-10">
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [3, -3, 3]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="bg-white/20 w-24 h-24 rounded-3xl backdrop-blur-md flex items-center justify-center mx-auto mb-10 border border-white/30 shadow-xl"
              >
                <Camera className="h-12 w-12 text-white" />
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight text-white">Reviva cada momento!</h2>
              <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                As fotos do evento já estão disponíveis. Clique abaixo para conferir o álbum completo.
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-purple-600 hover:bg-purple-50 rounded-2xl px-12 text-xl h-16 font-bold transition-all hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href={event.photosLink} target="_blank">
                  Ver Álbum Completo
                </Link>
              </Button>
            </div>
          </motion.div>
        ) : isPast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-muted/30 rounded-[3rem] p-12 md:p-24 text-center border border-border relative overflow-hidden"
          >
             <div className="bg-purple-500/5 absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from)_0%,transparent_70%)]" />
             <div className="relative z-10">
                <Camera className="h-20 w-20 text-muted-foreground/30 mx-auto mb-8" />
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Em breve as fotos...</h2>
                <p className="text-xl text-muted-foreground mb-0 max-w-2xl mx-auto">
                  Estamos selecionando os melhores cliques deste dia incrível.
                </p>
             </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function VolunteerAvatar({ name, linkedin }: { name: string, linkedin: string }) {
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
    <div className="h-24 w-24 rounded-2xl overflow-hidden mb-4 border-2 border-border/50 group-hover:border-purple-500/50 transition-all group-hover:scale-105 shadow-lg flex items-center justify-center bg-muted">
      {hasError ? (
        <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
          {initials}
        </div>
      ) : (
        <img 
          src={avatarUrl} 
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
