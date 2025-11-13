/**
 * User Profile Utilities
 * 
 * Helper functions for managing user profile data
 * This can be extended to sync with Firestore in the future
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  city: string;
  barangay: string;
  rank: number;
  photoURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a user profile object from signup data
 */
export function createUserProfile(
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  city: string,
  barangay: string
): UserProfile {
  return {
    id: userId,
    name: `${firstName} ${lastName}`,
    email,
    city,
    barangay,
    rank: 1, // Default rank for new users
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update user profile with new data
 */
export function updateUserProfile(
  currentProfile: UserProfile,
  updates: Partial<UserProfile>
): UserProfile {
  return {
    ...currentProfile,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password should contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password should contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password should contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format user display name
 */
export function formatDisplayName(firstName: string, lastName: string): string {
  const capitalize = (str: string) => 
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(name: string): string {
  const names = name.trim().split(' ');
  if (names.length === 0) return '??';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Future: Add Firestore integration
/*
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export async function saveUserToFirestore(profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', profile.id);
  await setDoc(userRef, {
    ...profile,
    createdAt: profile.createdAt || new Date(),
    updatedAt: new Date(),
  });
}

export async function getUserFromFirestore(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
}

export async function updateUserInFirestore(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date(),
  });
}
*/
