"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import SectionWrapper from "@/components/ui/SectionWrapper";
import GhostText from "@/components/ui/GhostText";
import ProjectModal, {
  type ProjectModalData,
} from "@/components/ui/ProjectModal";
import { projects } from "@/lib/constants";
import EyebrowLabel from "@/components/ui/EyebrowLabel";

function projectHasLink(link: string) {
  const trimmed = link.trim();
  return trimmed.length > 0 && trimmed !== "#";
}

const projectCardMediaStillClass = "h-full w-full object-cover object-center";
const projectCardMediaHoverClass = "h-full w-full object-contain object-center";

const projectCardInteractiveClass =
  "group/card focus-visible:ring-light-orange flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-ink-black/[0.08] bg-lifted-cream text-left shadow-[0_1px_0_rgba(20,20,19,0.05)] outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink-black/15 hover:shadow-[0_16px_40px_-20px_rgba(20,20,19,0.14)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream";

const projectCardDisabledClass =
  "group/card flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-ink-black/[0.06] bg-lifted-cream/90 text-left shadow-none transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink-black/12 hover:shadow-[0_12px_32px_-20px_rgba(20,20,19,0.12)]";

export default function Projects() {
  const [selectedProject, setSelectedProject] =
    useState<ProjectModalData | null>(null);

  const openProject = useCallback((project: (typeof projects)[number]) => {
    setSelectedProject({
      title: project.title,
      category: project.category,
      image: project.image,
      imageHover: "imageHover" in project ? project.imageHover : undefined,
      link: project.link,
    });
  }, []);

  const closeProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <SectionWrapper id="projects" background="cream">
      <GhostText
        text="Projects"
        className="absolute top-5 right-6 md:right-12 lg:right-16"
      />

      <div className="relative z-10">
        <motion.header variants={fadeUp} className="mb-14 md:mb-20">
          <motion.div variants={fadeUp}>
            <div className="flex justify-start">
              <EyebrowLabel text="PERSONAL PROJECTS" />
            </div>
          </motion.div>

          <h2 className="mt-4 max-w-2xl text-[clamp(2rem,5vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink-black">
            A few things I’ve been tinkering with recently
          </h2>
        </motion.header>

        <motion.ul
          variants={staggerContainer}
          className="m-0 mx-auto grid max-w-4xl list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 sm:gap-6 lg:max-w-5xl lg:gap-7"
        >
          {projects.map((project, i) => {
            const hasHover =
              "imageHover" in project && Boolean(project.imageHover);
            const isLinked = projectHasLink(project.link);
            const cardClass = isLinked
              ? projectCardInteractiveClass
              : projectCardDisabledClass;

            const cardBody = (
              <>
                <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-[#0a0a0a]">
                  <span
                    className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[10px] font-medium tabular-nums tracking-widest text-white/45"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Image
                    src={project.image}
                    alt={`${project.title} preview`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 360px"
                    className={`${projectCardMediaStillClass} transition-opacity duration-500 ease-out ${
                      hasHover ? "opacity-100 group-hover/card:opacity-0" : ""
                    }`}
                  />
                  {hasHover ? (
                    <Image
                      src={project.imageHover}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 360px"
                      className={`${projectCardMediaHoverClass} opacity-0 transition-opacity duration-500 ease-out group-hover/card:opacity-100`}
                      unoptimized
                    />
                  ) : null}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80"
                    aria-hidden
                  />
                </div>

                <div className="flex flex-1 flex-col p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-light-orange" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-gray">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-medium tracking-[-0.02em] text-ink-black md:text-xl">
                    {project.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-granite md:text-[0.9375rem]">
                    {project.description}
                  </p>
                  <span
                    className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold text-light-orange`}
                  >
                    {isLinked ? "View preview" : "Coming soon"}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
                      aria-hidden
                    >
                      <path
                        d="M5 15L15 5M15 5H8M15 5V12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </>
            );

            return (
              <motion.li
                key={project.title}
                variants={staggerItem}
                className="min-w-0"
              >
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  className={cardClass}
                  aria-label={`Open preview for ${project.title}`}
                >
                  {cardBody}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      <ProjectModal project={selectedProject} onClose={closeProject} />
    </SectionWrapper>
  );
}
