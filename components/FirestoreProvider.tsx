'use client'

import { useFirestoreSync } from '@/lib/use-firestore-sync'

export function FirestoreProvider({ children }: { children: React.ReactNode }) {
  useFirestoreSync()
  return <>{children}</>
}
