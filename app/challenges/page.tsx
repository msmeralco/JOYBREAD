'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Zap, Medal, Crown, Target, Clock, CheckCircle, Lock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddressModal } from '@/components/AddressModal'
import { formatNumber } from '@/lib/utils'
import { getUserChallenges, claimChallengeReward, getChallengeDefinition, updateChallengeProgress } from '@/lib/services/challenges'
import type { MonthlyChallenge } from '@/lib/types/challenges'

type Tab = 'challenges' | 'leaderboard'

interface LeaderboardEntry {
  rank: number
  name: string
  location: string
  points: number
  reduction: number
  isCurrentUser?: boolean
}

// Function to generate dynamic leaderboard based on city
function generateLeaderboardForCity(city: string, userBarangay: string, userBarangayPoints: number = 0): LeaderboardEntry[] {
  const barangayNames: Record<string, string[]> = {
    'Pasig': ['San Miguel', 'San Nicolas', 'Kapitolyo', 'San Antonio', 'Ugong', 'Dela Paz', 'Bagong Ilog', 'Maybunga', 'Oranbo', 'Manggahan'],
    'Makati': ['Poblacion', 'Bel-Air', 'San Lorenzo', 'Urdaneta', 'Guadalupe Nuevo', 'Magallanes', 'Forbes Park', 'Dasmariñas'],
    'Quezon City': ['Project 6', 'Commonwealth', 'Fairview', 'Bahay Toro', 'Kamuning', 'Teachers Village', 'South Triangle', 'U.P. Village'],
    'Taguig': ['Fort Bonifacio', 'Western Bicutan', 'Central Bicutan', 'Ususan', 'Bagumbayan', 'Maharlika Village'],
    'Manila': ['Ermita', 'Malate', 'Sampaloc', 'Quiapo', 'Binondo', 'Intramuros', 'San Miguel'],
    'Mandaluyong': ['Addition Hills', 'Barangka Drive', 'Hulo', 'Bagong Silang', 'Highway Hills'],
  }

  const cityBarangays = barangayNames[city] || ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6']
  
  // Hash the user's barangay to get consistent random position (1st, 2nd, or 3rd)
  let hash = 0
  for (let i = 0; i < userBarangay.length; i++) {
    hash = ((hash << 5) - hash) + userBarangay.charCodeAt(i)
    hash = hash & hash
  }
  const userPosition = (Math.abs(hash) % 3) + 1 // Will be 1, 2, or 3
  
  // Base simulated points for user's barangay (simulates other members' contributions)
  const baseSimulatedPoints = 20000 - ((userPosition - 1) * 2000)
  // Total barangay points = base simulated + user's actual contribution
  const totalBarangayPoints = baseSimulatedPoints + userBarangayPoints
  
  const leaderboard: LeaderboardEntry[] = []
  let rank = 1
  
  // Add top barangays before user (skip user's barangay)
  for (let i = 0; i < userPosition - 1; i++) {
    const brgy = cityBarangays[i] || `Barangay ${i + 1}`
    if (brgy !== userBarangay) {
      leaderboard.push({
        rank: rank++,
        name: brgy,
        location: city,
        points: 20000 - (i * 2000),
        reduction: 25 - (i * 2),
        isCurrentUser: false,
      })
    }
  }
  
  // Add user's barangay with total accumulated points
  leaderboard.push({
    rank: userPosition,
    name: userBarangay,
    location: city,
    points: totalBarangayPoints, // Shows total of all members (simulated + user)
    reduction: 25 - ((userPosition - 1) * 2),
    isCurrentUser: true,
  })
  rank = userPosition + 1
  
  // Add remaining barangays (skip user's barangay)
  for (let i = userPosition; i < Math.min(cityBarangays.length, 8); i++) {
    const brgy = cityBarangays[i] || `Barangay ${i + 1}`
    if (brgy !== userBarangay) {
      leaderboard.push({
        rank: rank++,
        name: brgy,
        location: city,
        points: 20000 - (i * 2000),
        reduction: 25 - (i * 2),
        isCurrentUser: false,
      })
    }
  }
  
  return leaderboard
}

export default function ChallengesPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const addKilosPoints = useAppStore((state) => state.addKilosPoints)
  const setUser = useAppStore((state) => state.setUser)
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('challenges')
  const [challenges, setChallenges] = useState<MonthlyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [showAddressModal, setShowAddressModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    // Check if user needs to set address when visiting leaderboard
    if (activeTab === 'leaderboard' && user && (!user.barangay || !user.city)) {
      setShowAddressModal(true)
    }
  }, [activeTab, user])

  useEffect(() => {
    if (authUser && activeTab === 'challenges') {
      loadChallenges()
    }
  }, [authUser, activeTab])

  const loadChallenges = async () => {
    if (!authUser) return
    try {
      setLoading(true)
      const userChallenges = await getUserChallenges(authUser.uid)
      setChallenges(userChallenges)
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (challengeType: string) => {
    if (!authUser || claiming) return
    
    try {
      setClaiming(challengeType)
      const result = await claimChallengeReward(authUser.uid, challengeType as any)
      
      if (result.success) {
        // Add points to user's Kilos Points
        addKilosPoints(result.points)
        
        // Show success message
        alert(`🎉 ${result.message}`)
        
        // Reload challenges
        await loadChallenges()
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      alert('Failed to claim reward')
    } finally {
      setClaiming(null)
    }
  }

  const getTimeUntilEndOfMonth = () => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const diff = endOfMonth.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return `${days} days left`
  }

  const handleAddressSubmit = (barangay: string, city: string) => {
    if (user) {
      setUser({
        ...user,
        barangay,
        city,
      })
    }
    setShowAddressModal(false)
  }

  if (!user) return null

  // Generate dynamic leaderboard based on user's city and barangay
  const currentLeaderboard = (user.city && user.barangay)
    ? generateLeaderboardForCity(user.city, user.barangay, user.barangayPoints || 0)
    : []

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
          <h1 className="text-3xl font-bold text-white mb-2">
            {activeTab === 'leaderboard' && user.city ? `${user.city} Leaderboard` : 'Challenges'}
          </h1>
          <p className="text-white/80 text-sm">
            {activeTab === 'leaderboard' && user.city 
              ? `Compete with barangays in ${user.city}`
              : 'Compete with your community'
            }
          </p>
          {activeTab === 'leaderboard' && user.city && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowAddressModal(true)}
              className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-all"
            >
              Change Location
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-[var(--color-card)] rounded-2xl p-1 flex gap-1 border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'challenges'
                ? 'bg-[var(--color-primary)] text-white shadow-lg'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[var(--color-primary)] text-white shadow-lg'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'challenges' ? (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="px-6 space-y-4"
          >
            {/* Time Remaining */}
            <Card className="bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/10 border-[var(--color-primary)]/30">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-muted)]">Monthly Reset</p>
                    <p className="font-semibold text-white">{getTimeUntilEndOfMonth()}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Challenges List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 bg-gray-700 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-800 rounded w-full"></div>
                      <div className="h-2 bg-gray-800 rounded w-full"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge, index) => {
                  const definition = getChallengeDefinition(challenge.challengeType)
                  const progress = (challenge.currentValue / challenge.targetValue) * 100
                  const isCompleted = challenge.currentValue >= challenge.targetValue
                  const isClaimed = challenge.status === 'claimed'
                  const onCooldown = challenge.cooldownUntil && new Date() < challenge.cooldownUntil

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`p-6 ${isClaimed ? 'opacity-60' : ''}`}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${definition?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-2xl flex-shrink-0`}>
                              {definition?.icon || '🎯'}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">
                                {challenge.title}
                              </h3>
                              <p className="text-sm text-[var(--color-muted)]">
                                {challenge.description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Reward Badge */}
                          <div className="text-right flex-shrink-0 ml-3">
                            <div className="flex items-center gap-1 mb-1">
                              <Zap className="w-4 h-4 text-[var(--color-warning)]" />
                              <span className="font-bold text-white">
                                {formatNumber(challenge.rewardPoints)}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">reward</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-muted)]">Progress</span>
                            <span className="font-medium text-white">
                              {challenge.currentValue} / {challenge.targetValue}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[var(--color-background)] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(progress, 100)}%` }}
                              transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
                              className={`h-full bg-gradient-to-r ${definition?.color || 'from-gray-500 to-gray-600'} rounded-full`}
                            />
                          </div>
                        </div>

                        {/* Action Button */}
                        {isClaimed ? (
                          <div className="flex items-center justify-center gap-2 py-3 bg-[var(--color-background)] rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-medium text-green-500">Claimed</span>
                            {onCooldown && (
                              <span className="text-xs text-[var(--color-muted)] ml-2">
                                • Reset next month
                              </span>
                            )}
                          </div>
                        ) : isCompleted ? (
                          <Button
                            onClick={() => handleClaimReward(challenge.challengeType)}
                            disabled={claiming === challenge.challengeType}
                            className={`w-full bg-gradient-to-r ${definition?.color || 'from-gray-500 to-gray-600'} hover:opacity-90 text-white border-0`}
                          >
                            {claiming === challenge.challengeType ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <Target className="w-4 h-4 mr-2" />
                                Claim {formatNumber(challenge.rewardPoints)} Points
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 py-3 bg-[var(--color-background)] rounded-xl">
                            <Lock className="w-4 h-4 text-[var(--color-muted)]" />
                            <span className="text-sm text-[var(--color-muted)]">
                              Complete to unlock reward
                            </span>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="px-6 space-y-3"
          >
            {/* Leaderboard Content */}
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
        )}
      </AnimatePresence>

      {/* Challenge Info Card - Only show on leaderboard tabs */}
      {activeTab !== 'challenges' && (
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
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
      />

      <BottomNav />
    </div>
  )
}
