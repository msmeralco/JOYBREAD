'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, TrendingDown, ScanLine, Map, User, MessageSquare, Moon, Timer } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber, calculatePercentageChange } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const kilosPoints = useAppStore((state) => state.kilosPoints)
  const currentConsumption = useAppStore((state) => state.currentConsumption)
  const lastMonthConsumption = useAppStore((state) => state.lastMonthConsumption)
  const estimatedCost = useAppStore((state) => state.estimatedCost)
  const addKilosPoints = useAppStore((state) => state.addKilosPoints)

  const handleSecretPoints = () => {
    addKilosPoints(100)
  }

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const consumptionChange = calculatePercentageChange(
    currentConsumption,
    lastMonthConsumption
  )

  const chartData = [
    { month: 'Sep', kwh: 390 },
    { month: 'Oct', kwh: 368 },
    { month: 'Nov', kwh: currentConsumption },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-8 px-6">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/80 text-sm mt-1">
              Welcome back, {user.name.split(' ')[0]}!
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSecretPoints}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {/* Kilos Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Kilos Points</p>
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-5xl font-bold text-white"
                  >
                    {formatNumber(kilosPoints)}
                  </motion.h2>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-6 -mt-4 space-y-4"
      >
        {/* Consumption Status Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Consumption Status</span>
                {consumptionChange < 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-secondary)]">
                    <TrendingDown className="w-4 h-4" />
                    {Math.abs(consumptionChange).toFixed(1)}% vs last month
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-white">
                    {currentConsumption}
                  </span>
                  <span className="text-[var(--color-muted)] text-sm">kWh</span>
                </div>
                <p className="text-[var(--color-muted)] text-sm">
                  Last month: {lastMonthConsumption} kWh
                </p>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="var(--color-muted)"
                    style={{ fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="kwh"
                    fill="var(--color-primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Estimate Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--color-secondary)]">
                  {formatCurrency(estimatedCost)}
                </span>
              </div>
              <p className="text-[var(--color-muted)] text-sm mt-2">
                Based on current consumption
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
          
          {/* Special Peak Shift Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-3"
          >
            <Button
              onClick={() => router.push('/peak-shift')}
              className="w-full h-20 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white border-0 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Peak Shift Challenge</div>
                    <div className="text-xs text-white/80 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>1 hour · Earn up to 300 pts</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl animate-pulse">🌙</div>
              </div>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => router.push('/scan')}
              className="h-24 flex-col gap-2 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Bill Decoder</span>
            </Button>

            <Button
              onClick={() => router.push('/challenges')}
              className="h-24 flex-col gap-2"
              variant="outline"
            >
              <ScanLine className="w-6 h-6" />
              <span>Challenges</span>
            </Button>
          </div>
        </motion.div>

        {/* Energy Tips */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-[var(--color-warning)]/20 to-[var(--color-warning)]/5 border-[var(--color-warning)]/30">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-warning)]/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    Pro Tip: Peak Hours
                  </h4>
                  <p className="text-sm text-[var(--color-muted)]">
                    Avoid using high-consumption appliances between 2-4 PM and 8-10 PM to reduce your bill by up to 20%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  )
}
