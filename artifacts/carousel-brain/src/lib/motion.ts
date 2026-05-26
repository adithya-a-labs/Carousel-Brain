import type { Transition, Variants } from "framer-motion";

/** Premium ease — shared across the product (Linear / Apple-adjacent). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const spring = {
  snappy: { type: "spring", stiffness: 440, damping: 34, mass: 0.85 } as const,
  soft: { type: "spring", stiffness: 360, damping: 30, mass: 0.9 } as const,
  gentle: { type: "spring", stiffness: 280, damping: 28, mass: 0.95 } as const,
  layout: { type: "spring", stiffness: 380, damping: 32 } as const,
};

export const duration = {
  instant: 0.15,
  fast: 0.28,
  normal: 0.45,
  slow: 0.62,
  page: 0.52,
  ambient: 18,
} as const;

export const transition = {
  enter: { duration: duration.normal, ease: EASE_OUT } satisfies Transition,
  exit: { duration: duration.fast, ease: EASE_OUT } satisfies Transition,
  page: { duration: duration.page, ease: EASE_OUT } satisfies Transition,
  crossfade: { duration: duration.normal, ease: EASE_OUT } satisfies Transition,
};

export const hover = {
  lift: { y: -2, scale: 1.015, transition: spring.soft },
  card: { y: -4, scale: 1.02, transition: spring.soft },
  subtle: { scale: 1.02, transition: spring.snappy },
  glow: { scale: 1.03, y: -1, transition: spring.soft },
};

export const tap = {
  press: { scale: 0.98, transition: spring.snappy },
  deep: { scale: 0.97, transition: spring.snappy },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition.page,
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: transition.exit,
  },
};

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: EASE_OUT },
  },
};

export const staggerContainer = (
  stagger = 0.07,
  delayChildren = 0.05,
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: EASE_OUT },
  },
};

export const statePanel: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 14 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transition.enter,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
    transition: transition.exit,
  },
};

export const listItemReveal = (index: number): Transition => ({
  delay: index * 0.06,
  duration: duration.normal,
  ease: EASE_OUT,
});

/** Scroll-triggered sections — natural flow without harsh pop-in. */
export const scrollViewport = {
  once: true,
  margin: "-12% 0px -28% 0px",
  amount: 0.2,
} as const;

/** Deeper scroll reveal for long-form reading sections. */
export const scrollViewportDeep = {
  once: true,
  margin: "-8% 0px -22% 0px",
  amount: 0.12,
} as const;
