'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from '@/components/SplashScreen'
import { OnboardingCarousel } from '@/components/OnboardingCarousel'
import { LoginForm } from '@/components/LoginForm'
import { SignUpForm } from '@/components/SignUpForm'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

type AppState = 'splash' | 'onboarding' | 'login' | 'signup'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('splash')
  const user = useAppStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSplashComplete = () => {
    // Always show onboarding carousel
    setAppState('onboarding')
  }

  const handleOnboardingComplete = () => {
    setAppState('login')
  }

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (appState === 'onboarding') {
    return <OnboardingCarousel onComplete={handleOnboardingComplete} />
  }

  if (appState === 'login') {
    return <LoginForm onSwitchToSignUp={() => setAppState('signup')} />
  }

  return <SignUpForm onSwitchToLogin={() => setAppState('login')} />
}
