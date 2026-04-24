"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

interface EyebrowLabelProps {
  text: string;
  dotColor?: string;
}

export default function EyebrowLabel({
  text,
  dotColor = "bg-light-orange",
}: EyebrowLabelProps) {
  return (
    <motion.div
      variants={fadeIn}
      className="flex items-center gap-2"
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span className="text-sm font-bold uppercase tracking-[0.04em] text-slate-gray">
        {text}
      </span>
    </motion.div>
  );
}
