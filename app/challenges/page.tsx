'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Zap, Medal, Crown } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'

type Tab = 'barangay' | 'nationwide'

interface LeaderboardEntry {
  rank: number
  name: string
  location: string
  points: number
  reduction: number
  isCurrentUser?: boolean
}

const barangayLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'San Miguel', location: 'Pasig City', points: 15420, reduction: 18 },
  { rank: 2, name: 'San Nicolas', location: 'Pasig City', points: 14850, reduction: 16 },
  { rank: 3, name: 'Kapitolyo', location: 'Pasig City', points: 13200, reduction: 15 },
  { rank: 4, name: 'San Antonio', location: 'Pasig City', points: 12100, reduction: 12, isCurrentUser: true },
  { rank: 5, name: 'Ugong', location: 'Pasig City', points: 11500, reduction: 11 },
  { rank: 6, name: 'Dela Paz', location: 'Pasig City', points: 10800, reduction: 10 },
]

const nationwideLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Makati Heights', location: 'Makati City', points: 28500, reduction: 22 },
  { rank: 2, name: 'Bonifacio Global City', location: 'Taguig City', points: 26300, reduction: 20 },
  { rank: 3, name: 'Quezon City Circle', location: 'Quezon City', points: 24100, reduction: 19 },
  { rank: 4, name: 'Alabang', location: 'Muntinlupa City', points: 22800, reduction: 18 },
  { rank: 5, name: 'San Miguel', location: 'Pasig City', points: 15420, reduction: 18 },
  { rank: 12, name: 'San Antonio', location: 'Pasig City', points: 12100, reduction: 12, isCurrentUser: true },
]

export default function ChallengesPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<Tab>('barangay')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const currentLeaderboard = activeTab === 'barangay' ? barangayLeaderboard : nationwideLeaderboard

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-[var(--color-warning)]" fill="var(--color-warning)" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-br from-amber-400 to-amber-600'
    return 'bg-[var(--color-card)]'
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Challenges</h1>
          <p className="text-white/80 text-sm">
            Compete with your community
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-[var(--color-card)] rounded-2xl p-1 flex gap-1 border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('barangay')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'barangay'
                ? 'bg-[var(--color-primary)] text-white shadow-lg'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            My Barangay
          </button>
          <button
            onClick={() => setActiveTab('nationwide')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'nationwide'
                ? 'bg-[var(--color-primary)] text-white shadow-lg'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            Nationwide
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 space-y-3"
      >
        {currentLeaderboard.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`p-4 ${
                entry.isCurrentUser
                  ? 'border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div
                  className={`w-12 h-12 rounded-full ${getRankBadgeColor(
                    entry.rank
                  )} flex items-center justify-center flex-shrink-0 border-2 ${
                    entry.rank <= 3 ? 'border-white/30' : 'border-[var(--color-border)]'
                  }`}
                >
                  {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-white">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {entry.name}
                    </h3>
                    {entry.isCurrentUser && (
                      <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--color-muted)] text-sm mb-2">
                    {entry.location}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-muted)]">Reduction Goal</span>
                      <span className="text-[var(--color-secondary)] font-medium">
                        {entry.reduction}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${entry.reduction * 5}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-[var(--color-warning)]" />
                    <span className="text-lg font-bold text-white">
                      {formatNumber(entry.points)}
                    </span>
                  </div>
                  <p className="text-[var(--color-muted)] text-xs">points</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Challenge Info Card */}
      <div className="px-6 mt-6">
        <Card className="bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/10 border-[var(--color-primary)]/30">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  November Challenge
                </h4>
                <p className="text-sm text-[var(--color-muted)]">
                  Reduce your energy consumption by 15% this month to earn bonus points and climb the leaderboard!
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
