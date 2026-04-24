"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import type { ReactNode } from "react";

interface SectionWrapperProps {
  id?: string;
  children: ReactNode;
  className?: string;
  background?: "cream" | "lifted" | "ink";
}

const bgMap = {
  cream: "bg-canvas-cream",
  lifted: "bg-lifted-cream",
  ink: "bg-ink-black text-white",
};

export default function SectionWrapper({
  id,
  children,
  className = "",
  background = "cream",
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={`relative py-24 md:py-32 lg:py-40 ${bgMap[background]} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        {children}
      </div>
    </motion.section>
  );
}
