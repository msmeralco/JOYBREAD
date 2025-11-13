'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';

interface RouteGuardProps {
  children: React.ReactNode;
}

const protectedRoutes = ['/dashboard', '/profile', '/scan', '/report', '/challenges'];
const authRoutes = ['/', '/login', '/signup'];

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.includes(pathname);

    // Redirect to dashboard if user is authenticated and on auth pages
    if (user && isAuthRoute) {
      router.push('/dashboard');
    }

    // Redirect to login if user is not authenticated and on protected pages
    if (!user && isProtectedRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
