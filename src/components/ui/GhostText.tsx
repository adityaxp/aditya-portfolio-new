"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

interface GhostTextProps {
  text: string;
  className?: string;
}

export default function GhostText({ text, className = "" }: GhostTextProps) {
  return (
    <motion.div
      variants={fadeIn}
      aria-hidden="true"
      className={`pointer-events-none select-none text-[clamp(4rem,10vw,8rem)] font-medium leading-none tracking-[-0.02em] text-whisper ${className}`}
    >
      {text}
    </motion.div>
  );
}
