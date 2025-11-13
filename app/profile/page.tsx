'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Trophy, Gift, Clock, LogOut, Zap, Medal } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const kilosPoints = useAppStore((state) => state.kilosPoints)
  const availableRewards = useAppStore((state) => state.availableRewards)
  const activityLogs = useAppStore((state) => state.activityLogs)
  const redeemReward = useAppStore((state) => state.redeemReward)
  const logout = useAppStore((state) => state.logout)

  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const handleRedeem = (rewardId: string) => {
    setSelectedReward(rewardId)
    setShowRedeemModal(true)
  }

  const confirmRedeem = () => {
    if (selectedReward) {
      redeemReward(selectedReward)
      setShowRedeemModal(false)
      setSelectedReward(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Profile Picture */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>

          {/* User Info */}
          <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
          <p className="text-white/80 text-sm mb-4">
            {user.barangay}, {user.city}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Medal className="w-5 h-5 text-[var(--color-warning)]" />
                <span className="text-2xl font-bold text-white">#{user.rank}</span>
              </div>
              <p className="text-white/70 text-xs">Rank</p>
            </div>

            <div className="w-px h-12 bg-white/20"></div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-5 h-5 text-white" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(kilosPoints)}
                </span>
              </div>
              <p className="text-white/70 text-xs">Points</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[var(--color-primary)]" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm mb-1">
                      {reward.name}
                    </h4>
                    <p className="text-[var(--color-muted)] text-xs mb-1">
                      {reward.description}
                    </p>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[var(--color-warning)]" />
                      <span className="text-[var(--color-warning)] text-xs font-medium">
                        {formatNumber(reward.pointsCost)} pts
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={kilosPoints < reward.pointsCost}
                    onClick={() => handleRedeem(reward.id)}
                    className="flex-shrink-0"
                  >
                    Redeem
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-center text-[var(--color-muted)] py-8">
                  No activity yet. Start earning points!
                </p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-background)]"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.points > 0 
                          ? 'bg-[var(--color-secondary)]/20' 
                          : 'bg-[var(--color-warning)]/20'
                      }`}>
                        {log.points > 0 ? (
                          <Zap className="w-4 h-4 text-[var(--color-secondary)]" />
                        ) : (
                          <Gift className="w-4 h-4 text-[var(--color-warning)]" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-white text-sm">{log.description}</p>
                        <p className="text-[var(--color-muted)] text-xs">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>

                      <span className={`text-sm font-semibold ${
                        log.points > 0 
                          ? 'text-[var(--color-secondary)]' 
                          : 'text-[var(--color-warning)]'
                      }`}>
                        {log.points > 0 ? '+' : ''}{log.points}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="destructive"
            className="w-full"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </motion.div>
      </div>

      {/* Redeem Confirmation Modal */}
      <AnimatePresence>
        {showRedeemModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowRedeemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-card)] rounded-2xl p-6 max-w-sm w-full border border-[var(--color-border)]"
            >
              <h3 className="text-xl font-bold text-white mb-2">Confirm Redemption</h3>
              <p className="text-[var(--color-muted)] mb-6">
                Are you sure you want to redeem this reward for{' '}
                {availableRewards.find(r => r.id === selectedReward)?.pointsCost} points?
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRedeemModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmRedeem}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
