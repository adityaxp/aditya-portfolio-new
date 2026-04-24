"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { siteConfig } from "@/lib/constants";

const footerColumns = [
  {
    title: "NAVIGATION",
    links: [
      { label: "Work", href: "#work" },
      { label: "Experience", href: "#experience" },
      { label: "Projects", href: "#projects" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "SOCIAL",
    links: [
      { label: "GitHub", href: siteConfig.socials.github, external: true },
      {
        label: "LinkedIn",
        href: siteConfig.socials.linkedin,
        external: true,
      },
      { label: "Twitter", href: siteConfig.socials.twitter, external: true },
    ],
  },
  {
    title: "CONTACT",
    links: [
      { label: siteConfig.email, href: `mailto:${siteConfig.email}` },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-black text-white">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:px-12 md:pt-28 md:pb-16 lg:px-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {/* Large conversational headline */}
          <motion.h2
            variants={fadeUp}
            className="max-w-lg text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.02em]"
          >
            Always open to new conversations and collaborations.
          </motion.h2>

          {/* Column grid */}
          <motion.div
            variants={staggerContainer}
            className="mt-16 grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:mt-20"
          >
            {footerColumns.map((col) => (
              <motion.div key={col.title} variants={staggerItem}>
                <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-white/40">
                  {col.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={
                          "external" in link && link.external
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          "external" in link && link.external
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                        {"external" in link && link.external && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M3 9L9 3M9 3H5M9 3V7"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={fadeUp}
            className="mt-16 border-t border-white/10 pt-8 lg:mt-20"
          >
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-white/40">
                &copy; {year} {siteConfig.name}. All rights reserved.
              </p>
              <a
                href="#"
                className="text-lg font-semibold tracking-[-0.02em] text-white transition-opacity hover:opacity-70"
              >
                {siteConfig.name}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
