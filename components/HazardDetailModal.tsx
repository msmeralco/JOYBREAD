'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, User, MessageSquare, Send } from 'lucide-react'
import { HazardReport, HazardComment, useAppStore } from '@/lib/store'
import { addCommentToReport as saveCommentToFirestore, subscribeToReportComments } from '@/lib/firestore-service'
import { Button } from '@/components/ui/button'

interface HazardDetailModalProps {
  report: HazardReport | null
  onClose: () => void
}

export function HazardDetailModal({ report, onClose }: HazardDetailModalProps) {
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liveComments, setLiveComments] = useState<HazardComment[]>(report?.comments || [])
  const user = useAppStore((state) => state.user)
  const addCommentToReport = useAppStore((state) => state.addCommentToReport)

  if (!report) return null

  // Subscribe to real-time comments for this report
  useEffect(() => {
    if (!report?.id) return

    console.log(`🔥 Subscribing to comments for report ${report.id}`)
    
    const unsubscribe = subscribeToReportComments(report.id, (comments) => {
      console.log(`✅ Received ${comments.length} comments for report ${report.id}`)
      setLiveComments(comments)
      // Also update the store
      useAppStore.getState().updateReportComments(report.id, comments)
    })

    return () => {
      console.log(`🔴 Unsubscribing from comments for report ${report.id}`)
      unsubscribe()
    }
  }, [report?.id])

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const commentData = {
        reportId: report.id,
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoURL,
        comment: commentText.trim()
      }

      // Save to Firestore
      const newComment = await saveCommentToFirestore(report.id, commentData)
      console.log('✅ Comment saved to Firestore')

      // Update local store
      addCommentToReport(report.id, newComment)
      
      setCommentText('')
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'leaning-pole': '⚡',
      'spaghetti-wires': '🍝',
      'sparking-transformer': '⚡',
      'vegetation': '🌿'
    }
    return emojiMap[category] || '⚠️'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + 'd ago'
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + 'mo ago'
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + 'd ago'
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + 'h ago'
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + 'm ago'
    
    return Math.floor(seconds) + 's ago'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-[var(--color-background)] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                {getCategoryEmoji(report.category)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white capitalize mb-1">
                  {report.category.replace('-', ' ')}
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    report.hazardIntensity === 'urgent' ? 'bg-red-200 text-red-900' :
                    report.hazardIntensity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                    'bg-yellow-200 text-yellow-900'
                  }`}>
                    {report.hazardIntensity.toUpperCase()}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    report.status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                    report.status === 'in-progress' ? 'bg-blue-200 text-blue-900' :
                    'bg-green-200 text-green-900'
                  }`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{report.userName || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeAgo(report.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-300px)]">
            {/* Location */}
            <div className="mb-6">
              <div className="flex items-start gap-2 text-[var(--color-muted)]">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">{report.address}</p>
                  <p className="text-sm">
                    {report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            {report.photoURL && (
              <div className="mb-6">
                <img 
                  src={report.photoURL} 
                  alt="Hazard" 
                  className="w-full rounded-2xl border-2 border-[var(--color-border)]"
                />
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold text-white">
                  Community Comments ({liveComments.length})
                </h3>
              </div>

              {/* Comments List */}
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {liveComments.length > 0 ? (
                  liveComments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white text-sm">
                              {comment.userName}
                            </p>
                            <span className="text-xs text-[var(--color-muted)]">
                              {getTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-muted)]">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--color-muted)]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Add Comment */}
              {user && (
                <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmitComment()
                          }
                        }}
                        placeholder="Add a comment to help verify this hazard... (Press Enter to post)"
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim() || isSubmitting}
                          size="sm"
                          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
