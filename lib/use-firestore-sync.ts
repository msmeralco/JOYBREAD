'use client'

import { useEffect } from 'react'
import { useAppStore } from './store'
import { subscribeToHazardReports } from './firestore-service'

/**
 * Hook to sync Firestore hazard reports with the local store
 * Call this in your main layout or app component
 */
export function useFirestoreSync() {
  const setHazardReports = useAppStore((state) => state.setHazardReports)
  const user = useAppStore((state) => state.user)

  useEffect(() => {
    if (!user) return

    console.log('🔥 Setting up Firestore real-time sync...')

    // Subscribe to real-time hazard reports updates
    const unsubscribe = subscribeToHazardReports((reports) => {
      console.log(`✅ Synced ${reports.length} hazard reports from Firestore`)
      setHazardReports(reports)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔴 Cleaning up Firestore sync')
      unsubscribe()
    }
  }, [user, setHazardReports])
}
