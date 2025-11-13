/**
 * Monthly Challenges Types
 */

export type ChallengeType = 'bill_scan' | 'energy_reduction' | 'streak' | 'hazard_report';
export type ChallengeStatus = 'active' | 'completed' | 'claimed' | 'expired';

export interface MonthlyChallenge {
  id: string;
  userId: string;
  challengeType: ChallengeType;
  title: string;
  description: string;
  targetValue: number; // Number of bills to scan, days to streak, etc.
  currentValue: number;
  rewardPoints: number;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date; // End of the month
  claimedAt?: Date;
  cooldownUntil?: Date; // When user can claim again (next month)
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeDefinition {
  type: ChallengeType;
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  icon: string;
  color: string;
}

export const MONTHLY_CHALLENGES: ChallengeDefinition[] = [
  {
    type: 'bill_scan',
    title: 'Bill Decoder',
    description: 'Use the bill decoder once this month',
    targetValue: 1,
    rewardPoints: 100,
    icon: '📊',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    type: 'energy_reduction',
    title: 'Energy Saver',
    description: 'Reduce your consumption by 15% this month',
    targetValue: 15,
    rewardPoints: 1000,
    icon: '⚡',
    color: 'from-green-500 to-emerald-600',
  },
  {
    type: 'streak',
    title: 'Consistency Champion',
    description: 'Maintain a 30-day login streak',
    targetValue: 30,
    rewardPoints: 750,
    icon: '🔥',
    color: 'from-orange-500 to-red-600',
  },
  {
    type: 'hazard_report',
    title: 'Community Guardian',
    description: 'Report 3 electrical hazards this month',
    targetValue: 3,
    rewardPoints: 600,
    icon: '🛡️',
    color: 'from-purple-500 to-pink-600',
  },
];
