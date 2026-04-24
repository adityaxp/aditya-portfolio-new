"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  scaleIn,
} from "@/lib/animations";
import EyebrowLabel from "@/components/ui/EyebrowLabel";
import { siteConfig } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-canvas-cream pt-32 pb-24 md:pt-44 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 grid gap-16 md:grid-cols-12 md:gap-12"
        >
          {/* Left — circular portrait */}
          <motion.div
            variants={scaleIn}
            className="flex items-start justify-center md:col-span-5"
          >
            <div className="relative">
              <div className="relative h-72 w-72 overflow-hidden rounded-full ring-1 ring-ink-black/10 md:h-80 md:w-80">
                <Image
                  src="/aditya-balsane.png"
                  alt="Aditya Balsane portrait"
                  fill
                  sizes="(max-width: 768px) 288px, 320px"
                  className="scale-[1] object-cover object-[center_100%]"
                  priority
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute -top-4 right-6 flex h-20 w-20 items-center justify-center rounded-full bg-ink-black text-sm font-bold text-canvas-cream"
              >
                2+ YRS
              </motion.div>
            </div>
          </motion.div>

          {/* Right — content */}
          <div className="text-center md:col-span-7 md:text-left">
            <motion.div variants={fadeUp}>
              <div className="flex justify-center md:justify-start">
                <EyebrowLabel text="SOFTWARE ENGINEER" />
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mx-auto mt-4 max-w-2xl text-[clamp(2rem,5.5vw,3rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink-black md:mx-0"
            >
              I bridge intent and execution to build well-crafted products.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-granite md:mx-0"
            >
              I focus on building clean, maintainable systems with attention to
              usability and detail. I enjoy solving complex problems and
              simplifying them into user-friendly solutions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-2.5 md:justify-start md:gap-4"
            >
              <motion.a
                href="/cv.pdf"
                download
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-[999px] bg-ink-black px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-canvas-cream md:min-h-12 md:px-7 md:text-sm"
              >
                DOWNLOAD CV
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3V14M12 14L7.5 9.5M12 14L16.5 9.5M4 17.5V20H20V17.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.a>

              <div className="flex items-center gap-2 md:gap-2.5">
                <motion.a
                  href={siteConfig.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink-black text-ink-black md:h-11 md:w-11"
                  aria-label="GitHub"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M12 2C6.48 2 2 6.59 2 12.25C2 16.78 4.87 20.63 8.84 21.99C9.34 22.09 9.52 21.77 9.52 21.49V19.83C6.73 20.45 6.14 18.61 6.14 18.61C5.68 17.41 5.03 17.09 5.03 17.09C4.12 16.45 5.1 16.46 5.1 16.46C6.11 16.53 6.64 17.52 6.64 17.52C7.54 19.1 9 18.64 9.57 18.37C9.66 17.7 9.92 17.24 10.2 16.99C7.97 16.73 5.62 15.84 5.62 11.87C5.62 10.74 6.01 9.82 6.66 9.1C6.56 8.84 6.21 7.78 6.76 6.35C6.76 6.35 7.6 6.08 9.51 7.42C10.31 7.19 11.17 7.08 12.02 7.08C12.87 7.08 13.73 7.19 14.53 7.42C16.44 6.08 17.28 6.35 17.28 6.35C17.83 7.78 17.48 8.84 17.38 9.1C18.03 9.82 18.42 10.74 18.42 11.87C18.42 15.85 16.06 16.72 13.82 16.98C14.18 17.3 14.5 17.94 14.5 18.91V21.49C14.5 21.78 14.68 22.1 15.19 21.99C19.15 20.63 22 16.78 22 12.25C22 6.59 17.52 2 12 2Z" />
                  </svg>
                </motion.a>

                <motion.a
                  href={siteConfig.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink-black text-ink-black md:h-11 md:w-11"
                  aria-label="LinkedIn"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M6.94 8.5C8.11 8.5 9.03 7.57 9.03 6.41C9.03 5.25 8.11 4.31 6.94 4.31C5.78 4.31 4.84 5.25 4.84 6.41C4.84 7.57 5.78 8.5 6.94 8.5ZM5.14 9.95H8.75V19.69H5.14V9.95ZM10.93 9.95H14.39V11.28H14.44C14.92 10.37 16.08 9.41 17.83 9.41C21.47 9.41 22.14 11.81 22.14 14.93V19.69H18.53V15.47C18.53 14.46 18.51 13.15 17.11 13.15C15.69 13.15 15.47 14.26 15.47 15.4V19.69H11.86V9.95H10.93Z" />
                  </svg>
                </motion.a>

                <motion.a
                  href={`mailto:${siteConfig.email}`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink-black text-ink-black md:h-11 md:w-11"
                  aria-label="Email"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7.5L12 13.5L21 7.5M5.4 19H18.6C19.99 19 21 17.97 21 16.56V7.44C21 6.03 19.99 5 18.6 5H5.4C4.01 5 3 6.03 3 7.44V16.56C3 17.97 4.01 19 5.4 19Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
