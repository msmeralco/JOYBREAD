'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Zap, TrendingDown, Lightbulb, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

type ScanState = 'idle' | 'scanning' | 'processing' | 'results'

const mockBreakdown = [
  { appliance: 'Air Conditioner', percentage: 40, kwh: 140, color: '#6A45FF' },
  { appliance: 'Refrigerator', percentage: 25, kwh: 87.5, color: '#10B981' },
  { appliance: 'Water Heater', percentage: 15, kwh: 52.5, color: '#F59E0B' },
  { appliance: 'Lighting', percentage: 10, kwh: 35, color: '#3B82F6' },
  { appliance: 'Others', percentage: 10, kwh: 35, color: '#8B949E' },
]

const mockTips = [
  'Set your AC to 25°C instead of 22°C to save up to 15% on cooling costs',
  'Clean your refrigerator coils monthly to improve efficiency by 30%',
  'Use timer for water heater - heat only when needed',
  'Replace traditional bulbs with LED lights to reduce lighting costs by 75%',
  'Unplug appliances when not in use to eliminate phantom loads',
]

export default function ScanPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const addKilosPoints = useAppStore((state) => state.addKilosPoints)
  const addActivityLog = useAppStore((state) => state.addActivityLog)
  const [scanState, setScanState] = useState<ScanState>('idle')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const startScan = () => {
    setScanState('scanning')
    
    // Simulate camera scan
    setTimeout(() => {
      setScanState('processing')
      
      // Simulate processing
      setTimeout(() => {
        setScanState('results')
        
        // Award points
        addKilosPoints(100)
        addActivityLog({
          id: Date.now().toString(),
          type: 'bill-scan',
          description: 'Scanned electricity bill',
          points: 100,
          timestamp: new Date(),
        })
      }, 2500)
    }, 2000)
  }

  const resetScan = () => {
    setScanState('idle')
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      <AnimatePresence mode="wait">
        {scanState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-8 px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-bold text-white mb-2">Bill Decoder</h1>
                <p className="text-white/80 text-sm">
                  Scan your Meralco bill to decode your consumption
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center mb-8 shadow-2xl"
              >
                <Camera className="w-24 h-24 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-3 text-center">
                Ready to Decode
              </h2>
              <p className="text-[var(--color-muted)] text-center mb-8 max-w-sm">
                Position your Meralco bill's QR code or consumption details within the camera frame
              </p>

              <Button size="lg" onClick={startScan} className="min-w-[200px]">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          </motion.div>
        )}

        {scanState === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-black relative"
          >
            {/* Camera View Simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
            
            {/* Scan Frame */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 2px rgba(106, 69, 255, 0.3)',
                    '0 0 0 2px rgba(106, 69, 255, 1)',
                    '0 0 0 2px rgba(106, 69, 255, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full max-w-sm aspect-square border-4 border-[var(--color-primary)] rounded-3xl relative"
              >
                {/* Corner markers */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`absolute w-8 h-8 border-[var(--color-primary)] ${
                      i === 0 ? 'top-0 left-0 border-t-4 border-l-4' :
                      i === 1 ? 'top-0 right-0 border-t-4 border-r-4' :
                      i === 2 ? 'bottom-0 left-0 border-b-4 border-l-4' :
                      'bottom-0 right-0 border-b-4 border-r-4'
                    }`}
                  />
                ))}

                {/* Scanning line */}
                <motion.div
                  animate={{ y: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-x-0 h-1 bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]"
                />
              </motion.div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 text-center">
              <p className="text-white text-lg mb-2">Scanning bill...</p>
              <p className="text-white/60 text-sm">Hold steady</p>
            </div>
          </motion.div>
        )}

        {scanState === 'processing' && (
          <motion.div
            key="processing"
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
                ease: "easeInOut",
              }}
              className="relative mb-8"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-2xl">
                <Zap className="w-16 h-16 text-white" fill="white" />
              </div>
              
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full bg-[var(--color-primary)] blur-2xl"
              />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Analyzing Your Bill
            </h2>
            <p className="text-[var(--color-muted)] text-center">
              Decoding consumption patterns...
            </p>
          </motion.div>
        )}

        {scanState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[var(--color-background)] pb-24"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-8 px-6 relative">
              <button
                onClick={resetScan}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" fill="white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Bill Decoded!</h1>
                <p className="text-white/80 text-sm">
                  +100 Kilos Points earned
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="px-6 -mt-4 space-y-4">
              {/* Breakdown Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Consumption Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={mockBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="percentage"
                          label={({ percentage }) => `${percentage}%`}
                        >
                          {mockBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 space-y-2">
                      {mockBreakdown.map((item, index) => (
                        <motion.div
                          key={item.appliance}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-background)]"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-white">{item.appliance}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              {item.kwh} kWh
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {item.percentage}%
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Energy Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-[var(--color-warning)]" />
                      Your Energy Workout Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockTips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex gap-3 p-3 rounded-lg bg-[var(--color-background)]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[var(--color-secondary)] text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-muted)]">{tip}</p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
                size="lg"
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
