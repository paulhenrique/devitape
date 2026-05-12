"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RedirectCountdownProps {
  targetUrl: string;
}

export default function RedirectCountdown({ targetUrl }: RedirectCountdownProps) {
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.assign(targetUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <img src="/logo.png" alt="devitape logo" className="h-24 md:h-32 w-auto mx-auto" />
      </motion.div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        Você está sendo redirecionado...
      </h1>
      
      <p className="text-muted-foreground text-lg mb-8">
        Em instantes você será levado para o destino solicitado.
      </p>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/20"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="283"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 283 }}
            transition={{ duration: 3, ease: "linear" }}
            className="text-purple-500"
          />
        </svg>
        <span className="text-4xl font-mono font-bold">{seconds}</span>
      </div>

      <div className="mt-12">
        <a 
          href={targetUrl}
          className="text-sm text-purple-400 hover:underline transition-all"
        >
          Clique aqui se não for redirecionado automaticamente
        </a>
      </div>
    </div>
  );
}
