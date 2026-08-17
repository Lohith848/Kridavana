'use client';

/**
 * components/ui/motion.tsx
 *
 * RSC-safe motion components.
 *
 * framer-motion's `motion.*` components are client-only — importing and
 * rendering them inside a Server Component throws ("createMotionComponent
 * is not a function"). These thin client wrappers let Server Components
 * render animated elements; the animation props (initial/animate/variants/
 * custom, etc.) are plain serializable data and pass through untouched.
 */

import { motion } from 'framer-motion';

export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionHeader = motion.header;
export const MotionP = motion.p;
export const MotionSpan = motion.span;
export const MotionButton = motion.button;
