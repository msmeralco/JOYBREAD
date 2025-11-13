'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, MapPin, AlertTriangle, Zap, Check, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useAppStore, HazardReport } from '@/lib/store'
import { saveHazardReport } from '@/lib/firestore-service'
import { BottomNav } from '@/components/BottomNav'
import { HazardDetailModal } from '@/components/HazardDetailModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamically import HazardMap to avoid SSR issues with Leaflet
const HazardMap = dynamic(
  () => import('@/components/HazardMap').then(mod => ({ default: mod.HazardMap })),
  { ssr: false }
)

type ReportState = 'capture' | 'submitting' | 'success'

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
  const hazardReports = useAppStore((state) => state.hazardReports)
  
  const [reportState, setReportState] = useState<ReportState>('capture')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [location, setLocation] = useState({ lat: 14.5547, lng: 121.0244 }) // Pasig City
  const [selectedMapLocation, setSelectedMapLocation] = useState<[number, number] | undefined>(undefined)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [predictionResult, setPredictionResult] = useState<{
    className: string
    confidence: number
    allPredictions?: { className: string; confidence: number }[]
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getHazardDescription = (className: string): string => {
    const descriptions: Record<string, string> = {
      'urgent': 'Immediate attention required - High risk hazard detected',
      'moderate': 'Moderate risk - Should be addressed soon',
      'normal': 'Low risk - Regular monitoring recommended'
    }
    return descriptions[className] || 'Hazard detected'
  }

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
          // User denied location or browser blocked it
          // Keep using default location (Pasig City) - this is fine
        }
      )
    }
  }, [user, router])

  if (!user) return null

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Get fresh location when taking photo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(newLocation)
          // Set map marker at the captured location
          setSelectedMapLocation([newLocation.lat, newLocation.lng])
        },
        (error) => {
          console.warn('Could not get current location:', error)
          // Still set marker at default location if GPS fails
          setSelectedMapLocation([location.lat, location.lng])
        }
      )
    } else {
      // No geolocation support, use default location
      setSelectedMapLocation([location.lat, location.lng])
    }

    setIsAnalyzing(true)
    
    // Create image URL for preview
    const imageUrl = URL.createObjectURL(file)
    setUploadedImage(imageUrl)

    try {
      // Call Flask API for prediction
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const result = await response.json()
      
      // Check if it's a valid pole image
      if (result.hazardType === 'not_pole') {
        alert(result.message || 'Please upload an image of an electric pole or wires')
        setUploadedImage(null)
        setPredictionResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setIsAnalyzing(false)
        return
      }

      // Map API response to frontend format
      setPredictionResult({
        className: result.hazardType,
        confidence: result.confidence,
        allPredictions: [
          { className: 'urgent', confidence: result.rawScores[0] },
          { className: 'moderate', confidence: result.rawScores[1] },
          { className: 'normal', confidence: result.rawScores[2] }
        ]
      })
      
      // Auto-select category based on prediction
      const categoryMap: Record<string, string> = {
        'urgent': 'sparking-transformer',
        'moderate': 'spaghetti-wires',
        'normal': 'vegetation'
      }
      setSelectedCategory(categoryMap[result.hazardType] || 'spaghetti-wires')
      
      setIsAnalyzing(false)
    } catch (error) {
      console.error('Error analyzing image:', error)
      alert('Failed to analyze image. Make sure the Flask API is running on http://localhost:5000')
      setIsAnalyzing(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    setSelectedMapLocation([lat, lng])
  }

  const handleCapture = () => {
    if (uploadedImage && predictionResult) {
      // Auto-set location to current user location when submitting
      setSelectedMapLocation([location.lat, location.lng])
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !predictionResult) return

    setReportState('submitting')

    try {
      const pointsAwarded = 50
      
      const newReport = {
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoURL,
        photoURL: '/logo.png',
        category: selectedCategory as any,
        hazardIntensity: predictionResult.className as 'urgent' | 'moderate' | 'normal',
        location,
        address: `${user.barangay}, ${user.city}`,
        status: 'pending' as const,
        createdAt: new Date(),
        pointsAwarded,
        comments: []
      }

      // Save to Firestore
      const reportId = await saveHazardReport(newReport)
      console.log('✅ Hazard report saved to Firestore with ID:', reportId)

      // Also update local store
      addHazardReport({
        id: reportId,
        ...newReport
      })

      addActivityLog({
        id: Date.now().toString(),
        type: 'hazard-report',
        description: 'Reported electrical hazard',
        points: pointsAwarded,
        timestamp: new Date(),
      })

      setReportState('success')
    } catch (error) {
      console.error('Error submitting hazard report:', error)
      alert('Failed to submit report. Please try again.')
      setReportState('capture')
    }
  }

  const handleClose = () => {
    router.push('/dashboard')
  }

  const handleNewReport = () => {
    setReportState('capture')
    setSelectedCategory(null)
  }

  const handleMarkerClick = (report: HazardReport) => {
    setSelectedReport(report)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] relative">
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
            <div className="bg-gradient-to-br from-[var(--color-warning)] to-orange-600 pt-6 pb-4 px-6 relative z-30">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Report Hazard</h1>
                    <p className="text-white/80 text-xs">Power up your community</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Content - Fullscreen Map or Image */}
            <div className="absolute inset-0 top-[74px] bottom-0 z-0">
              {uploadedImage ? (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black p-6 flex flex-col">
                  {/* Image Container */}
                  <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border-2 border-gray-700 mb-4">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded hazard" 
                      className="w-full h-full object-contain"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-white">Analyzing hazard...</p>
                        </div>
                      </div>
                    )}
                    {predictionResult && !isAnalyzing && (
                      <div className="absolute top-4 left-4 right-4 bg-black/90 backdrop-blur-sm p-4 rounded-xl border border-yellow-500/50">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-yellow-400" />
                          <div className="flex-1">
                            <p className="text-white font-semibold">AI Detection</p>
                            <p className="text-sm text-gray-300">
                              {predictionResult.className} ({(predictionResult.confidence * 100).toFixed(1)}% confident)
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {getHazardDescription(predictionResult.className)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setUploadedImage(null)
                        setPredictionResult(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center z-50 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {/* Submit Button */}
                  {predictionResult && (
                    <div className="mb-20">
                      <Button
                        onClick={handleCapture}
                        size="lg"
                        className="w-full h-16 text-lg bg-purple-600 hover:bg-purple-700 rounded-2xl"
                      >
                        <AlertTriangle className="w-6 h-6 mr-2" />
                        Submit Hazard Report
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 z-0">
                  <HazardMap
                    center={[location.lat, location.lng]}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedMapLocation}
                    hazardReports={hazardReports}
                    showHeatmap={true}
                    onMarkerClick={handleMarkerClick}
                  />
                </div>
              )}

              {/* Camera Capture Button - Floating */}
              {!uploadedImage && (
                <div className="absolute bottom-24 left-6 right-6 z-40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="camera-capture"
                  />
                  <label
                    htmlFor="camera-capture"
                    className="flex items-center justify-center gap-3 w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl cursor-pointer hover:from-orange-600 hover:to-red-600 transition-all shadow-2xl"
                  >
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-white font-bold text-lg">Take Photo with Camera</span>
                  </label>
                </div>
              )}
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

      {/* Hazard Detail Modal */}
      {selectedReport && (
        <HazardDetailModal 
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  )
}
