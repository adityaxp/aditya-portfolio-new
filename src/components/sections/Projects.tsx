"use client";

import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  scaleIn,
} from "@/lib/animations";
import SectionWrapper from "@/components/ui/SectionWrapper";
import EyebrowLabel from "@/components/ui/EyebrowLabel";
import GhostText from "@/components/ui/GhostText";
import SatelliteCTA from "@/components/ui/SatelliteCTA";
import OrbitalArc from "@/components/ui/OrbitalArc";
import { projects } from "@/lib/constants";

const gradients = [
  "linear-gradient(135deg, #CF4500 0%, #F37338 60%, #FFB088 100%)",
  "linear-gradient(135deg, #141413 0%, #3860BE 60%, #6B8DD6 100%)",
  "linear-gradient(135deg, #9A3A0A 0%, #CF4500 50%, #F37338 100%)",
  "linear-gradient(135deg, #262627 0%, #555555 60%, #696969 100%)",
];

export default function Projects() {
  return (
    <SectionWrapper id="projects" background="cream">
      <GhostText
        text="Projects"
        className="absolute top-5 right-6 md:right-12 lg:right-16"
      />

      <div className="relative z-10">
        <motion.div variants={fadeUp} className="mb-20 max-w-2xl">
          <h2 className="mt-4 text-[clamp(2rem,5vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink-black">
            Projects built with care, shipped with confidence.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid gap-16 md:gap-24"
        >
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              variants={staggerItem}
              className={`group grid items-center gap-10 md:grid-cols-12 md:gap-16 ${
                i % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              {/* Circular portrait */}
              <div
                className={`relative md:col-span-5 ${
                  i % 2 === 1 ? "md:col-start-8" : "md:col-start-1"
                }`}
              >
                <motion.div
                  variants={scaleIn}
                  className="relative mx-auto aspect-square w-full max-w-xs"
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: gradients[i % gradients.length] }}
                  />
                  <div className="absolute bottom-2 right-2">
                    <SatelliteCTA href={project.link} />
                  </div>
                </motion.div>
                {/* Orbital arc between items */}

                <div className="hidden md:block">
                  <OrbitalArc
                    width={300}
                    height={120}
                    direction={i % 2 === 0 ? "right" : "left"}
                    className={`absolute -bottom-16 ${
                      i % 2 === 0 ? "-right-40" : "-left-32"
                    }`}
                  />
                </div>
              </div>

              {/* Content */}
              <div
                className={`md:col-span-6 ${
                  i % 2 === 1
                    ? "md:col-start-1 md:row-start-1"
                    : "md:col-start-7"
                }`}
                style={{ direction: "ltr" }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-light-orange" />
                  <span className="text-sm font-bold uppercase tracking-[0.04em] text-slate-gray">
                    {project.category}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-ink-black md:text-3xl">
                  {project.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-granite">
                  {project.description}
                </p>
                <motion.a
                  href={project.link}
                  className="mt-6 inline-flex items-center gap-2 text-base font-medium text-ink-black transition-colors hover:text-light-orange"
                  whileHover={{ x: 4 }}
                >
                  View Project
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 15L15 5M15 5H8M15 5V12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
