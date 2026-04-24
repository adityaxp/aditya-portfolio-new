"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import SectionWrapper from "@/components/ui/SectionWrapper";
import EyebrowLabel from "@/components/ui/EyebrowLabel";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/lib/constants";

export default function GetInTouch() {
  return (
    <SectionWrapper id="contact" background="lifted">
      <motion.div
        variants={staggerContainer}
        className="flex flex-col items-center text-center"
      >
        <motion.div variants={fadeUp}>
          <EyebrowLabel text="GET IN TOUCH" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="mt-6 max-w-3xl text-[clamp(2rem,6vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink-black"
        >
          Let&apos;s build something enduring together.
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-lg leading-relaxed text-granite"
        >
          Whether you have a project in mind, a role to discuss, or just want to
          say hello — I&apos;d love to hear from you.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            variant="primary"
            size="large"
            href={`mailto:${siteConfig.email}`}
          >
            Start a Conversation
          </Button>
          <Button variant="secondary" href={siteConfig.socials.linkedin}>
            LinkedIn
          </Button>
        </motion.div>

        {/* Decorative orbital circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 0.08, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.3 }}
            className="absolute -top-20 -left-20 h-64 w-64 rounded-full border border-light-orange"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 0.06, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.6 }}
            className="absolute -right-16 -bottom-16 h-80 w-80 rounded-full border border-ink-black/20"
          />
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
