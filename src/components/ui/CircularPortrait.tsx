"use client";

import { motion } from "framer-motion";
import { scaleIn } from "@/lib/animations";
import SatelliteCTA from "./SatelliteCTA";

interface CircularPortraitProps {
  gradient: string;
  size?: number;
  satelliteHref?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function CircularPortrait({
  gradient,
  size = 280,
  satelliteHref,
  className = "",
  icon,
}: CircularPortraitProps) {
  return (
    <motion.div
      variants={scaleIn}
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{ background: gradient }}
      >
        {icon && (
          <div className="flex h-full w-full items-center justify-center text-white">
            {icon}
          </div>
        )}
      </div>
      {satelliteHref && (
        <div className="absolute -bottom-1 -right-1">
          <SatelliteCTA href={satelliteHref} size={48} />
        </div>
      )}
    </motion.div>
  );
}
