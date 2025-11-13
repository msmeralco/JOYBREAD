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

const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(2, 'City is required'),
  barangay: z.string().min(2, 'Barangay is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Set user in store
    setUser({
      id: Date.now().toString(),
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      city: data.city,
      barangay: data.barangay,
      rank: 4,
    })
    
    setIsLoading(false)
    router.push('/dashboard')
  }

  const handleGoogleSignUp = async () => {
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
              <Zap className="w-12 h-12 text-white" fill="white" />
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 sm:space-y-9">
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

            {/* Location Fields Row */}
            <div className="grid grid-cols-2 gap-5">
              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  City
                </label>
                <Input
                  {...register('city')}
                  placeholder="Pasig City"
                  className={`transition-all duration-300 ${errors.city ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
                />
                {errors.city && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    ⚠ {errors.city.message}
                  </motion.p>
                )}
              </div>

              {/* Barangay */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Barangay
                </label>
                <Input
                  {...register('barangay')}
                  placeholder="San Antonio"
                  className={`transition-all duration-300 ${errors.barangay ? 'border-red-500 shake' : 'hover:border-[#6A45FF]/50'}`}
                />
                {errors.barangay && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    ⚠ {errors.barangay.message}
                  </motion.p>
                )}
              </div>
            </div>

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

          {/* OR Separator */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#30363D' }}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 font-semibold tracking-wider" style={{ backgroundColor: 'rgba(22, 27, 34, 0.6)', color: '#6B7280' }}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full font-medium hover:bg-[#6A45FF]/5 hover:border-[#6A45FF] transition-all duration-300"
            size="lg"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>
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
