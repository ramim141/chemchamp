import React from "react";
import { motion } from "motion/react";

/**
 * ScrollReveal - Smooth Scroll-Triggered Entrance Animation
 * Reveals elements with silky smooth opacity and vertical motion as you scroll down.
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.4,
  y = 20,
  className = "",
  once = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth snappy cubic-bezier curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer - Groups children to animate sequentially as they enter the viewport
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  className = "",
  once = true,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem - Child element inside StaggerContainer
 */
export function StaggerItem({ children, y = 16, className = "" }) {
  const itemVariants = {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}


