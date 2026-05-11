"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import QRCode from "react-qr-code";

const slides = [
  {
    id: "hero",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12"
        >
          <Image
            src="/logo.svg"
            alt="DevItape Logo"
            width={300}
            height={300}
            className="w-64 md:w-96"
          />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-6xl md:text-9xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500"
        >
          DevItape 2026
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-3xl md:text-5xl font-light mt-6 text-gray-300 uppercase tracking-[0.2em]"
        >
          Abertura
        </motion.p>
      </div>
    ),
  },
  {
    id: "speaker",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <Image
            src="https://avatars.githubusercontent.com/paulhenrique"
            alt="Paulo Cândido"
            width={240}
            height={240}
            unoptimized
            className="w-48 md:w-60 h-48 md:h-60 rounded-full border-4 border-white/10 relative z-10"
          />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl font-bold mb-4"
        >
          Paulo Cândido
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl md:text-4xl text-blue-400 font-medium mb-8"
        >
          Senior Software Engineer @ TOTVS
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-6 text-2xl text-gray-400 font-mono"
        >
          <span>github.com/paulhenrique</span>
        </motion.div>
      </div>
    ),
  },
  {
    id: "manifesto",
    content: (
      <div className="flex flex-col items-start justify-center h-full px-20 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-purple-400 border-l-8 border-purple-500 pl-8">
          Manifesto
        </h2>
        <div className="space-y-8">
          <p className="text-4xl md:text-6xl font-medium leading-tight">
            Comunidade não é apenas sobre <span className="text-blue-400">código</span>.
          </p>
          <p className="text-4xl md:text-6xl font-medium leading-tight">
            É sobre <span className="text-purple-400">pessoas</span>, conexão e evolução mútua.
          </p>
          <p className="text-3xl md:text-5xl font-light text-gray-400 mt-12">
            A força de Itapetininga no mapa da tecnologia mundial.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "proverbio",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-20 text-center max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-serif italic leading-tight text-gray-200"
        >
          &quot;Se você quer ir <span className="text-blue-400">rápido</span>, vá sozinho. <br />
          Se você quer ir <span className="text-purple-400">longe</span>, vá em grupo.&quot;
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "200px" }}
          transition={{ delay: 0.5, duration: 1 }}
          className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mt-12"
        />
      </div>
    ),
  },
  {
    id: "pilares",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-20 text-blue-400">Os 3 Pilares</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-7xl">
          {[
            { title: "Conexão", desc: "Networking real e colaboração." },
            { title: "Educação", desc: "Aprendizado contínuo e prático." },
            { title: "Impacto", desc: "Transformar a realidade local." },
          ].map((pilar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 * i }}
              className="bg-white/5 p-12 rounded-3xl border border-white/10 text-center"
            >
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-purple-400">{pilar.title}</h3>
              <p className="text-2xl md:text-3xl font-light text-gray-300">{pilar.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "carreira",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-20 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-blue-400">Impulsionando sua Carreira</h2>
        <div className="relative inline-block mb-12">
          <span className="text-[12rem] md:text-[20rem] font-black opacity-10 absolute inset-0 -top-20">70%</span>
          <p className="text-5xl md:text-8xl font-bold text-white relative z-10">
            Networking
          </p>
        </div>
        <p className="text-3xl md:text-5xl font-light max-w-5xl leading-relaxed">
          Mais de <span className="text-purple-400 font-bold italic">70% das vagas</span> no mercado de tecnologia
          não chegam a ser publicadas. Elas são preenchidas por indicação.
        </p>
      </div>
    ),
  },
  {
    id: "softskills",
    content: (
      <div className="flex flex-col items-start justify-center h-full px-20 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-purple-400">O Laboratório Humano</h2>
        <p className="text-5xl md:text-7xl font-bold mb-8 text-white">Soft Skills</p>
        <p className="text-3xl md:text-5xl font-light text-gray-300 leading-relaxed mb-12">
          A comunidade é o lugar seguro para treinar
          <span className="text-blue-400"> liderança</span>,
          <span className="text-blue-400"> comunicação</span> e
          <span className="text-blue-400"> oratória</span>.
        </p>
        <div className="flex gap-4">
          <div className="h-2 w-24 bg-purple-500 rounded-full"></div>
          <div className="h-2 w-48 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    ),
  },
  {
    id: "formatos",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-blue-400">O que vem por aí</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl mb-16">
          {[
            { title: "Lives", icon: "📺", desc: "Conteúdo ao vivo e interação" },
            { title: "WKNDS", icon: "🤝", desc: "Nossos meetups presenciais" },
            { title: "Workshops", icon: "💻", desc: "Mão na massa e prática" },
            { title: "Cursos", icon: "📚", desc: "Trilhas de aprendizado" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center hover:bg-white/10 transition-colors"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-purple-400">{item.title}</h3>
              <p className="text-lg md:text-xl font-light text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-10 rounded-3xl border border-white/5 shadow-2xl"
        >
          <p className="text-3xl md:text-4xl font-medium leading-relaxed">
            Nada se faz sozinho. Precisamos de <span className="text-blue-400 font-bold">apoio</span>.
          </p>
          <p className="text-2xl md:text-3xl font-light text-gray-400 mt-6 italic">
            &quot;Tudo que você dá para a comunidade, a comunidade devolve em dobro.&quot;
          </p>
        </motion.div>
      </div>
    ),
  },
  {
    id: "comunidades-irmas",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-16 text-purple-400">Ecossistema Regional</h2>
        <p className="text-3xl md:text-5xl font-light mb-20 text-gray-300">Nossas comunidades irmãs</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
          {[
            { name: "DevPira", city: "Piracicaba" },
            { name: "DevLimeira", city: "Limeira" },
            { name: "DevRioClaro", city: "Rio Claro" },
          ].map((comm, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="group"
            >
              <h3 className="text-5xl md:text-7xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">
                {comm.name}
              </h3>
              <p className="text-xl md:text-2xl text-gray-500 mt-2 uppercase tracking-widest">{comm.city}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "whatsapp",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-green-500 flex items-center gap-4">
          Comunidade Oficial
        </h2>
        <p className="text-3xl md:text-5xl font-light mb-16 text-gray-300">Entre no nosso grupo do WhatsApp</p>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-green-500/20 mb-12"
        >
          <QRCode 
            value="https://chat.whatsapp.com/LJI2K0j575ULrs385mrPSc" 
            size={320}
            className="w-64 h-64 md:w-80 md:h-80"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 px-8 py-4 rounded-full"
        >
          <p className="text-xl md:text-2xl font-mono text-gray-400">
            chat.whatsapp.com/LJI2K0j575ULrs385mrPSc
          </p>
        </motion.div>
      </div>
    ),
  },
  {
    id: "cta",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-10">
        <h2 className="text-5xl md:text-8xl font-bold mb-4">Vamos juntos?</h2>
        <p className="text-3xl md:text-5xl font-light text-gray-300 mb-12 max-w-4xl">
          Acesse todos os nossos canais e redes sociais.
        </p>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-purple-500/20 mb-12"
        >
          <QRCode 
            value="https://linktr.ee/devitape" 
            size={240}
            className="w-48 h-48 md:w-60 md:h-60"
          />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-10 py-4 rounded-full text-2xl md:text-3xl font-bold">
            @dev.itape
          </div>
          <div className="text-2xl md:text-3xl font-bold border-2 border-white/20 px-10 py-4 rounded-full">
            linktr.ee/devitape
          </div>
        </div>

        <div className="mt-16">
          <Image
            src="/logo.svg"
            alt="DevItape Logo"
            width={80}
            height={80}
            className="opacity-30"
          />
        </div>
      </div>
    ),
  },
];

export default function AberturaPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = React.useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = React.useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          nextSlide();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prevSlide();
          break;
        case "Home":
          e.preventDefault();
          setDirection(-1);
          setCurrentSlide(0);
          break;
        case "End":
          e.preventDefault();
          setDirection(1);
          setCurrentSlide(slides.length - 1);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <main className="fixed inset-0 bg-[#050505] text-white overflow-hidden select-none">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {slides[currentSlide].content}
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1 transition-all duration-300 ${i === currentSlide ? "w-12 bg-purple-500" : "w-4 bg-white/20"
              }`}
          />
        ))}
      </div>

      {/* Progress Counter */}
      <div className="absolute bottom-10 right-10 text-white/30 font-mono text-xl z-10">
        {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
    </main>
  );
}
