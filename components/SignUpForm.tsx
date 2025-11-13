'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/store'
import { FirebaseError } from 'firebase/app'

const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

// Firebase error messages mapping
const getErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}

export function SignUpForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const { signUp } = useAuth()
  const setUser = useAppStore((state) => state.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setAuthError(null)
    
    try {
      const displayName = `${data.firstName} ${data.lastName}`
      await signUp(data.email, data.password, displayName)
      
      // Update user store with additional data
      setUser({
        id: '', // Will be updated by auth context
        name: displayName,
        email: data.email,
        city: '',
        barangay: '',
        rank: 1,
      })
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof FirebaseError) {
        setAuthError(getErrorMessage(error))
      } else {
        setAuthError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-16 sm:p-8 sm:py-16" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1a1f2e 50%, #0D1117 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px]"
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center justify-center mb-12"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'linear-gradient(135deg, #6A45FF, #8B5CF6)' }}></div>
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #6A45FF, #8B5CF6)' }}>
              <img src="logo.png" alt="Logo" className="w-12 h-12" />
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Sign Up</h1>
          <p className="text-base" style={{ color: '#9CA3AF' }}>
            Become a KILOS Warrior today
          </p>
        </div>

        {/* Form Card */}
        <motion.div 
          className="rounded-3xl px-8 py-12 sm:px-12 sm:py-14 border backdrop-blur-sm" 
          style={{ backgroundColor: 'rgba(22, 27, 34, 0.8)', borderColor: 'rgba(106, 69, 255, 0.3)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(106, 69, 255, 0.5)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Auth Error Message */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span>⚠</span> {authError}
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-5">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-5">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  First name
                </label>
                <Input
                  {...register('firstName')}
                  placeholder="Juan"
                  className={`transition-all duration-300 ${errors.firstName ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
                />
                {errors.firstName && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    ⚠ {errors.firstName.message}
                  </motion.p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Last name
                </label>
                <Input
                  {...register('lastName')}
                  placeholder="Dela Cruz"
                  className={`transition-all duration-300 ${errors.lastName ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
                />
                {errors.lastName && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    ⚠ {errors.lastName.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="your.email@example.com"
                className={`transition-all duration-300 ${errors.email ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
              />
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <span>⚠</span> {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Location fields removed - handled in a separate flow */}

            

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Password
              </label>
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`transition-all duration-300 ${errors.password ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
              />
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <span>⚠</span> {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Confirm Password
              </label>
              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={`transition-all duration-300 ${errors.confirmPassword ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
              />
              {errors.confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <span>⚠</span> {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full font-semibold text-base shadow-lg shadow-[#6A45FF]/30 hover:shadow-[#6A45FF]/50"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Sign Up'}
              </Button>
            </div>
          </form>

          

          
        </motion.div>

        {/* Footer Link */}
        <motion.p 
          className="text-center text-sm mt-10" 
          style={{ color: '#9CA3AF' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold hover:underline transition-all duration-200 hover:text-[#8B5CF6]"
            style={{ color: '#6A45FF' }}
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  )
}
