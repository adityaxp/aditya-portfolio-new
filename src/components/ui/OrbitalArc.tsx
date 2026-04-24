"use client";

import { motion } from "framer-motion";
import { orbitalDraw } from "@/lib/animations";

interface OrbitalArcProps {
  className?: string;
  width?: number;
  height?: number;
  direction?: "left" | "right";
}

export default function OrbitalArc({
  className = "",
  width = 400,
  height = 200,
  direction = "right",
}: OrbitalArcProps) {
  const flip = direction === "left" ? -1 : 1;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={`pointer-events-none ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <motion.path
        d={`M ${direction === "left" ? width : 0} ${height * 0.8} Q ${width * 0.5 * flip} ${height * -0.2} ${direction === "left" ? 0 : width} ${height * 0.3}`}
        stroke="#F37338"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        variants={orbitalDraw}
      />
    </motion.svg>
  );
}
