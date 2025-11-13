# Firebase Authentication Integration Guide

This document explains the Firebase Authentication implementation in the KILOS app.

## ✅ What Was Implemented

### 1. Firebase Configuration (`firebase/firebase.ts`)

- Initialized Firebase Auth with persistence (browserLocalPersistence)
- Exported `auth` instance for use throughout the app
- Protected against multiple initializations

### 2. Authentication Context (`lib/auth-context.tsx`)

- Created `AuthProvider` component for global auth state management
- Implemented `useAuth()` hook for accessing auth functions
- Automatic sync between Firebase Auth and Zustand store
- Handles auth state changes with `onAuthStateChanged`

**Available Functions:**

- `signIn(email, password)` - Sign in with email/password
- `signUp(email, password, displayName)` - Create new account
- `logout()` - Sign out user
- `user` - Current Firebase user object
- `loading` - Auth loading state

### 3. Route Protection (`lib/route-guard.tsx` & `middleware.ts`)

- Client-side route guard component
- Automatically redirects:
  - Unauthenticated users → `/` (home/login)
  - Authenticated users → `/dashboard` (when accessing login/signup)
- Shows loading spinner during auth state check

**Protected Routes:**

- `/dashboard`
- `/profile`
- `/scan`
- `/report`
- `/challenges`

### 4. Updated Forms

#### LoginForm (`components/LoginForm.tsx`)

- Integrated Firebase `signInWithEmailAndPassword`
- Comprehensive error handling with user-friendly messages
- Loading states during authentication
- Form validation with Zod schema
- Error display for Firebase auth errors

**Error Codes Handled:**

- Invalid credentials
- User not found
- Account disabled
- Too many requests
- Network errors

#### SignUpForm (`components/SignUpForm.tsx`)

- Integrated Firebase `createUserWithEmailAndPassword`
- Updates user profile with display name
- Stores additional user data (city, barangay) in Zustand
- Password confirmation validation
- Error handling for:
  - Email already in use
  - Weak password
  - Invalid email
  - Network errors

### 5. App Layout (`app/layout.tsx`)

- Wrapped with `AuthProvider` for global auth state
- Wrapped with `RouteGuard` for automatic route protection
- Loading state displayed while checking authentication

### 6. Profile Page (`app/profile\page.tsx`)

- Updated logout to use Firebase Auth
- Properly clears both Firebase session and local state

## 🔒 Authentication Flow

### Sign Up Flow

1. User fills signup form (email, password, name, city, barangay)
2. Form validates data (Zod schema)
3. Firebase creates account with email/password
4. User profile updated with display name
5. Additional data stored in Zustand (city, barangay, rank)
6. User redirected to `/dashboard`
7. AuthProvider syncs Firebase user with Zustand store

### Sign In Flow

1. User enters email and password
2. Form validates credentials
3. Firebase authenticates user
4. AuthProvider updates Zustand store with user data
5. User redirected to `/dashboard`

### Sign Out Flow

1. User clicks logout button (in Profile page)
2. Firebase signOut() called
3. AuthProvider detects change and clears Zustand store
4. RouteGuard redirects to home page (`/`)

### Auto-Login Flow

1. App loads → AuthProvider initializes
2. Firebase checks for existing session
3. If session exists:
   - User data loaded into Zustand store
   - RouteGuard allows access to protected routes
4. If no session:
   - RouteGuard redirects to home/login

## 📝 Form Validation

Both forms use **Zod** for schema validation:

### Login Schema

```typescript
- email: Valid email format
- password: Minimum 6 characters
```

### SignUp Schema

```typescript
- firstName: Minimum 2 characters
- lastName: Minimum 2 characters
- email: Valid email format
- city: Minimum 2 characters
- barangay: Minimum 2 characters
- password: Minimum 6 characters
- confirmPassword: Must match password
```

## 🛡️ Error Handling

### Firebase Error Messages

All Firebase errors are mapped to user-friendly messages:

- `auth/invalid-credential` → "Invalid email or password"
- `auth/email-already-in-use` → "This email is already registered"
- `auth/weak-password` → "Password is too weak"
- `auth/too-many-requests` → "Too many failed attempts. Please try again later"
- `auth/network-request-failed` → "Network error. Please check your connection"

### Error Display

- Errors shown in red alert boxes above forms
- Individual field errors shown below inputs
- Animated error messages for better UX

## 🔄 State Management

### Zustand Store Integration

The app uses two-way sync between Firebase Auth and Zustand:

**Firebase → Zustand:**

- `onAuthStateChanged` listener in AuthProvider
- Updates store when user signs in/out
- Maintains user data across page refreshes

**Zustand → Components:**

- All components access user data via `useAppStore()`
- User profile, points, and activity data persisted

### Data Stored

```typescript
{
  id: string           // Firebase UID
  name: string         // Display name
  email: string        // User email
  city: string         // User's city
  barangay: string     // User's barangay
  rank: number         // Leaderboard rank
  photoURL?: string    // Optional profile photo
}
```

## 🚀 Usage Examples

### In a Component

```typescript
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <p>Welcome {user?.displayName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Accessing Store Data

```typescript
import { useAppStore } from "@/lib/store";

function Dashboard() {
  const user = useAppStore((state) => state.user);
  const kilosPoints = useAppStore((state) => state.kilosPoints);

  return (
    <h1>
      {user?.name} - {kilosPoints} points
    </h1>
  );
}
```

## ✨ Features

✅ Email/Password authentication  
✅ Automatic session persistence  
✅ Protected route guards  
✅ Form validation (Zod)  
✅ Error handling with user-friendly messages  
✅ Loading states  
✅ Automatic redirects  
✅ Two-way state sync (Firebase ↔ Zustand)  
✅ TypeScript type safety  
✅ Modern Next.js App Router compatible

## 🔐 Security Best Practices

1. **Environment Variables**: Firebase config stored in `.env` file
2. **Client-side validation**: Zod schema validation before API calls
3. **Auth persistence**: Secure browser local storage
4. **Route protection**: Both client-side guards and middleware
5. **Error messages**: Generic messages to prevent information leakage

## 📱 Testing the Implementation

### Test Sign Up

1. Navigate to the app
2. Go through splash/onboarding → Sign Up
3. Fill in all fields with valid data
4. Submit form
5. Should redirect to dashboard

### Test Sign In

1. Use previously created account
2. Enter email and password
3. Submit form
4. Should redirect to dashboard

### Test Route Protection

1. While logged out, try accessing `/dashboard`
2. Should redirect to home
3. While logged in, try accessing `/` or `/login`
4. Should redirect to dashboard

### Test Logout

1. Go to Profile page
2. Click logout button
3. Should redirect to home
4. Try accessing dashboard again
5. Should redirect to home

### Test Persistence

1. Sign in
2. Refresh the page
3. Should stay logged in
4. Close browser and reopen
5. Should still be logged in

## 🐛 Common Issues & Solutions

### "Firebase already initialized"

- Fixed by checking `getApps().length` before initialization

### "User redirected immediately after login"

- Check RouteGuard logic in `lib/route-guard.tsx`
- Ensure `loading` state is properly handled

### "Store data not persisting"

- Zustand persist middleware is configured
- Check browser local storage for `kilos-app-storage`

### "Auth state not syncing"

- Verify `onAuthStateChanged` listener in AuthProvider
- Check that AuthProvider wraps the entire app

## 📚 Next Steps

Potential enhancements:

- Add Google/Social authentication
- Implement email verification
- Add password reset functionality
- Add profile photo upload
- Implement user roles/permissions
- Add two-factor authentication
- Store additional user data in Firestore

## 🎯 Conclusion

Firebase Authentication is now fully integrated with:

- Secure email/password authentication
- Protected routes with automatic redirects
- Form validation and error handling
- Persistent auth sessions
- Seamless integration with existing Zustand store

All authentication flows follow modern Next.js App Router patterns and TypeScript best practices.
