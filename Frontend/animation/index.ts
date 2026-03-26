import { Variants } from 'motion/react'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

export const floatBadge: Variants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
    },
  },
}

export const ambientBlob1: Variants = {
  animate: {
    x: ['0vw', '-60vw', '-20vw', '0vw'], // بتتحرك بعرض الشاشة
    y: ['0vh', '50vh', '-20vh', '0vh'], // بتنزل وتطلع بطول الشاشة
    scale: [1, 1.5, 0.8, 1], // بتكبر وتصغر عشان تدي إحساس العمق
    transition: {
      duration: 25, // بطيئة جداً عشان متعملش تشتيت
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
}

export const ambientBlob2: Variants = {
  animate: {
    x: ['0vw', '50vw', '10vw', '0vw'],
    y: ['0vh', '-40vh', '30vh', '0vh'],
    scale: [0.8, 1.2, 1.5, 0.8],
    transition: {
      duration: 30,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
}
