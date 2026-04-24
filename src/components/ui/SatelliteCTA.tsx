"use client";

import { motion } from "framer-motion";

interface SatelliteCTAProps {
  size?: number;
  className?: string;
  href?: string;
}

export default function SatelliteCTA({
  size = 52,
  className = "",
  href,
}: SatelliteCTAProps) {
  const inner = (
    <motion.div
      className={`flex items-center justify-center rounded-full bg-white text-ink-black shadow-sm ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1, rotate: 45 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 15L15 5M15 5H8M15 5V12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return inner;
}
