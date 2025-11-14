/**
 * Peak Shift Challenge Service
 * Real-time monitoring of kWh usage during peak hours
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { PeakShiftSession } from '@/lib/types/challenges';
import { updateChallengeProgress } from './challenges';

const COLLECTION_NAME = 'peak_shift_sessions';
const POINTS_PER_MINUTE = 5; // 5 points per minute of successful peak shift
const KWH_THRESHOLD = 0.5; // Max 0.5 kWh increase allowed during session

/**
 * Start a new Peak Shift session
 */
export async function startPeakShiftSession(
  userId: string,
  baselineKwh: number
): Promise<{ success: boolean; session?: PeakShiftSession; message: string }> {
  try {
    // Check if user already has an active session
    const activeSession = await getActivePeakShiftSession(userId);
    if (activeSession) {
      return {
        success: false,
        message: 'You already have an active Peak Shift session',
      };
    }

    const sessionId = `${userId}_${Date.now()}`;
    const now = new Date();

    const session: PeakShiftSession = {
      id: sessionId,
      userId,
      startTime: now,
      targetDuration: 60, // 1 hour
      currentDuration: 0,
      pointsEarned: 0,
      violations: 0,
      isActive: true,
      baselineKwh,
      kwhThreshold: KWH_THRESHOLD,
      lastKwhReading: baselineKwh,
      warnings: [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTION_NAME, sessionId), {
      ...session,
      startTime: Timestamp.fromDate(session.startTime),
      createdAt: Timestamp.fromDate(session.createdAt),
      updatedAt: Timestamp.fromDate(session.updatedAt),
    });

    return {
      success: true,
      session,
      message: 'Peak Shift session started! Keep your usage low to earn points.',
    };
  } catch (error) {
    console.error('Error starting Peak Shift session:', error);
    return {
      success: false,
      message: 'Failed to start session',
    };
  }
}

/**
 * Update kWh reading during active session
 */
export async function updateKwhReading(
  userId: string,
  currentKwh: number
): Promise<{
  success: boolean;
  warning?: string;
  pointsEarned?: number;
  shouldStop?: boolean;
  session?: PeakShiftSession;
}> {
  try {
    const activeSession = await getActivePeakShiftSession(userId);
    if (!activeSession) {
      return {
        success: false,
        warning: 'No active session found',
      };
    }

    const sessionRef = doc(db, COLLECTION_NAME, activeSession.id);
    const now = new Date();
    const elapsedMinutes = Math.floor(
      (now.getTime() - activeSession.startTime.getTime()) / 1000 / 60
    );

    // Check if target duration reached
    if (elapsedMinutes >= activeSession.targetDuration) {
      return await endPeakShiftSession(userId, true);
    }

    const kwhIncrease = currentKwh - activeSession.baselineKwh;

    // Check if usage exceeded threshold
    if (kwhIncrease > activeSession.kwhThreshold) {
      const violation = activeSession.violations + 1;
      const warning = {
        timestamp: now,
        kwhReading: currentKwh,
        message: `⚠️ High usage detected! Turn off devices. (${kwhIncrease.toFixed(2)} kWh above baseline)`,
      };

      await updateDoc(sessionRef, {
        violations: increment(1),
        lastKwhReading: currentKwh,
        warnings: [
          ...activeSession.warnings.map((w) => ({
            timestamp: Timestamp.fromDate(w.timestamp),
            kwhReading: w.kwhReading,
            message: w.message,
          })),
          {
            timestamp: Timestamp.fromDate(warning.timestamp),
            kwhReading: warning.kwhReading,
            message: warning.message,
          },
        ],
        updatedAt: Timestamp.fromDate(now),
      });

      // Too many violations - stop session
      if (violation >= 3) {
        return await endPeakShiftSession(userId, false);
      }

      return {
        success: true,
        warning: warning.message,
        shouldStop: false,
        session: {
          ...activeSession,
          violations: violation,
          lastKwhReading: currentKwh,
          warnings: [...activeSession.warnings, warning],
        },
      };
    }

    // Usage is good - continue earning points
    const pointsForThisMinute = POINTS_PER_MINUTE * (elapsedMinutes - activeSession.currentDuration);
    const totalPoints = activeSession.pointsEarned + pointsForThisMinute;

    await updateDoc(sessionRef, {
      currentDuration: elapsedMinutes,
      pointsEarned: totalPoints,
      lastKwhReading: currentKwh,
      updatedAt: Timestamp.fromDate(now),
    });

    return {
      success: true,
      pointsEarned: totalPoints,
      session: {
        ...activeSession,
        currentDuration: elapsedMinutes,
        pointsEarned: totalPoints,
        lastKwhReading: currentKwh,
      },
    };
  } catch (error) {
    console.error('Error updating kWh reading:', error);
    return {
      success: false,
      warning: 'Failed to update reading',
    };
  }
}

/**
 * End Peak Shift session
 */
export async function endPeakShiftSession(
  userId: string,
  completed: boolean
): Promise<{
  success: boolean;
  message: string;
  pointsEarned?: number;
  session?: PeakShiftSession;
}> {
  try {
    const activeSession = await getActivePeakShiftSession(userId);
    if (!activeSession) {
      return {
        success: false,
        message: 'No active session found',
      };
    }

    const sessionRef = doc(db, COLLECTION_NAME, activeSession.id);
    const now = new Date();

    await updateDoc(sessionRef, {
      isActive: false,
      endTime: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    if (completed) {
      // Update monthly challenge progress
      await updateChallengeProgress(userId, 'peak_shift', 1);

      return {
        success: true,
        message: `🎉 Peak Shift completed! You earned ${activeSession.pointsEarned} points!`,
        pointsEarned: activeSession.pointsEarned,
        session: activeSession,
      };
    } else {
      return {
        success: false,
        message: '❌ Session ended due to high usage violations.',
        pointsEarned: 0,
        session: activeSession,
      };
    }
  } catch (error) {
    console.error('Error ending Peak Shift session:', error);
    return {
      success: false,
      message: 'Failed to end session',
    };
  }
}

/**
 * Get active Peak Shift session for user
 */
export async function getActivePeakShiftSession(
  userId: string
): Promise<PeakShiftSession | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: data.id,
      userId: data.userId,
      startTime: data.startTime.toDate(),
      endTime: data.endTime ? data.endTime.toDate() : undefined,
      targetDuration: data.targetDuration,
      currentDuration: data.currentDuration,
      pointsEarned: data.pointsEarned,
      violations: data.violations,
      isActive: data.isActive,
      baselineKwh: data.baselineKwh,
      kwhThreshold: data.kwhThreshold,
      lastKwhReading: data.lastKwhReading,
      warnings: data.warnings.map((w: any) => ({
        timestamp: w.timestamp.toDate(),
        kwhReading: w.kwhReading,
        message: w.message,
      })),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Get user's Peak Shift history
 */
export async function getUserPeakShiftHistory(
  userId: string,
  limit: number = 10
): Promise<PeakShiftSession[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const sessions: PeakShiftSession[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: data.id,
        userId: data.userId,
        startTime: data.startTime.toDate(),
        endTime: data.endTime ? data.endTime.toDate() : undefined,
        targetDuration: data.targetDuration,
        currentDuration: data.currentDuration,
        pointsEarned: data.pointsEarned,
        violations: data.violations,
        isActive: data.isActive,
        baselineKwh: data.baselineKwh,
        kwhThreshold: data.kwhThreshold,
        lastKwhReading: data.lastKwhReading,
        warnings: data.warnings.map((w: any) => ({
          timestamp: w.timestamp.toDate(),
          kwhReading: w.kwhReading,
          message: w.message,
        })),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    // Sort by most recent first
    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, limit);
  } catch (error) {
    console.error('Error getting Peak Shift history:', error);
    return [];
  }
}
