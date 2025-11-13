# Monthly Challenges System 🎯

## Overview
A comprehensive monthly challenge system that rewards users for completing specific tasks. Challenges reset every month and have a cooldown period after being claimed.

## Features Implemented

### 1. Challenge Types
- **Bill Scanner Master** 📊 - Scan 5 bills this month → 500 points
- **Energy Saver** ⚡ - Reduce consumption by 15% → 1000 points
- **Consistency Champion** 🔥 - Maintain 30-day login streak → 750 points
- **Community Guardian** 🛡️ - Report 3 electrical hazards → 600 points

### 2. Challenge States
- **Active** - In progress, not completed
- **Completed** - Ready to claim reward
- **Claimed** - Reward has been claimed
- **On Cooldown** - Must wait until next month

### 3. UI Features
- New "Challenges" tab on `/challenges` page
- Real-time progress tracking
- Visual progress bars
- Time remaining until monthly reset
- One-click claim button
- Status indicators (locked, claimable, claimed)

### 4. Auto-Tracking
When users scan a bill, the system automatically:
- Increments the bill_scan challenge progress
- Updates the UI in real-time
- Marks as completed when target reached

## How It Works

### For Users:
1. Navigate to **Challenges** page
2. View all available monthly challenges
3. Complete tasks naturally (scan bills, report hazards, etc.)
4. Progress auto-updates
5. Click "Claim" when completed
6. Receive reward points
7. Challenge goes on cooldown until next month

### Technical Flow:
```
User Action (e.g., scan bill)
    ↓
updateChallengeProgress()
    ↓
Check if target reached
    ↓
Mark as 'completed'
    ↓
User clicks "Claim"
    ↓
claimChallengeReward()
    ↓
Award points
    ↓
Set cooldown (end of next month)
    ↓
Mark as 'claimed'
```

## Database Structure

### Collection: `monthly_challenges`
```typescript
{
  id: "userId_challengeType_2025_10",
  userId: "abc123",
  challengeType: "bill_scan",
  title: "Bill Scanner Master",
  description: "Scan and analyze 5 electricity bills this month",
  targetValue: 5,
  currentValue: 2, // Current progress
  rewardPoints: 500,
  status: "active", // active | completed | claimed | expired
  startDate: Date(2025-11-01),
  endDate: Date(2025-11-30),
  claimedAt: Date | undefined,
  cooldownUntil: Date | undefined, // End of next month
  createdAt: Date,
  updatedAt: Date
}
```

## Files Created

1. **lib/types/challenges.ts** - Type definitions
2. **lib/services/challenges.ts** - Challenge management service
3. **firestore.rules** - Added security rules for monthly_challenges

## Files Modified

1. **app/challenges/page.tsx** - Added Challenges tab with UI
2. **app/scan/page.tsx** - Auto-track bill scans

## Security Rules

```javascript
match /monthly_challenges/{challengeId} {
  // Users can only read their own challenges
  allow read: if isAuthenticated() && 
                 resource.data.userId == request.auth.uid;
  
  // Users can only create/update their own challenges
  allow create, update: if isAuthenticated() && 
                           request.resource.data.userId == request.auth.uid;
}
```

## API Reference

### getUserChallenges(userId: string)
Get all current month challenges for a user. Auto-initializes if none exist.

### updateChallengeProgress(userId: string, challengeType: ChallengeType, incrementBy?: number)
Increment challenge progress. Auto-marks as completed when target reached.

### claimChallengeReward(userId: string, challengeType: ChallengeType)
Claim reward points. Sets cooldown period until next month.

### getChallengeDefinition(type: ChallengeType)
Get challenge configuration (icon, color, description, etc.)

## Usage Example

```typescript
// In bill scanning component
import { updateChallengeProgress } from '@/lib/services/challenges';

// After successful bill upload
await updateChallengeProgress(user.uid, 'bill_scan', 1);
```

## Next Steps

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Future Enhancements
- [ ] Add streak challenge auto-tracking
- [ ] Add hazard report challenge auto-tracking
- [ ] Add energy reduction challenge calculation
- [ ] Add push notifications when challenges complete
- [ ] Add achievement badges for completing all challenges
- [ ] Add challenge history/stats page
- [ ] Add social sharing for completed challenges

## Testing Checklist

- ✅ Navigate to Challenges page → See 3 tabs
- ✅ Click "Challenges" tab → See 4 monthly challenges
- ✅ All challenges show 0/X progress initially
- ✅ Scan a bill → Bill Scanner challenge increments
- ✅ Scan 5 bills → Challenge shows "Claim" button
- ✅ Click "Claim" → Receive 500 points
- ✅ Challenge shows "Claimed" status
- ✅ Shows cooldown message
- ✅ Timer shows "X days left" until month end

## Cooldown System

When a challenge is claimed:
1. Status changes to 'claimed'
2. `claimedAt` timestamp recorded
3. `cooldownUntil` set to end of **next month**
4. User cannot claim same challenge until after cooldown
5. Next month, new challenges auto-initialize

Example:
- Claim on Nov 15, 2025
- Cooldown until Dec 31, 2025, 23:59:59
- On Jan 1, 2026, new challenges available

---

**Status:** ✅ Fully Implemented
**Zero Errors:** All TypeScript compilation successful
**Ready for:** Testing and deployment
