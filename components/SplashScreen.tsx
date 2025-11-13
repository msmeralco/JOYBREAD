'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117]"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              rotate: [0, 360, 360],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.6, 1],
              ease: "easeInOut",
            }}
            className="relative mb-8"
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-[var(--color-primary)] blur-3xl"
            />
            
            {/* Logo */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-2xl">
              <Zap className="w-16 h-16 text-white" fill="white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-2 italic tracking-wide">
              KILOS
            </h1>
            <p className="text-[var(--color-muted)] text-sm">
              Power Up Your Energy Game
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              delay: 1,
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="absolute bottom-12 text-[var(--color-muted)] text-xs"
          >
            Loading...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
