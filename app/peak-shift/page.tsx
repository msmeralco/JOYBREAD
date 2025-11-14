'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Zap, TrendingDown, AlertTriangle, CheckCircle, Play, Square, Timer, Award } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  startPeakShiftSession,
  updateKwhReading,
  endPeakShiftSession,
  getActivePeakShiftSession,
  getUserPeakShiftHistory,
} from '@/lib/services/peak-shift'
import type { PeakShiftSession } from '@/lib/types/challenges'

export default function PeakShiftPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const user = useAppStore((state) => state.user)
  const addKilosPoints = useAppStore((state) => state.addKilosPoints)
  
  const [activeSession, setActiveSession] = useState<PeakShiftSession | null>(null)
  const [history, setHistory] = useState<PeakShiftSession[]>([])
  const [loading, setLoading] = useState(true)
  const [simulatedKwh, setSimulatedKwh] = useState(0)
  const [warningMessage, setWarningMessage] = useState<string>('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    } else {
      loadSessionData()
    }
  }, [user, router])

  const loadSessionData = async () => {
    if (!authUser) return
    try {
      setLoading(true)
      const session = await getActivePeakShiftSession(authUser.uid)
      setActiveSession(session)
      
      if (session) {
        setSimulatedKwh(session.lastKwhReading)
        startMonitoring()
      }
      
      const userHistory = await getUserPeakShiftHistory(authUser.uid, 5)
      setHistory(userHistory)
    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    intervalRef.current = setInterval(() => {
      // Simulate kWh fluctuations (in real app, this would come from IoT device)
      setSimulatedKwh((prev) => {
        const fluctuation = (Math.random() - 0.5) * 0.1 // Random fluctuation
        const newReading = Math.max(0, prev + fluctuation)
        checkKwhReading(newReading)
        return newReading
      })
    }, 5000) // Check every 5 seconds
  }

  const checkKwhReading = async (currentKwh: number) => {
    if (!authUser || !activeSession) return
    
    const result = await updateKwhReading(authUser.uid, currentKwh)
    
    if (result.success) {
      if (result.warning) {
        setWarningMessage(result.warning)
        // Auto-dismiss warning after 5 seconds
        setTimeout(() => setWarningMessage(''), 5000)
      }
      
      if (result.session) {
        setActiveSession(result.session)
      }
      
      // Session completed or stopped
      if (result.shouldStop !== undefined && !result.shouldStop) {
        handleEndSession(false)
      } else if (result.pointsEarned && activeSession.currentDuration >= activeSession.targetDuration) {
        handleEndSession(true)
      }
    }
  }

  const handleStartSession = async () => {
    if (!authUser) return
    
    // Use current simulated kWh as baseline (in real app, get from IoT device)
    const baselineKwh = simulatedKwh || 5.0
    
    const result = await startPeakShiftSession(authUser.uid, baselineKwh)
    
    if (result.success && result.session) {
      setActiveSession(result.session)
      setSimulatedKwh(baselineKwh)
      startMonitoring()
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  const handleEndSession = async (completed: boolean) => {
    if (!authUser) return
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    const result = await endPeakShiftSession(authUser.uid, completed)
    
    if (result.success && result.pointsEarned) {
      addKilosPoints(result.pointsEarned)
    }
    
    alert(result.message)
    setActiveSession(null)
    loadSessionData()
  }

  const handleStopSession = () => {
    if (confirm('Are you sure you want to stop this session? You will not earn points.')) {
      handleEndSession(false)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!user) return null

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  const progressPercentage = activeSession
    ? (activeSession.currentDuration / activeSession.targetDuration) * 100
    : 0

  const kwhIncrease = activeSession
    ? simulatedKwh - activeSession.baselineKwh
    : 0

  const isUsageGood = kwhIncrease <= (activeSession?.kwhThreshold || 0.5)

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Peak Shift Challenge</h1>
          <p className="text-white/80 text-sm">
            Keep your usage low for 1 hour to earn points
          </p>
        </motion.div>
      </div>

      <div className="px-6 -mt-6 space-y-4">
        {/* Active Session Card */}
        {activeSession ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
              {/* Progress Circle */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercentage / 100)}`}
                      className={isUsageGood ? 'text-green-500' : 'text-red-500'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Timer className="w-8 h-8 text-white mb-1" />
                    <span className="text-2xl font-bold text-white">
                      {formatDuration(activeSession.currentDuration)}
                    </span>
                    <span className="text-xs text-gray-400">
                      / {formatDuration(activeSession.targetDuration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[var(--color-card)] rounded-xl p-3 text-center">
                  <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">
                    {activeSession.pointsEarned}
                  </p>
                  <p className="text-xs text-gray-400">Points Earned</p>
                </div>
                <div className="bg-[var(--color-card)] rounded-xl p-3 text-center">
                  <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${isUsageGood ? 'text-green-500' : 'text-red-500'}`} />
                  <p className={`text-2xl font-bold ${isUsageGood ? 'text-green-500' : 'text-red-500'}`}>
                    {kwhIncrease.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">kWh Above Baseline</p>
                </div>
              </div>

              {/* Warnings */}
              <AnimatePresence>
                {warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/20 border border-red-500 rounded-xl p-3 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-red-200">{warningMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Violations */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-400">Violations</span>
                <span className={`font-semibold ${activeSession.violations >= 2 ? 'text-red-500' : 'text-white'}`}>
                  {activeSession.violations} / 3
                </span>
              </div>

              {/* Stop Button */}
              <Button
                onClick={handleStopSession}
                className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </Button>
            </Card>
          </motion.div>
        ) : (
          /* Start Session Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Moon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Start Peak Shift</h2>
                <p className="text-sm text-gray-400">
                  Keep your electricity usage low for 1 hour to earn up to 300 points!
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">Earn 5 points per minute</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">Max 0.5 kWh usage increase allowed</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-300">3 violations = session fails</span>
                </div>
              </div>

              <Button
                onClick={handleStartSession}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white border-0"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </Card>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-500" />
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-xl"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {session.endTime ? formatDuration(session.currentDuration) : 'In Progress'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.startTime.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${session.pointsEarned > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {session.pointsEarned > 0 ? '+' : ''}{session.pointsEarned} pts
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.violations} violations
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
