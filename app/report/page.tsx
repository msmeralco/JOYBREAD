'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, MapPin, AlertTriangle, Zap, Check, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ReportState = 'capture' | 'categorize' | 'submitting' | 'success'

const hazardCategories = [
  {
    id: 'leaning-pole',
    name: 'Leaning Pole',
    icon: '⚡',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'spaghetti-wires',
    name: 'Spaghetti Wires',
    icon: '🍝',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'sparking-transformer',
    name: 'Sparking Transformer',
    icon: '⚡',
    color: 'from-yellow-500 to-red-600',
  },
  {
    id: 'vegetation',
    name: 'Vegetation Hazard',
    icon: '🌿',
    color: 'from-green-500 to-emerald-500',
  },
]

export default function ReportPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const addHazardReport = useAppStore((state) => state.addHazardReport)
  const addActivityLog = useAppStore((state) => state.addActivityLog)
  
  const [reportState, setReportState] = useState<ReportState>('capture')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [location, setLocation] = useState({ lat: 14.5547, lng: 121.0244 }) // Pasig City

  useEffect(() => {
    if (!user) {
      router.push('/')
    }

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [user, router])

  if (!user) return null

  const handleCapture = () => {
    setReportState('categorize')
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleSubmit = () => {
    if (!selectedCategory) return

    setReportState('submitting')

    setTimeout(() => {
      const pointsAwarded = 50
      
      addHazardReport({
        id: Date.now().toString(),
        userId: user.id,
        photoURL: '/placeholder-hazard.jpg',
        category: selectedCategory as any,
        location,
        address: `${user.barangay}, ${user.city}`,
        status: 'pending',
        createdAt: new Date(),
        pointsAwarded,
      })

      addActivityLog({
        id: Date.now().toString(),
        type: 'hazard-report',
        description: 'Reported electrical hazard',
        points: pointsAwarded,
        timestamp: new Date(),
      })

      setReportState('success')
    }, 2000)
  }

  const handleClose = () => {
    router.push('/dashboard')
  }

  const handleNewReport = () => {
    setReportState('capture')
    setSelectedCategory(null)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      <AnimatePresence mode="wait">
        {reportState === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--color-warning)] to-orange-600 pt-12 pb-8 px-6 relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Report Hazard</h1>
                    <p className="text-white/80 text-sm">Power up your community</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6">
              {/* Camera Preview Area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden mb-6 relative min-h-[400px]"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-24 h-24 text-white/40" />
                </div>
                
                {/* Camera overlay UI */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="text-center">
                    <p className="text-white text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                      Position hazard in frame
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Location Info */}
              <Card className="mb-6 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      Location Auto-Tagged
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {user.barangay}, {user.city}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Capture Button */}
              <Button
                onClick={handleCapture}
                size="lg"
                className="w-full h-16 text-lg"
              >
                <Camera className="w-6 h-6 mr-2" />
                Capture Hazard
              </Button>
            </div>
          </motion.div>
        )}

        {reportState === 'categorize' && (
          <motion.div
            key="categorize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col bg-[var(--color-background)]"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--color-warning)] to-orange-600 pt-12 pb-8 px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-bold text-white mb-2">
                  Select Hazard Type
                </h1>
                <p className="text-white/80 text-sm">
                  Choose the category that best describes the hazard
                </p>
              </motion.div>
            </div>

            {/* Categories */}
            <div className="flex-1 p-6 space-y-3">
              {hazardCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-card)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl`}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-white">
                        {category.name}
                      </h3>
                    </div>
                    {selectedCategory === category.id && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            <div className="p-6 border-t border-[var(--color-border)]">
              <Button
                onClick={handleSubmit}
                disabled={!selectedCategory}
                size="lg"
                className="w-full"
              >
                Submit Report
              </Button>
            </div>
          </motion.div>
        )}

        {reportState === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-warning)] to-orange-600 flex items-center justify-center shadow-2xl mb-8"
            >
              <AlertTriangle className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Submitting Report
            </h2>
            <p className="text-[var(--color-muted)] text-center">
              Sending to authorities...
            </p>
          </motion.div>
        )}

        {reportState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-green-600 flex items-center justify-center shadow-2xl mb-8"
            >
              <Check className="w-16 h-16 text-white" strokeWidth={3} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white mb-3 text-center"
            >
              Report Submitted!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--color-muted)] text-center mb-8"
            >
              Thank you for making your community safer
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[var(--color-card)] rounded-2xl p-6 border border-[var(--color-border)] mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-[var(--color-warning)]" fill="var(--color-warning)" />
                <span className="text-3xl font-bold text-white">+50</span>
              </div>
              <p className="text-[var(--color-muted)] text-sm text-center">
                Kilos Points Earned
              </p>
            </motion.div>

            <div className="space-y-3 w-full max-w-sm">
              <Button
                onClick={handleNewReport}
                size="lg"
                className="w-full"
              >
                Report Another Hazard
              </Button>
              <Button
                onClick={handleClose}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
