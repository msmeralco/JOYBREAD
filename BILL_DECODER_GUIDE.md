# 📋 Bill Decoder Chatbot - Setup & Usage Guide

## 🎉 What's New

Your KILOS app now has a **fully integrated Bill Decoder Chatbot** integrated into the `/scan` route!

### ✨ Features Implemented

✅ **Camera & Upload Support** - Take photos or upload bill images  
✅ **OCR Processing** - Automatic text extraction using Tesseract.js  
✅ **AI Bill Analysis** - Smart parsing of Meralco bills  
✅ **Interactive Chatbot** - Ask questions about your bill with Ka-KILOS  
✅ **Firestore Storage** - Bills stored as base64 images (no Firebase Storage needed!)  
✅ **Chat History** - All conversations saved per bill  
✅ **Bill History** - View and reload previous bills  
✅ **Mobile-First UI** - Optimized for phone usage  
✅ **Integrated Flow** - Upload → Process → Chat, all in one page

---

## 🚀 Quick Start

### 1️⃣ Firebase Setup (REQUIRED)

#### Enable Firestore Database Only

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kilos-hackathon**
3. Click **Firestore Database** in the left menu
4. Click **Create Database**
5. Choose **Production mode** (we'll use custom rules)
6. Select your region (preferably Asia-Southeast)
7. Click **Enable**

**Note:** Firebase Storage is NOT needed - images are stored as base64 in Firestore!

#### Deploy Security Rules

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore
# Select existing project: kilos-hackathon

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 2️⃣ Environment Variables

Ensure your `.env.local` has:

```env
# Firebase Config (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kilos-hackathon
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket  # Not used but required
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# OpenRouter API (for chatbot)
OPENROUTER_API_KEY=your-openrouter-key

# App URL (for server-side API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change in production
```

### 3️⃣ Start the App

```powershell
npm run dev
```

Visit: `http://localhost:3000/scan`

---

## 📱 How to Use

### Upload a Bill

1. Navigate to `/scan` or click "Bill Decoder" on dashboard
2. Click **Take Photo** (mobile) or **Upload File**
3. Select/capture your Meralco bill
4. Wait for OCR and analysis (~10-15 seconds)
5. Chatbot automatically starts!

### Chat with Ka-KILOS

- Auto-explanation starts after upload
- Ask questions like:
  - "Why is my bill so high?"
  - "What if I buy an aircon?"
  - "How can I reduce my electricity cost?"
- All messages are saved automatically

### View History

1. Click **History** in the top-right
2. Browse your uploaded bills
3. Click to reload and continue chatting

---

## 🏗️ Architecture

### File Structure

```
app/
├── scan/
│   └── page.tsx              # Complete bill decoder with chatbot
├── api/
│   ├── bills/
│   │   ├── upload/route.ts   # Upload & OCR (base64 storage)
│   │   ├── list/route.ts     # Fetch user's bills
│   │   ├── [billId]/route.ts # Get single bill
│   │   └── save-message/route.ts # Save chat messages
│   ├── chat-simple/route.ts  # Chatbot API
│   └── analyze-text/route.ts # Bill parsing

lib/
├── types/
│   └── bill.ts              # TypeScript interfaces
└── firebase/
    └── firebase.ts          # Firebase config (Firestore only)

firestore.rules              # Firestore security rules
```

### Data Flow

1. **Upload**: User captures/uploads bill → Converted to base64
2. **OCR**: Tesseract.js extracts text from image
3. **Parse**: `/api/analyze-text` uses AI to extract bill data
4. **Save**: Bill metadata + base64 image + parsed data → Firestore
5. **Chat**: User asks questions → OpenRouter AI responds
6. **Persist**: Each chat message saved to Firestore

### Firestore Schema

```typescript
// Collection: bills
{
  id: string,              // Auto-generated
  userId: string,          // Firebase Auth UID
  fileName: string,        // Original filename
  imageData: string,       // Base64 encoded image (data:image/jpeg;base64,...)
  uploadedAt: Timestamp,   // Upload time
  parsedData: {            // Extracted bill data
    totalAmount: number,
    consumption: {
      kwh: number,
      previous: number
    },
    billingPeriod: {
      from: string,
      to: string
    },
    charges: { ... }
  },
  ocrConfidence: number,   // OCR accuracy %
  chatHistory: [           // Array of messages
    {
      id: string,
      role: 'user' | 'assistant',
      content: string,
      timestamp: number
    }
  ],
  lastUpdated: Timestamp
}
```

**Note:** Images are stored as base64 strings directly in Firestore. This eliminates the need for Firebase Storage and keeps everything in one place!

---

## 🔒 Security

### Firestore Rules

- Users can only read/write their own bills
- `userId` field is validated on create/update
- Authentication required for all operations
- Base64 images stored directly in documents

### Why Base64 Instead of Storage?

- ✅ **Free**: No Storage costs
- ✅ **Simpler**: One service instead of two
- ✅ **Faster**: No separate upload/download
- ⚠️ **Limit**: Firestore doc limit is 1MB (good for compressed bill images)

---

## 🧪 Testing

### Test Upload Flow

1. Use a sample Meralco bill image
2. Upload via `/scan`
3. Verify:
   - Bill document created in Firestore
   - `imageData` contains base64 string
   - Chat messages are saved
4. Check Firestore Console to see data

### Test Chat Persistence

1. Upload a bill and ask questions
2. Click **History** → Select bill
3. Verify chat history is restored

---

## 🐛 Troubleshooting

### "Unauthorized - User ID required"

- **Cause**: User not logged in
- **Fix**: Ensure Firebase Auth is working, user is signed in

### Upload fails silently

- **Check**: Browser console for errors
- **Verify**: Firestore is enabled
- **Test**: Firestore rules allow write for user's UID

### OCR returns gibberish

- **Cause**: Poor image quality
- **Fix**: Use clearer photo, ensure good lighting
- **Tip**: Take photo in good lighting, avoid shadows

### Chat doesn't save

- **Check**: Firestore rules are deployed
- **Verify**: `NEXT_PUBLIC_APP_URL` is correct
- **Test**: Check Firestore console for new documents

### "Failed to fetch bills"

- **Check**: Network tab for API errors
- **Verify**: User is authenticated
- **Fix**: Check Firestore indexes (create if needed)

### Image too large error

- **Cause**: Firestore 1MB document limit
- **Fix**: Compress image before upload or reduce quality
- **Future**: Implement client-side image compression

---

## 📊 Firestore Indexes

If you get "index required" errors, create composite indexes:

```
Collection: bills
Fields: userId (Ascending), uploadedAt (Descending)
```

Create via Firebase Console → Firestore → Indexes → Composite

---

## 🎨 Customization

### Change AI Model

Edit `/app/api/chat-simple/route.ts`:

```typescript
model: "qwen/qwen-2.5-72b-instruct:free"; // Change to another OpenRouter model
```

### Adjust OCR Language

Edit `/app/api/bills/upload/route.ts`:

```typescript
const worker = await Tesseract.createWorker("eng+fil"); // English + Filipino
```

### Modify Chat UI

Edit `/app/scan/page.tsx` for custom styling in the chat view

---

## 🚀 Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Set production `NEXT_PUBLIC_APP_URL` in Vercel/hosting
- [ ] Test upload/chat flow in production
- [ ] Enable Firestore indexes if needed
- [ ] Monitor Firestore usage (images as base64 use more reads)

---

## 💡 Cost Optimization Tips

### Base64 Storage in Firestore

- **Reads**: Each bill load = 1 read
- **Writes**: Upload + each chat message = writes
- **Storage**: ~100KB per bill (compressed JPEG)

### Free Tier Limits (Firestore)

- 50K reads/day
- 20K writes/day
- 1GB storage

### Tips:

1. Compress images client-side before upload
2. Cache bill data in client to reduce reads
3. Batch chat message saves instead of per-message

---

## 📈 Next Steps / Future Enhancements

- [ ] Client-side image compression before upload
- [ ] Bill comparison (month-over-month)
- [ ] Export chat history as PDF
- [ ] Bill payment reminders
- [ ] Electricity usage predictions
- [ ] Multi-language support (full Tagalog)
- [ ] Share bills with family members

---

## 🆘 Support

Issues? Check:

1. Firebase Console → Firestore for data
2. Browser DevTools → Console/Network for errors
3. `firestore.rules` is deployed
4. Images are base64 encoded in `imageData` field

---

**Happy Chatting! ⚡💬**

### ✨ Features Implemented

✅ **Camera & Upload Support** - Take photos or upload bill images  
✅ **OCR Processing** - Automatic text extraction using Tesseract.js  
✅ **AI Bill Analysis** - Smart parsing of Meralco bills  
✅ **Interactive Chatbot** - Ask questions about your bill with Ka-KILOS  
✅ **Firebase Storage** - Secure cloud storage for bill images  
✅ **Firestore Database** - Persistent storage for bills & chat history  
✅ **Bill History** - View and access all your previous bills  
✅ **Mobile-First UI** - Optimized for phone usage

---

## 🚀 Quick Start

### 1️⃣ Firebase Setup (REQUIRED)

#### Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kilos-hackathon**
3. Click **Firestore Database** in the left menu
4. Click **Create Database**
5. Choose **Production mode** (we'll use custom rules)
6. Select your region (preferably Asia-Southeast)
7. Click **Enable**

#### Enable Firebase Storage

1. In Firebase Console, click **Storage** in the left menu
2. Click **Get Started**
3. Select **Production mode**
4. Keep the default storage location
5. Click **Done**

#### Deploy Security Rules

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select:
# - Firestore
# - Storage
# Use existing project: kilos-hackathon

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 2️⃣ Environment Variables

Ensure your `.env.local` has:

```env
# Firebase Config (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kilos-hackathon
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# OpenRouter API (for chatbot)
OPENROUTER_API_KEY=your-openrouter-key

# App URL (for server-side API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change in production
```

### 3️⃣ Start the App

```powershell
npm run dev
```

Visit: `http://localhost:3000/bill-decoder`

---

## 📱 How to Use

### Upload a Bill

1. Navigate to `/bill-decoder`
2. Click **Take Photo** (mobile) or **Upload File**
3. Select/capture your Meralco bill
4. Wait for OCR and analysis (~10-15 seconds)

### Chat with Ka-KILOS

- Auto-explanation starts after upload
- Ask questions like:
  - "Why is my bill so high?"
  - "What if I buy an aircon?"
  - "How can I reduce my electricity cost?"
- All messages are saved automatically

### View History

1. Click **History** in the top-right
2. See all your uploaded bills
3. Click any bill to resume chatting

---

## 🏗️ Architecture

### File Structure

```
app/
├── bill-decoder/
│   ├── page.tsx              # Main bill decoder interface
│   └── history/
│       └── page.tsx          # Bill history dashboard
├── api/
│   ├── bills/
│   │   ├── upload/route.ts   # Upload & OCR processing
│   │   ├── list/route.ts     # Fetch user's bills
│   │   ├── [billId]/route.ts # Get single bill
│   │   └── save-message/route.ts # Save chat messages
│   ├── chat-simple/route.ts  # Chatbot API (updated)
│   └── analyze-text/route.ts # Bill parsing

components/
├── BillUploader.tsx          # Camera/upload component
└── BillChatbot.tsx          # Interactive chat interface

lib/
├── types/
│   └── bill.ts              # TypeScript interfaces
└── firebase/
    └── firebase.ts          # Firebase config (updated)

firestore.rules              # Firestore security rules
storage.rules                # Storage security rules
```

### Data Flow

1. **Upload**: User captures/uploads bill → Firebase Storage
2. **OCR**: Tesseract.js extracts text from image
3. **Parse**: `/api/analyze-text` uses AI to extract bill data
4. **Save**: Bill metadata + parsed data → Firestore
5. **Chat**: User asks questions → OpenRouter AI responds
6. **Persist**: Each chat message saved to Firestore

### Firestore Schema

```typescript
// Collection: bills
{
  id: string,              // Auto-generated
  userId: string,          // Firebase Auth UID
  fileName: string,        // Original filename
  imageUrl: string,        // Firebase Storage URL
  uploadedAt: Timestamp,   // Upload time
  parsedData: {            // Extracted bill data
    totalAmount: number,
    consumption: {
      kwh: number,
      previous: number
    },
    billingPeriod: {
      from: string,
      to: string
    },
    charges: { ... }
  },
  ocrConfidence: number,   // OCR accuracy %
  chatHistory: [           // Array of messages
    {
      id: string,
      role: 'user' | 'assistant',
      content: string,
      timestamp: number
    }
  ],
  lastUpdated: Timestamp
}
```

---

## 🔒 Security

### Firestore Rules

- Users can only read/write their own bills
- `userId` field is validated on create/update
- Authentication required for all operations

### Storage Rules

- Bills stored in `/bills/{userId}/`
- Max file size: 10MB
- Only image files allowed
- Users can only access their own folder

---

## 🧪 Testing

### Test Upload Flow

1. Use a sample Meralco bill image
2. Upload via `/bill-decoder`
3. Verify:
   - Image appears in Firebase Storage Console
   - Bill document created in Firestore
   - Chat messages are saved

### Test Chat Persistence

1. Upload a bill and ask questions
2. Refresh the page
3. Click **History** → Select bill
4. Verify chat history is restored

---

## 🐛 Troubleshooting

### "Unauthorized - User ID required"

- **Cause**: User not logged in
- **Fix**: Ensure Firebase Auth is working, user is signed in

### Upload fails silently

- **Check**: Browser console for errors
- **Verify**: Firebase Storage is enabled
- **Test**: Storage rules allow write for user's UID

### OCR returns gibberish

- **Cause**: Poor image quality
- **Fix**: Use clearer photo, ensure good lighting

### Chat doesn't save

- **Check**: Firestore rules are deployed
- **Verify**: `NEXT_PUBLIC_APP_URL` is correct
- **Test**: Check Firestore console for new documents

### "Failed to fetch bills"

- **Check**: Network tab for API errors
- **Verify**: User is authenticated
- **Fix**: Check Firestore indexes (create if needed)

---

## 📊 Firestore Indexes

If you get "index required" errors, create composite indexes:

```
Collection: bills
Fields: userId (Ascending), uploadedAt (Descending)
```

Create via Firebase Console → Firestore → Indexes → Composite

---

## 🎨 Customization

### Change AI Model

Edit `/app/api/chat-simple/route.ts`:

```typescript
model: "qwen/qwen-2.5-72b-instruct:free"; // Change to another OpenRouter model
```

### Adjust OCR Language

Edit `/app/api/bills/upload/route.ts`:

```typescript
const worker = await Tesseract.createWorker("eng+fil"); // English + Filipino
```

### Modify Chat UI

Edit `/components/BillChatbot.tsx` for custom styling

---

## 🚀 Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Set production `NEXT_PUBLIC_APP_URL` in Vercel/hosting
- [ ] Test upload/chat flow in production
- [ ] Enable Firestore indexes if needed
- [ ] Set up Firebase billing (if Storage > free tier)

---

## 📈 Next Steps / Future Enhancements

- [ ] Add bill comparison (month-over-month)
- [ ] Export chat history as PDF
- [ ] Share bills with family members
- [ ] Bill payment reminders
- [ ] Electricity usage predictions
- [ ] Multi-language support (full Tagalog)

---

## 🆘 Support

Issues? Check:

1. Firebase Console → Firestore/Storage for data
2. Browser DevTools → Console/Network for errors
3. `firestore.rules` and `storage.rules` are deployed

---

**Happy Chatting! ⚡💬**
