'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (barangay: string, city: string) => void
}

const METRO_MANILA_CITIES = [
  'Caloocan',
  'Las Piñas',
  'Makati',
  'Malabon',
  'Mandaluyong',
  'Manila',
  'Marikina',
  'Muntinlupa',
  'Navotas',
  'Parañaque',
  'Pasay',
  'Pasig',
  'Pateros',
  'Quezon City',
  'San Juan',
  'Taguig',
  'Valenzuela',
]

// Barangays by city (sample - add more as needed)
const BARANGAYS_BY_CITY: Record<string, string[]> = {
  'Pasig': [
    'Bagong Ilog',
    'Bagong Katipunan',
    'Bambang',
    'Buting',
    'Caniogan',
    'Dela Paz',
    'Kalawaan',
    'Kapitolyo',
    'Manggahan',
    'Maybunga',
    'Oranbo',
    'Pinagbuhatan',
    'Pineda',
    'Rosario',
    'Sagad',
    'San Antonio',
    'San Joaquin',
    'San Jose',
    'San Miguel',
    'San Nicolas',
    'Santa Cruz',
    'Santa Lucia',
    'Santa Rosa',
    'Santo Tomas',
    'Santolan',
    'Sumilang',
    'Ugong',
    'Malinao',
    'Palatiw',
    'Sta. Lucia',
  ],
  'Makati': [
    'Bangkal',
    'Bel-Air',
    'Carmona',
    'Cembo',
    'Comembo',
    'Dasmariñas',
    'East Rembo',
    'Forbes Park',
    'Guadalupe Nuevo',
    'Guadalupe Viejo',
    'Kasilawan',
    'La Paz',
    'Magallanes',
    'Olympia',
    'Palanan',
    'Pembo',
    'Pinagkaisahan',
    'Pio del Pilar',
    'Pitogo',
    'Poblacion',
    'Post Proper Northside',
    'Post Proper Southside',
    'Rizal',
    'San Antonio',
    'San Isidro',
    'San Lorenzo',
    'Santa Cruz',
    'Singkamas',
    'South Cembo',
    'Tejeros',
    'Urdaneta',
    'Valenzuela',
    'West Rembo',
  ],
  'Quezon City': [
    'Alicia',
    'Amihan',
    'Apolonio Samson',
    'Aurora',
    'Baesa',
    'Bagong Lipunan ng Crame',
    'Bagong Pag-asa',
    'Bagumbayan',
    'Bagumbuhay',
    'Bahay Toro',
    'Balingasa',
    'Batasan Hills',
    'Commonwealth',
    'Culiat',
    'Fairview',
    'Kamuning',
    'Kristong Hari',
    'Loyola Heights',
    'North Fairview',
    'Novaliches',
    'Old Balara',
    'Pasong Tamo',
    'Project 6',
    'Santa Cruz',
    'South Triangle',
    'Tandang Sora',
    'Teachers Village',
    'U.P. Campus',
    'U.P. Village',
    'White Plains',
  ],
  // Add default empty arrays for other cities
  'Caloocan': ['Barangay 1', 'Barangay 2', 'Barangay 3'],
  'Las Piñas': ['Almanza Uno', 'Almanza Dos', 'BF International', 'Daniel Fajardo', 'Elias Aldana'],
  'Malabon': ['Acacia', 'Barsota', 'Bayan-Bayanan', 'Catmon', 'Concepcion'],
  'Mandaluyong': ['Addition Hills', 'Bagong Silang', 'Barangka Drive', 'Buayang Bato', 'Hulo'],
  'Manila': ['Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Miguel', 'San Nicolas', 'Santa Ana', 'Santa Cruz', 'Santa Mesa', 'Tondo'],
  'Marikina': ['Barangka', 'Calumpang', 'Concepcion Uno', 'Industrial Valley', 'Jesus dela Peña', 'Malanday', 'Nangka', 'Parang', 'San Roque', 'Santa Elena', 'Santo Niño', 'Tumana'],
  'Muntinlupa': ['Alabang', 'Ayala Alabang', 'Buli', 'Cupang', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan'],
  'Navotas': ['Bagumbayan North', 'Bagumbayan South', 'Bangculasi', 'Daanghari', 'Navotas East', 'Navotas West'],
  'Parañaque': ['Baclaran', 'BF Homes', 'Don Bosco', 'La Huerta', 'Marcelo Green', 'Merville', 'Moonwalk', 'San Antonio', 'San Dionisio', 'San Isidro', 'Sun Valley', 'Tambo', 'Vitalez'],
  'Pasay': ['Barangay 1', 'Barangay 76', 'Barangay 183', 'Malibay', 'San Rafael', 'San Roque', 'Tramo'],
  'Pateros': ['Aguho', 'Magtanggol', 'Martires del 96', 'Poblacion', 'San Pedro', 'San Roque', 'Santa Ana', 'Santo Rosario', 'Tabacalera'],
  'San Juan': ['Addition Hills', 'Balong-Bato', 'Corazon de Jesus', 'Ermitaño', 'Greenhills', 'Isabelita', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame'],
  'Taguig': ['Bagumbayan', 'Bambang', 'Calzada', 'Central Bicutan', 'Central Signal Village', 'Fort Bonifacio', 'Hagonoy', 'Ibayo-Tipas', 'Katuparan', 'Ligid-Tipas', 'Lower Bicutan', 'Maharlika Village', 'Napindan', 'New Lower Bicutan', 'North Daang Hari', 'North Signal Village', 'Palingon', 'Pinagsama', 'San Miguel', 'Santa Ana', 'South Daang Hari', 'South Signal Village', 'Tanyag', 'Tuktukan', 'Ususan', 'Upper Bicutan', 'Western Bicutan'],
  'Valenzuela': ['Arkong Bato', 'Bagbaguin', 'Balangkas', 'Bignay', 'Bisig', 'Canumay East', 'Canumay West', 'Coloong', 'Dalandanan', 'Gen. T. de Leon', 'Isla', 'Karuhatan', 'Lawang Bato', 'Lingunan', 'Mabolo', 'Malanday', 'Malinta', 'Mapulang Lupa', 'Marulas', 'Maysan', 'Palasan', 'Parada', 'Pariancillo Villa', 'Paso de Blas', 'Pasolo', 'Poblacion', 'Pulo', 'Punturin', 'Rincon', 'Tagalag', 'Ugong', 'Viente Reales', 'Wawang Pulo'],
}

export function AddressModal({ isOpen, onClose, onSubmit }: AddressModalProps) {
  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  const availableBarangays = city ? BARANGAYS_BY_CITY[city] || [] : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!city) {
      setError('Please select your city')
      return
    }

    if (!barangay) {
      setError('Please select your barangay')
      return
    }
    
    onSubmit(barangay, city)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="bg-[var(--color-card)] border-[var(--color-border)] shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Set Your Location</h2>
                    <p className="text-sm text-[var(--color-muted)] mt-1">
                      Join your barangay leaderboard
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-muted)]" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* City Select */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setBarangay('') // Reset barangay when city changes
                      setError('')
                    }}
                    className="w-full h-12 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  >
                    <option value="" className="bg-[var(--color-background)]">
                      Select your city
                    </option>
                    {METRO_MANILA_CITIES.map((cityName) => (
                      <option
                        key={cityName}
                        value={cityName}
                        className="bg-[var(--color-background)]"
                      >
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barangay Select */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Barangay
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => {
                      setBarangay(e.target.value)
                      setError('')
                    }}
                    disabled={!city}
                    className="w-full h-12 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
                    style={{ maxHeight: '200px' }}
                  >
                    <option value="" className="bg-[var(--color-background)]">
                      {city ? 'Select your barangay' : 'Select city first'}
                    </option>
                    {availableBarangays.map((brgy) => (
                      <option
                        key={brgy}
                        value={brgy}
                        className="bg-[var(--color-background)]"
                      >
                        {brgy}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm flex items-center gap-2"
                  >
                    <span>⚠</span> {error}
                  </motion.p>
                )}

                {/* Info */}
                <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl p-4">
                  <p className="text-xs text-[var(--color-muted)]">
                    💡 Your location helps you compete with neighbors in your area and track community energy savings.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:opacity-90 text-white border-0 font-semibold"
                >
                  Join Leaderboard
                </Button>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
