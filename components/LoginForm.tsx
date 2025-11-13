'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const setUser = useAppStore((state) => state.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Set user in store
    setUser({
      id: Date.now().toString(),
      name: 'Juan Dela Cruz',
      email: data.email,
      city: 'Pasig City',
      barangay: 'Barangay San Antonio',
      rank: 4,
    })
    
    setIsLoading(false)
    router.push('/dashboard')
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    // Simulate Google auth
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUser({
      id: Date.now().toString(),
      name: 'Test User',
      email: 'user@example.com',
      city: 'Pasig City',
      barangay: 'Barangay San Antonio',
      rank: 4,
    })
    
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12 sm:p-8" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1a1f2e 50%, #0D1117 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[450px]"
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center justify-center mb-8 sm:mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: 'linear-gradient(135deg, #6A45FF, #8B5CF6)' }}></div>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #6A45FF, #8B5CF6)' }}>
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="white" />
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          className="rounded-3xl sm:rounded-[32px] px-8 py-12 sm:px-12 sm:py-14 border backdrop-blur-sm" 
          style={{ backgroundColor: 'rgba(22, 27, 34, 0.8)', borderColor: 'rgba(106, 69, 255, 0.3)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(106, 69, 255, 0.5)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Header inside card */}
          <div className="text-center mb-14 sm:mb-14">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Login</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-9 sm:space-y-8">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-3.5">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder=""
                className={`h-14 text-base transition-all duration-300 ${errors.email ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50 focus:border-[#6A45FF]'}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
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

            {/* Password */}
            <div className="pt-4 sm:pt-3">
              <label className="block text-sm font-medium text-white mb-3.5">
                Password
              </label>
              <Input
                {...register('password')}
                type="password"
                placeholder=""
                className={`h-14 text-base transition-all duration-300 ${errors.password ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50 focus:border-[#6A45FF]'}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
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

            {/* Submit Button */}
            <div className="pt-14 sm:pt-14">
              <Button
                type="submit"
                className="w-full h-14 sm:h-16 font-semibold text-base sm:text-lg rounded-xl shadow-lg shadow-[#6A45FF]/30 hover:shadow-[#6A45FF]/50 transition-all duration-300"
                disabled={isLoading}
                style={{ background: 'linear-gradient(135deg, #6A45FF, #8B5CF6)' }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </Button>
            </div>
          </form>

          {/* Footer Link inside card */}
          <motion.p 
            className="text-center text-xs sm:text-sm mt-14 sm:mt-12" 
            style={{ color: '#9CA3AF' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="font-semibold hover:underline transition-all duration-200 hover:text-[#8B5CF6]"
              style={{ color: '#6A45FF' }}
            >
              Sign in
            </button>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  )
}
