"use client";

import { motion, useReducedMotion } from "framer-motion";

export function PageMotion({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
