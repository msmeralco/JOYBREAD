import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  email: string
  city: string
  barangay: string
  rank: number
  photoURL?: string
}

export interface HazardReport {
  id: string
  userId: string
  photoURL: string
  category: 'leaning-pole' | 'spaghetti-wires' | 'sparking-transformer' | 'vegetation'
  location: {
    lat: number
    lng: number
  }
  address: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: Date
  pointsAwarded: number
}

export interface BillData {
  id: string
  userId: string
  consumptionKwh: number
  estimatedCost: number
  billMonth: string
  breakdown: {
    appliance: string
    percentage: number
    kwh: number
  }[]
  tips: string[]
  scannedAt: Date
}

export interface ActivityLog {
  id: string
  type: 'bill-scan' | 'hazard-report' | 'reward-redeem' | 'challenge-complete'
  description: string
  points: number
  timestamp: Date
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  imageURL: string
  category: string
  available: boolean
}

interface AppState {
  user: User | null
  kilosPoints: number
  currentConsumption: number
  lastMonthConsumption: number
  estimatedCost: number
  hazardReports: HazardReport[]
  billHistory: BillData[]
  activityLogs: ActivityLog[]
  availableRewards: Reward[]
  
  // Actions
  setUser: (user: User | null) => void
  addKilosPoints: (points: number) => void
  deductKilosPoints: (points: number) => void
  setConsumptionData: (current: number, lastMonth: number, cost: number) => void
  addHazardReport: (report: HazardReport) => void
  addBillData: (bill: BillData) => void
  addActivityLog: (log: ActivityLog) => void
  redeemReward: (rewardId: string) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      kilosPoints: 2400,
      currentConsumption: 350,
      lastMonthConsumption: 368,
      estimatedCost: 7547.40,
      hazardReports: [],
      billHistory: [],
      activityLogs: [],
      availableRewards: [
        {
          id: '1',
          name: 'Meralco Bill Credit',
          description: '₱500 credit on your next bill',
          pointsCost: 5000,
          imageURL: '/rewards/meralco-credit.png',
          category: 'Bill Credit',
          available: true,
        },
        {
          id: '2',
          name: 'GCash Voucher',
          description: '₱200 GCash e-voucher',
          pointsCost: 2000,
          imageURL: '/rewards/gcash.png',
          category: 'E-Wallet',
          available: true,
        },
        {
          id: '3',
          name: 'Power Bank',
          description: 'High-capacity 20000mAh power bank',
          pointsCost: 8000,
          imageURL: '/rewards/powerbank.png',
          category: 'Gadget',
          available: true,
        },
      ],
      
      setUser: (user) => set({ user }),
      
      addKilosPoints: (points) => set((state) => ({
        kilosPoints: state.kilosPoints + points,
      })),
      
      deductKilosPoints: (points) => set((state) => ({
        kilosPoints: Math.max(0, state.kilosPoints - points),
      })),
      
      setConsumptionData: (current, lastMonth, cost) => set({
        currentConsumption: current,
        lastMonthConsumption: lastMonth,
        estimatedCost: cost,
      }),
      
      addHazardReport: (report) => set((state) => ({
        hazardReports: [report, ...state.hazardReports],
        kilosPoints: state.kilosPoints + report.pointsAwarded,
      })),
      
      addBillData: (bill) => set((state) => ({
        billHistory: [bill, ...state.billHistory],
        currentConsumption: bill.consumptionKwh,
        estimatedCost: bill.estimatedCost,
      })),
      
      addActivityLog: (log) => set((state) => ({
        activityLogs: [log, ...state.activityLogs],
      })),
      
      redeemReward: (rewardId) => set((state) => {
        const reward = state.availableRewards.find(r => r.id === rewardId)
        if (!reward || state.kilosPoints < reward.pointsCost) return state
        
        return {
          kilosPoints: state.kilosPoints - reward.pointsCost,
          activityLogs: [
            {
              id: Date.now().toString(),
              type: 'reward-redeem',
              description: `Redeemed ${reward.name}`,
              points: -reward.pointsCost,
              timestamp: new Date(),
            },
            ...state.activityLogs,
          ],
        }
      }),
      
      logout: () => set({
        user: null,
        kilosPoints: 0,
        hazardReports: [],
        billHistory: [],
        activityLogs: [],
      }),
    }),
    {
      name: 'kilos-app-storage',
    }
  )
)
