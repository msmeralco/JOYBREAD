'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-2xl shadow-[var(--color-primary)]/50">
          <Zap className="w-10 h-10 text-white" fill="white" />
        </div>
      </motion.div>
    </div>
  )
}
