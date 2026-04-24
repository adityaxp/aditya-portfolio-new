"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "default" | "large";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-black text-canvas-cream border-[1.5px] border-ink-black hover:bg-charcoal",
  secondary:
    "bg-white text-ink-black border-[1.5px] border-ink-black hover:bg-soft-bone",
  outline:
    "bg-transparent text-ink-black border-[1.5px] border-ink-black/30 hover:border-ink-black",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-6 py-2.5 text-base",
  large: "px-10 py-4 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", href, children, className = "", ...props }, ref) => {
    const classes = `
      inline-flex items-center justify-center gap-2
      rounded-[20px] font-medium tracking-[-0.02em]
      transition-all duration-300 ease-out
      active:scale-[0.97]
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim();

    if (href) {
      return (
        <motion.a
          href={href}
          className={classes}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          {...(props as HTMLMotionProps<"a">)}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
