'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, FileText, Shield, Trophy, Zap } from 'lucide-react'
import { Button } from './ui/button'

const slides = [
  {
    icon: FileText,
    title: 'Understand Your Bill',
    description: 'Scan and decode your electricity bill to see exactly where your energy goes',
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Report Hazards',
    description: 'Power up your community by reporting electrical hazards in your area',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    description: 'Complete challenges, save energy, and redeem amazing rewards',
    gradient: 'from-pink-600 to-orange-500',
  },
]

export function OnboardingCarousel({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1)
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
          <Zap className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>

      {/* Skip Button */}
      <div className="flex justify-end px-6 py-2">
        <button
          onClick={skipOnboarding}
          className="text-[var(--color-muted)] text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Carousel Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full max-w-md flex flex-col items-center text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center mb-8 shadow-2xl`}
            >
              {(() => {
                const Icon = slides[currentSlide].icon
                return <Icon className="w-16 h-16 text-white" />
              })()}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-4"
            >
              {slides[currentSlide].title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[var(--color-muted)] text-lg leading-relaxed px-4"
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{
              width: index === currentSlide ? 32 : 8,
              backgroundColor: index === currentSlide 
                ? 'var(--color-primary)' 
                : 'var(--color-border)',
            }}
            className="h-2 rounded-full transition-all"
          />
        ))}
      </div>

      {/* Next Button */}
      <div className="px-6 pb-12">
        <Button
          onClick={nextSlide}
          className="w-full group"
          size="lg"
        >
          {currentSlide === slides.length - 1 ? (
            "Get Started"
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
