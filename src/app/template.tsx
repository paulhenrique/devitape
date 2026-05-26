"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 z-[9999] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          ease: [0.22, 1, 0.36, 1], 
          duration: 0.6 
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
