"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useId, useRef } from "react";
import Button from "@/components/ui/Button";

export type ProjectModalData = {
  title: string;
  category: string;
  image: string;
  imageHover?: string;
  link: string;
};

type ProjectModalProps = {
  project: ProjectModalData | null;
  onClose: () => void;
};

function projectHasLink(link: string) {
  const trimmed = link.trim();
  return trimmed.length > 0 && trimmed !== "#";
}

function linkIsExternal(href: string) {
  return href.startsWith("http");
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imageSrc = project?.imageHover ?? project?.image;

  useEffect(() => {
    if (!project) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [project, onClose]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  const isLinked = project ? projectHasLink(project.link) : false;
  const external = isLinked && project ? linkIsExternal(project.link) : false;

  return (
    <AnimatePresence>
      {project && imageSrc ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={handleBackdropClick}
          aria-hidden={false}
        >
          <motion.div
            className="absolute inset-0 bg-ink-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-ink-black/10 bg-lifted-cream shadow-[0_24px_80px_-24px_rgba(20,20,19,0.45)] sm:rounded-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink-black/[0.06] px-4 py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-gray">
                  {project.category}
                </p>
                <h3
                  id={titleId}
                  className="mt-1 truncate text-xl font-medium tracking-[-0.02em] text-ink-black md:text-2xl"
                >
                  {project.title}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isLinked ? (
                  <Button
                    href={project.link}
                    variant="primary"
                    size="default"
                    className="hidden sm:inline-flex"
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    View project
                  </Button>
                ) : null}
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="focus-visible:ring-light-orange inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-black/10 bg-canvas-cream text-ink-black transition-colors hover:border-ink-black/20 hover:bg-soft-bone focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-lifted-cream focus-visible:outline-none"
                  aria-label={`Close ${project.title} preview`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 5L15 15M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative min-h-[220px] bg-[#0a0a0a] sm:min-h-[320px] md:min-h-[480px]">
              <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
                <Image
                  src={imageSrc}
                  alt={`${project.title} preview`}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-contain object-center"
                  unoptimized
                  priority
                />
              </div>
            </div>

            {isLinked ? (
              <div className="border-t border-ink-black/[0.06] px-4 py-4 sm:hidden">
                <Button
                  href={project.link}
                  variant="primary"
                  size="default"
                  className="w-full"
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  View project
                </Button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
