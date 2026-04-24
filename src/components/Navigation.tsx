"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { navLinks, siteConfig } from "@/lib/constants";
import { navReveal } from "@/lib/animations";
import Button from "./ui/Button";

const navWithScroll: Variants = {
  ...navReveal,
  // No entrance delay: otherwise scroll-up re-show would also wait 300ms.
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
  scrollHidden: {
    opacity: 0,
    y: "-130%",
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

const SCROLL_TOP_NEVER_HIDE = 100;
const SCROLL_DIR_THRESHOLD = 6;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [navConcealed, setNavConcealed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);

      if (y < SCROLL_TOP_NEVER_HIDE) {
        setNavConcealed(false);
        lastScrollY.current = y;
        return;
      }

      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (Math.abs(delta) < SCROLL_DIR_THRESHOLD) {
        return;
      }
      if (delta > 0) {
        setNavConcealed(true);
      } else {
        setNavConcealed(false);
      }
    };
    lastScrollY.current = window.scrollY;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navAnimState = mobileOpen || !navConcealed ? "visible" : "scrollHidden";

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        variants={navWithScroll}
        initial="hidden"
        animate={navAnimState}
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 transition-shadow duration-500 ${
          scrolled
            ? "shadow-[rgba(0,0,0,0.06)_0px_4px_24px_0px]"
            : "shadow-none"
        } ${navConcealed && !mobileOpen ? "pointer-events-none" : ""}`}
      >
        <div className="flex w-[min(92vw,22rem)] items-center justify-between rounded-[999px] bg-white/95 px-5 py-3 backdrop-blur-md md:w-auto md:justify-start md:gap-2 md:px-8 md:py-3.5">
          <a
            href="#"
            className="whitespace-nowrap text-xl font-bold tracking-[-0.02em] text-ink-black md:mr-8 md:text-lg"
          >
            {siteConfig.name}
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium tracking-[-0.02em] text-ink-black transition-colors duration-200 hover:text-slate-gray"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:ml-8 md:block">
            <Button
              variant="primary"
              href="#contact"
              className="!py-2 !px-5 !text-sm"
            >
              Let&apos;s Talk
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-black/10 md:ml-4 md:hidden"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={mobileOpen ? "open" : "closed"}
              className="flex flex-col gap-1"
            >
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 5 },
                }}
                className="block h-[1.5px] w-4 bg-ink-black"
              />
              <motion.span
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                className="block h-[1.5px] w-4 bg-ink-black"
              />
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -5 },
                }}
                className="block h-[1.5px] w-4 bg-ink-black"
              />
            </motion.div>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-canvas-cream/98 backdrop-blur-sm"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="text-3xl font-medium tracking-[-0.02em] text-ink-black"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.08, duration: 0.4 }}
              >
                <Button
                  variant="primary"
                  size="large"
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                >
                  Let&apos;s Talk
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
