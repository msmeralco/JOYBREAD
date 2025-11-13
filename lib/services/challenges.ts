/**
 * Monthly Challenges Service
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import {
  MonthlyChallenge,
  ChallengeType,
  MONTHLY_CHALLENGES,
  ChallengeDefinition,
} from '@/lib/types/challenges';

const COLLECTION_NAME = 'monthly_challenges';

/**
 * Get the first and last day of current month
 */
function getCurrentMonthRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate, endDate };
}

/**
 * Initialize monthly challenges for a user
 */
export async function initializeUserChallenges(userId: string): Promise<MonthlyChallenge[]> {
  const { startDate, endDate } = getCurrentMonthRange();
  const challenges: MonthlyChallenge[] = [];

  for (const def of MONTHLY_CHALLENGES) {
    const challengeId = `${userId}_${def.type}_${startDate.getFullYear()}_${startDate.getMonth()}`;
    
    const challenge: MonthlyChallenge = {
      id: challengeId,
      userId,
      challengeType: def.type,
      title: def.title,
      description: def.description,
      targetValue: def.targetValue,
      currentValue: 0,
      rewardPoints: def.rewardPoints,
      status: 'active',
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, COLLECTION_NAME, challengeId), {
      ...challenge,
      startDate: Timestamp.fromDate(challenge.startDate),
      endDate: Timestamp.fromDate(challenge.endDate),
      createdAt: Timestamp.fromDate(challenge.createdAt),
      updatedAt: Timestamp.fromDate(challenge.updatedAt),
    });

    challenges.push(challenge);
  }

  return challenges;
}

/**
 * Get user's current month challenges
 */
export async function getUserChallenges(userId: string): Promise<MonthlyChallenge[]> {
  const { startDate } = getCurrentMonthRange();
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  
  // Filter by current month in memory
  const challenges: MonthlyChallenge[] = [];
  const currentMonth = startDate.getMonth();
  const currentYear = startDate.getFullYear();
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const docStartDate = data.startDate.toDate();
    
    // Only include challenges from current month
    if (docStartDate.getMonth() === currentMonth && docStartDate.getFullYear() === currentYear) {
      challenges.push({
        ...data,
        id: doc.id,
        startDate: docStartDate,
        endDate: data.endDate.toDate(),
        claimedAt: data.claimedAt?.toDate(),
        cooldownUntil: data.cooldownUntil?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as MonthlyChallenge);
    }
  });

  if (challenges.length === 0) {
    // Initialize challenges for this month
    return await initializeUserChallenges(userId);
  }

  return challenges;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeType: ChallengeType,
  incrementBy: number = 1
): Promise<MonthlyChallenge | null> {
  const { startDate } = getCurrentMonthRange();
  const challengeId = `${userId}_${challengeType}_${startDate.getFullYear()}_${startDate.getMonth()}`;

  const docRef = doc(db, COLLECTION_NAME, challengeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Initialize if doesn't exist
    await initializeUserChallenges(userId);
    return await updateChallengeProgress(userId, challengeType, incrementBy);
  }

  const data = docSnap.data();
  const newValue = data.currentValue + incrementBy;
  const isCompleted = newValue >= data.targetValue;

  await updateDoc(docRef, {
    currentValue: increment(incrementBy),
    status: isCompleted ? 'completed' : 'active',
    updatedAt: Timestamp.now(),
  });

  const updated = await getDoc(docRef);
  const updatedData = updated.data();

  return {
    ...updatedData,
    id: updated.id,
    startDate: updatedData!.startDate.toDate(),
    endDate: updatedData!.endDate.toDate(),
    claimedAt: updatedData!.claimedAt?.toDate(),
    cooldownUntil: updatedData!.cooldownUntil?.toDate(),
    createdAt: updatedData!.createdAt.toDate(),
    updatedAt: updatedData!.updatedAt.toDate(),
  } as MonthlyChallenge;
}

/**
 * Claim challenge reward
 */
export async function claimChallengeReward(
  userId: string,
  challengeType: ChallengeType
): Promise<{ success: boolean; points: number; message: string }> {
  const { startDate, endDate } = getCurrentMonthRange();
  const challengeId = `${userId}_${challengeType}_${startDate.getFullYear()}_${startDate.getMonth()}`;

  const docRef = doc(db, COLLECTION_NAME, challengeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { success: false, points: 0, message: 'Challenge not found' };
  }

  const data = docSnap.data();

  // Check if already claimed
  if (data.status === 'claimed') {
    return { success: false, points: 0, message: 'Already claimed' };
  }

  // Check if on cooldown
  if (data.cooldownUntil) {
    const cooldownDate = data.cooldownUntil.toDate();
    if (new Date() < cooldownDate) {
      return { success: false, points: 0, message: 'On cooldown' };
    }
  }

  // Check if completed
  if (data.currentValue < data.targetValue) {
    return { success: false, points: 0, message: 'Challenge not completed yet' };
  }

  // Calculate cooldown (end of next month)
  const nextMonth = new Date(endDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const cooldownUntil = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0, 23, 59, 59);

  // Claim reward
  await updateDoc(docRef, {
    status: 'claimed',
    claimedAt: Timestamp.now(),
    cooldownUntil: Timestamp.fromDate(cooldownUntil),
    updatedAt: Timestamp.now(),
  });

  return {
    success: true,
    points: data.rewardPoints,
    message: `Claimed ${data.rewardPoints} points!`,
  };
}

/**
 * Get challenge definition
 */
export function getChallengeDefinition(type: ChallengeType): ChallengeDefinition | undefined {
  return MONTHLY_CHALLENGES.find((c) => c.type === type);
}
