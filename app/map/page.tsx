'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useAppStore, HazardReport } from '@/lib/store'
import { BottomNav } from '@/components/BottomNav'
import { HazardDetailModal } from '@/components/HazardDetailModal'

// Dynamically import HazardMap to avoid SSR issues with Leaflet
const HazardMap = dynamic(
  () => import('@/components/HazardMap').then(mod => ({ default: mod.HazardMap })),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <p className="text-white/60">Loading map...</p>
    </div>
  )}
)

export default function MapPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const hazardReports = useAppStore((state) => state.hazardReports)
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([14.5995, 120.9842])
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Get center from first report or use default Metro Manila coordinates
  useEffect(() => {
    if (hazardReports.length > 0) {
      const firstReport = hazardReports[0]
      setDefaultCenter([firstReport.location.lat, firstReport.location.lng])
    }
  }, [hazardReports])

  const handleMarkerClick = (report: HazardReport) => {
    setSelectedReport(report)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] pt-12 pb-6 px-6">
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-white">Hazard Map</h1>
            <p className="text-white/80 text-sm">
              {hazardReports.length} report{hazardReports.length !== 1 ? 's' : ''} in your area
            </p>
          </motion.div>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ height: 'calc(100vh - 220px)' }}
        >
          {hazardReports.length > 0 ? (
            <HazardMap
              center={defaultCenter}
              hazardReports={hazardReports}
              showHeatmap={true}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-8">
              <MapPin className="w-16 h-16 text-white/40 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Hazards Reported Yet</h3>
              <p className="text-white/60 text-center text-sm">
                Start reporting hazards in your area to see them on the map
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hazard Detail Modal */}
      {selectedReport && (
        <HazardDetailModal 
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
