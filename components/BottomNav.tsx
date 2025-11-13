'use client'

import { Home, ScanLine, Plus, Trophy, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: ScanLine, label: 'Scan', href: '/scan' },
  { icon: Plus, label: 'Report', href: '/report', isPrimary: true },
  { icon: Trophy, label: 'Challenges', href: '/challenges' },
  { icon: User, label: 'Profile', href: '/profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)]/95 backdrop-blur-lg border-t border-[var(--color-border)] pb-safe">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-all",
                  item.isPrimary ? "w-16" : "w-14"
                )}
              >
                {item.isPrimary ? (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] shadow-lg shadow-[var(--color-primary)]/50"
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-2xl transition-colors",
                        isActive && "bg-[var(--color-primary)]/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6 transition-colors",
                          isActive
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-muted)]"
                        )}
                      />
                    </motion.div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isActive
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-muted)]"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
