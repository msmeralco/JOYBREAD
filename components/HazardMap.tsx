'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { HazardReport } from '@/lib/store'

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface HazardMapProps {
  center: [number, number]
  onLocationSelect?: (lat: number, lng: number) => void
  selectedLocation?: [number, number]
  hazardReports?: HazardReport[]
  showHeatmap?: boolean
  onMarkerClick?: (report: HazardReport) => void
}

function LocationMarker({ onLocationSelect, selectedLocation }: { 
  onLocationSelect?: (lat: number, lng: number) => void
  selectedLocation?: [number, number]
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    selectedLocation || null
  )

  useMapEvents({
    click(e) {
      if (!onLocationSelect) return
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      onLocationSelect(lat, lng)
    },
  })

  return position === null ? null : <Marker position={position} />
}

// Component to add heatmap layer
function HeatmapLayer({ reports }: { reports: HazardReport[] }) {
  const map = useMap()
  const heatLayerRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    if (!map || reports.length === 0) return

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    // Convert reports to heatmap points [lat, lng, intensity]
    const heatPoints: [number, number, number][] = reports.map(report => {
      // Map hazard intensity to heat values (urgent = 1.0, moderate = 0.6, normal = 0.3)
      const intensityMap: Record<string, number> = {
        'urgent': 1.0,
        'moderate': 0.6,
        'normal': 0.3
      }
      const intensity = intensityMap[report.hazardIntensity] || 0.5
      return [report.location.lat, report.location.lng, intensity]
    })

    console.log('Heatmap points:', heatPoints) // Debug log

    // Create and add heat layer with increased visibility
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 40,
      blur: 25,
      maxZoom: 13,
      minOpacity: 0.4,
      max: 1.0,
      gradient: {
        0.0: '#00ff00',  // Green for low
        0.3: '#ffff00',  // Yellow for normal
        0.6: '#ff8800',  // Orange for moderate
        1.0: '#ff0000'   // Red for urgent
      }
    })

    heatLayer.addTo(map)
    heatLayerRef.current = heatLayer
    
    console.log('Heatmap layer added to map') // Debug log

    // Cleanup
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [map, reports])

  return null
}

// Component to render hazard markers
function HazardMarkers({ reports, onMarkerClick }: { reports: HazardReport[], onMarkerClick?: (report: HazardReport) => void }) {
  const getMarkerIcon = (intensity: string) => {
    const colorMap: Record<string, string> = {
      'urgent': '#ff0000',
      'moderate': '#ff8800',
      'normal': '#ffff00'
    }
    const color = colorMap[intensity] || '#ff8800'
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.6); cursor: pointer;"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
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
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.location.lat, report.location.lng]}
          icon={getMarkerIcon(report.hazardIntensity)}
          eventHandlers={{
            click: () => {
              if (onMarkerClick) {
                onMarkerClick(report)
              }
            }
          }}
        >
          <Popup maxWidth={300} className="hazard-popup">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryEmoji(report.category)}</span>
                <div>
                  <h3 className="font-bold text-sm capitalize">
                    {report.category.replace('-', ' ')}
                  </h3>
                  <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                </div>
              </div>
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  report.hazardIntensity === 'urgent' ? 'bg-red-100 text-red-800' :
                  report.hazardIntensity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.hazardIntensity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">📍 {report.address}</p>
              <p className="text-xs text-gray-500">
                Reported by: {report.userName || 'Anonymous'}
              </p>
              {report.comments && report.comments.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  💬 {report.comments.length} comment{report.comments.length !== 1 ? 's' : ''}
                </p>
              )}
              <button 
                onClick={() => onMarkerClick && onMarkerClick(report)}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
              >
                View Details & Comments
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Component to handle map initialization
function MapInitializer({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    if (map) {
      // Force map to redraw tiles with longer timeout
      setTimeout(() => {
        map.invalidateSize()
      }, 250)
      // Second invalidation to ensure rendering
      setTimeout(() => {
        map.invalidateSize()
      }, 500)
    }
  }, [map, center])
  
  return null
}

export function HazardMap({ 
  center, 
  onLocationSelect, 
  selectedLocation, 
  hazardReports = [],
  showHeatmap = false,
  onMarkerClick
}: HazardMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/80 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapInitializer center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {showHeatmap && hazardReports.length > 0 && (
          <HeatmapLayer reports={hazardReports} />
        )}
        {hazardReports.length > 0 && (
          <HazardMarkers reports={hazardReports} onMarkerClick={onMarkerClick} />
        )}
        {onLocationSelect && (
          <LocationMarker 
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
          />
        )}
      </MapContainer>
      {onLocationSelect && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-1000 pointer-events-none">
          <p className="text-white text-sm bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            Tap on the map to mark hazard location
          </p>
        </div>
      )}
      {showHeatmap && (
        <div className="absolute top-4 right-4 z-1000 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
          <h4 className="font-semibold mb-2">Hazard Intensity</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff0000' }}></div>
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff8800' }}></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffff00' }}></div>
              <span>Normal</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">{hazardReports.length} reports</p>
          </div>
        </div>
      )}
    </div>
  )
}
