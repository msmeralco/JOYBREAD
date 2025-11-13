# Firebase Console Setup Checklist

Before you can use authentication in your app, you need to enable it in the Firebase Console.

## ⚠️ IMPORTANT: Enable Email/Password Authentication

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kilos-hackathon**

### Step 2: Enable Authentication

1. Click on **"Authentication"** in the left sidebar
2. Click on **"Get Started"** if this is your first time
3. Click on the **"Sign-in method"** tab

### Step 3: Enable Email/Password Provider

1. Find **"Email/Password"** in the list of providers
2. Click on it
3. Toggle the **"Enable"** switch to ON
4. **Important**: You can leave "Email link (passwordless sign-in)" OFF for now
5. Click **"Save"**

### Step 4: Configure Settings (Optional)

1. Go to **"Settings"** tab in Authentication
2. Review these settings:

   **Authorized Domains:**

   - `localhost` (should already be there for development)
   - Add your production domain when you deploy

   **User account management:**

   - Email enumeration protection: Recommended to enable

   **Password policy:**

   - Minimum length: 6 characters (default)
   - You can customize this if needed

## ✅ Verification

After enabling Email/Password authentication:

1. The "Email/Password" provider should show as **Enabled**
2. You should see it in the list with a green checkmark
3. Your app can now create and authenticate users

## 🧪 Test Your Setup

Run these tests to make sure everything works:

### Test 1: Create a New User

```bash
1. Run: npm run dev
2. Open: http://localhost:3000
3. Navigate to Sign Up
4. Fill in the form
5. Click "Sign Up"
```

**Expected Result**: User account created successfully and redirected to dashboard

**If it fails**: Check Firebase Console → Authentication → Users to see if the user was created

### Test 2: Sign In

```bash
1. Go to Login page
2. Enter the email and password you just created
3. Click "Sign In"
```

**Expected Result**: Logged in successfully and redirected to dashboard

### Test 3: Check Firebase Console

```bash
1. Go to Firebase Console
2. Click Authentication → Users
```

**Expected Result**: You should see your test user listed with:

- Email address
- Created date
- User UID
- Sign-in provider: Password

## 🔍 Troubleshooting

### Error: "auth/operation-not-allowed"

**Problem**: Email/Password authentication is not enabled  
**Solution**: Follow Step 3 above to enable it

### Error: "auth/configuration-not-found"

**Problem**: Firebase project not properly configured  
**Solution**:

1. Check your `.env` file has correct values
2. Verify project ID matches in Firebase Console
3. Make sure you're using the correct Firebase project

### Error: "auth/invalid-api-key"

**Problem**: API key is incorrect or missing  
**Solution**:

1. Go to Firebase Console → Project Settings
2. Copy the correct API key
3. Update `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env`
4. Restart your dev server

### Users Not Appearing in Console

**Problem**: Authentication might not be enabled  
**Solution**:

1. Verify Email/Password is enabled (green checkmark)
2. Check browser console for errors
3. Try creating a user with a different email

## 📊 Monitoring Users

Once authentication is working, you can:

### View All Users

1. Go to Firebase Console → Authentication → Users
2. See list of all registered users
3. View individual user details

### User Actions

From the Firebase Console, you can:

- **Disable** a user account
- **Delete** a user
- **Reset** a user's password (sends email)
- View **user metadata** (creation time, last sign-in)

### Analytics

1. Go to Authentication → Usage
2. View:
   - Daily active users
   - Sign-ups over time
   - Authentication methods used

## 🔐 Security Rules (Future)

When you add Firestore for storing user data, set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Enable Email/Password authentication
- [ ] Add production domain to Authorized Domains
- [ ] Enable Email enumeration protection
- [ ] Set up password policy
- [ ] Configure email templates (optional)
- [ ] Set up email verification (optional)
- [ ] Configure password reset emails (optional)
- [ ] Set up monitoring and alerts

## 📧 Email Configuration (Optional)

To customize authentication emails:

1. Go to Authentication → Templates
2. Customize:
   - **Email verification** template
   - **Password reset** template
   - **Email change** template
   - **SMS verification** template

You can customize:

- Sender name
- Email subject
- Email body
- Action URL

## ✅ You're Done!

Once Email/Password authentication is enabled in Firebase Console:

- ✅ Users can sign up
- ✅ Users can sign in
- ✅ Users can sign out
- ✅ Sessions are persisted
- ✅ Routes are protected

Your authentication system is ready to use! 🎉

---

**Next Steps:**

1. Enable Email/Password in Firebase Console
2. Test user registration
3. Test user login
4. Review the app documentation in QUICK_START.md
