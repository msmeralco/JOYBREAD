'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveHazardReport } from '@/lib/firestore-service'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'

const mockUsers = [
  { name: 'Juan Dela Cruz', id: 'user1' },
  { name: 'Maria Santos', id: 'user2' },
  { name: 'Pedro Garcia', id: 'user3' },
  { name: 'Ana Reyes', id: 'user4' },
  { name: 'Carlos Mendoza', id: 'user5' },
  { name: 'Sofia Martinez', id: 'user6' },
  { name: 'Miguel Rivera', id: 'user7' },
  { name: 'Isabella Torres', id: 'user8' },
]

const categories = [
  'leaning-pole',
  'spaghetti-wires',
  'sparking-transformer',
  'vegetation',
] as const

const hazardIntensities = ['urgent', 'moderate', 'normal'] as const

const locations = [
  { lat: 14.5995, lng: 120.9842, address: 'Ermita, Manila' },
  { lat: 14.6091, lng: 120.9940, address: 'Quiapo, Manila' },
  { lat: 14.6042, lng: 121.0122, address: 'Santa Cruz, Manila' },
  { lat: 14.6760, lng: 121.0437, address: 'Diliman, Quezon City' },
  { lat: 14.6488, lng: 121.0509, address: 'Cubao, Quezon City' },
  { lat: 14.5547, lng: 121.0244, address: 'Poblacion, Makati' },
  { lat: 14.5639, lng: 121.0450, address: 'Bel-Air, Makati' },
  { lat: 14.5764, lng: 121.0851, address: 'Kapitolyo, Pasig' },
  { lat: 14.5794, lng: 121.0359, address: 'Highway Hills, Mandaluyong' },
  { lat: 14.5176, lng: 121.0509, address: 'Bonifacio Global City, Taguig' },
  { lat: 14.4793, lng: 121.0198, address: 'Baclaran, Parañaque' },
  { lat: 14.4456, lng: 120.9822, address: 'Talon, Las Piñas' },
  { lat: 14.4089, lng: 121.0419, address: 'Alabang, Muntinlupa' },
  { lat: 14.6569, lng: 120.9835, address: 'Monumento, Caloocan' },
  { lat: 14.6507, lng: 121.1029, address: 'Concepcion Uno, Marikina' },
  { lat: 14.6019, lng: 121.0355, address: 'Greenhills, San Juan' },
  { lat: 14.5378, lng: 121.0014, address: 'Malibay, Pasay' },
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(daysBack: number): Date {
  const now = new Date()
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const randomTime = Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(pastDate.getTime() + randomTime)
}

export default function GenerateMockDataPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalReports, setTotalReports] = useState(0)
  const [stats, setStats] = useState<{ urgent: number; moderate: number; normal: number } | null>(null)

  const generateMockData = async (numberOfReports: number) => {
    setIsGenerating(true)
    setProgress(0)
    setStats(null)

    const stats = { urgent: 0, moderate: 0, normal: 0 }

    try {
      for (let i = 0; i < numberOfReports; i++) {
        const user = getRandomElement(mockUsers)
        const location = getRandomElement(locations)
        const category = getRandomElement(categories)
        const intensity = getRandomElement(hazardIntensities)
        const createdAt = getRandomDate(30)

        const report = {
          userId: user.id,
          userName: user.name,
          category: category as 'leaning-pole' | 'spaghetti-wires' | 'sparking-transformer' | 'vegetation',
          hazardIntensity: intensity as 'urgent' | 'moderate' | 'normal',
          location: {
            lat: location.lat + (Math.random() - 0.5) * 0.01,
            lng: location.lng + (Math.random() - 0.5) * 0.01,
          },
        address: location.address,
        photoURL: '/logo.png',
        status: getRandomElement(['pending', 'in-progress', 'resolved'] as const),
          pointsAwarded: intensity === 'urgent' ? 100 : intensity === 'moderate' ? 75 : 50,
          createdAt: createdAt,
          comments: []
        }

        await saveHazardReport(report)
        
        stats[intensity]++
        setProgress(((i + 1) / numberOfReports) * 100)
        
        // Small delay to avoid overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setTotalReports(numberOfReports)
      setStats(stats)
    } catch (error) {
      console.error('Error generating mock data:', error)
      alert('Failed to generate mock data. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Mock Data Generator</h1>
            <p className="text-white/70">Populate your map with realistic hazard reports</p>
          </div>

          {!isGenerating && !stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => generateMockData(10)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg"
                >
                  Generate 10 Reports
                </Button>
                <Button
                  onClick={() => generateMockData(25)}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-6 text-lg"
                >
                  Generate 25 Reports
                </Button>
                <Button
                  onClick={() => generateMockData(50)}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
                >
                  Generate 50 Reports
                </Button>
                <Button
                  onClick={() => generateMockData(100)}
                  className="bg-red-500 hover:bg-red-600 text-white py-6 text-lg"
                >
                  Generate 100 Reports
                </Button>
              </div>

              <div className="mt-8 bg-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Coverage Areas
                </h3>
                <p className="text-white/70 text-sm">
                  Mock data covers all Metro Manila areas including Manila, Quezon City, Makati, 
                  Pasig, Taguig, Parañaque, Caloocan, Marikina, and more.
                </p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white text-xl font-semibold">Generating Reports...</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-white/70 text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-2">Success!</h2>
                <p className="text-white/70">Generated {totalReports} hazard reports</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-500/20 rounded-2xl p-4 border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stats.urgent}</div>
                  <div className="text-red-300 text-sm">Urgent</div>
                </div>
                <div className="bg-orange-500/20 rounded-2xl p-4 border border-orange-500/30">
                  <TrendingUp className="w-8 h-8 text-orange-400 mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stats.moderate}</div>
                  <div className="text-orange-300 text-sm">Moderate</div>
                </div>
                <div className="bg-yellow-500/20 rounded-2xl p-4 border border-yellow-500/30">
                  <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stats.normal}</div>
                  <div className="text-yellow-300 text-sm">Normal</div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/report'}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-6 text-lg"
                >
                  View on Map 🗺️
                </Button>
                <Button
                  onClick={() => {
                    setStats(null)
                    setProgress(0)
                  }}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10"
                >
                  Generate More
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-white/60 hover:text-white text-sm">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
