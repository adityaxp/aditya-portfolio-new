"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import SectionWrapper from "@/components/ui/SectionWrapper";
import EyebrowLabel from "@/components/ui/EyebrowLabel";
import GhostText from "@/components/ui/GhostText";
import { experiences } from "@/lib/constants";

function renderDescriptionPoint(point: string) {
  const parts = point.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");

    if (isBold) {
      return (
        <strong
          key={`${part}-${index}`}
          className="font-semibold text-ink-black"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function Experience() {
  return (
    <SectionWrapper id="experience" background="lifted">
      <GhostText
        text="Experience"
        className="absolute top-5 left-6 md:left-12 lg:left-16"
      />

      <div className="relative z-10">
        <motion.div variants={fadeUp} className="mb-16 max-w-2xl">
          <h2 className="mt-4 text-[clamp(2rem,5vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink-black">
            Places where I&apos;ve shaped products and grown as an engineer.
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="flex flex-col">
          {experiences.map((exp, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="group relative border-t border-ink-black/10 py-10 md:py-14"
            >
              <div className="grid gap-6 md:grid-cols-12 md:gap-8">
                {/* Left column */}
                <div className="md:col-span-4">
                  <p className="text-sm font-bold uppercase tracking-[0.04em] text-slate-gray">
                    {exp.period}
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] text-ink-black md:text-2xl">
                    {exp.role}
                  </h3>
                  <p className="mt-1 text-base text-granite">{exp.company}</p>
                  <p className="mt-1 text-sm text-slate-gray">{exp.location}</p>
                </div>

                {/* Right column */}
                <div className="md:col-span-7 md:col-start-6">
                  <ul className="space-y-2">
                    {exp.description.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-base leading-relaxed text-granite"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-light-orange" />
                        <span>{renderDescriptionPoint(point)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {exp.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-[999px] border border-ink-black/10 bg-canvas-cream px-3 py-1 text-sm font-medium text-ink-black"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover accent line */}
              <motion.div
                className="absolute bottom-0 left-0 h-[2px] bg-light-orange"
                initial={{ width: "0%" }}
                whileInView={{ width: "0%" }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>
          ))}

          {/* Final border */}
          <div className="border-t border-ink-black/10" />
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
