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
  barangayPoints?: number
}

export interface HazardComment {
  id: string
  reportId: string
  userId: string
  userName: string
  userPhoto?: string
  comment: string
  createdAt: Date
}

export interface HazardReport {
  id: string
  userId: string
  userName?: string
  userPhoto?: string
  photoURL: string
  category: 'leaning-pole' | 'spaghetti-wires' | 'sparking-transformer' | 'vegetation'
  hazardIntensity: 'urgent' | 'moderate' | 'normal'
  location: {
    lat: number
    lng: number
  }
  address: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: Date
  pointsAwarded: number
  comments?: HazardComment[]
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
  setHazardReports: (reports: HazardReport[]) => void
  addCommentToReport: (reportId: string, comment: HazardComment) => void
  updateReportComments: (reportId: string, comments: HazardComment[]) => void
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
      hazardReports: [
        // Mock data for testing heatmap and community features - remove in production
        {
          id: 'hazard-001',
          userId: 'user-001',
          userName: 'Juan Dela Cruz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'urgent',
          location: { lat: 14.5995, lng: 120.9842 },
          address: '123 Ortigas Ave, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-10T08:30:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-001',
              reportId: 'hazard-001',
              userId: 'user-002',
              userName: 'Maria Santos',
              comment: 'I can confirm this! The transformer has been sparking for 2 days now. Very dangerous!',
              createdAt: new Date('2025-11-10T14:20:00')
            },
            {
              id: 'comment-002',
              reportId: 'hazard-001',
              userId: 'user-003',
              userName: 'Roberto Garcia',
              comment: 'I live nearby. Heard loud popping sounds last night. Please fix ASAP!',
              createdAt: new Date('2025-11-11T09:15:00')
            },
            {
              id: 'comment-003',
              reportId: 'hazard-001',
              userId: 'user-004',
              userName: 'Elena Rodriguez',
              comment: 'Called Meralco hotline. They said they will send a team tomorrow.',
              createdAt: new Date('2025-11-12T16:45:00')
            }
          ]
        },
        {
          id: 'hazard-002',
          userId: 'user-005',
          userName: 'Pedro Reyes',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'urgent',
          location: { lat: 14.6042, lng: 120.9822 },
          address: '456 Shaw Blvd, Mandaluyong',
          status: 'in-progress',
          createdAt: new Date('2025-11-09T10:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-004',
              reportId: 'hazard-002',
              userId: 'user-006',
              userName: 'Carmen Lopez',
              comment: 'This pole is leaning more every day! About 30 degrees now.',
              createdAt: new Date('2025-11-09T15:30:00')
            },
            {
              id: 'comment-005',
              reportId: 'hazard-002',
              userId: 'user-007',
              userName: 'Diego Fernandez',
              comment: 'Meralco crew was here this morning. They are securing it with cables.',
              createdAt: new Date('2025-11-13T11:00:00')
            }
          ]
        },
        {
          id: 'hazard-003',
          userId: 'user-008',
          userName: 'Ana Garcia',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'moderate',
          location: { lat: 14.5950, lng: 120.9900 },
          address: '789 EDSA, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-11T14:30:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-006',
              reportId: 'hazard-003',
              userId: 'user-009',
              userName: 'Luis Martinez',
              comment: 'Wires are so tangled here. Looks like a fire hazard waiting to happen.',
              createdAt: new Date('2025-11-12T08:20:00')
            }
          ]
        },
        {
          id: 'hazard-004',
          userId: 'user-010',
          userName: 'Carlos Mendoza',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'moderate',
          location: { lat: 14.6020, lng: 120.9880 },
          address: 'Meralco Ave, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-08T16:00:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-007',
              reportId: 'hazard-004',
              userId: 'user-011',
              userName: 'Sofia Ramos',
              comment: 'Tree branches touching the power lines. Need trimming before rainy season.',
              createdAt: new Date('2025-11-09T09:30:00')
            },
            {
              id: 'comment-008',
              reportId: 'hazard-004',
              userId: 'user-012',
              userName: 'Miguel Torres',
              comment: 'I reported this to the barangay. They will coordinate with Meralco.',
              createdAt: new Date('2025-11-10T13:15:00')
            }
          ]
        },
        {
          id: 'hazard-005',
          userId: 'user-013',
          userName: 'Isabella Cruz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'urgent',
          location: { lat: 14.5970, lng: 120.9860 },
          address: '234 C5 Road, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-13T07:15:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-009',
              reportId: 'hazard-005',
              userId: 'user-014',
              userName: 'Gabriel Santos',
              comment: 'Saw sparks flying this morning! Everyone please stay away from this area.',
              createdAt: new Date('2025-11-13T09:45:00')
            }
          ]
        },
        {
          id: 'hazard-006',
          userId: 'user-015',
          userName: 'Lucia Diaz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'moderate',
          location: { lat: 14.6000, lng: 120.9910 },
          address: '567 Julia Vargas Ave, Pasig',
          status: 'pending',
          createdAt: new Date('2025-11-12T11:00:00'),
          pointsAwarded: 100,
          comments: []
        },
        {
          id: 'hazard-007',
          userId: 'user-016',
          userName: 'Fernando Aquino',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'normal',
          location: { lat: 14.6050, lng: 120.9800 },
          address: '890 Boni Ave, Mandaluyong',
          status: 'resolved',
          createdAt: new Date('2025-11-07T10:30:00'),
          pointsAwarded: 75,
          comments: [
            {
              id: 'comment-010',
              reportId: 'hazard-007',
              userId: 'user-017',
              userName: 'Patricia Reyes',
              comment: 'Good news! The tree trimming crew came yesterday and cleared the area.',
              createdAt: new Date('2025-11-12T14:00:00')
            }
          ]
        },
        {
          id: 'hazard-008',
          userId: 'user-018',
          userName: 'Antonio Lopez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'moderate',
          location: { lat: 14.5985, lng: 120.9890 },
          address: '321 Pioneer St, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-11T15:45:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-011',
              reportId: 'hazard-008',
              userId: 'user-019',
              userName: 'Rosa Martinez',
              comment: 'Noticed this after the typhoon last week. Definitely needs inspection.',
              createdAt: new Date('2025-11-12T10:20:00')
            }
          ]
        },
        {
          id: 'hazard-009',
          userId: 'user-020',
          userName: 'Ricardo Mendez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'normal',
          location: { lat: 14.6030, lng: 120.9850 },
          address: '654 San Miguel Ave, Pasig',
          status: 'pending',
          createdAt: new Date('2025-11-13T13:00:00'),
          pointsAwarded: 75,
          comments: []
        },
        {
          id: 'hazard-010',
          userId: 'user-021',
          userName: 'Valentina Gomez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'normal',
          location: { lat: 14.6010, lng: 120.9920 },
          address: '987 ADB Ave, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-13T16:30:00'),
          pointsAwarded: 75,
          comments: [
            {
              id: 'comment-012',
              reportId: 'hazard-010',
              userId: 'user-022',
              userName: 'Eduardo Silva',
              comment: 'Minor issue but better to report early. Some vines growing on the pole.',
              createdAt: new Date('2025-11-14T08:00:00')
            }
          ]
        },
        {
          id: 'hazard-011',
          userId: 'user-023',
          userName: 'Camila Navarro',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'urgent',
          location: { lat: 14.5960, lng: 120.9870 },
          address: '147 Capitol Commons, Pasig',
          status: 'pending',
          createdAt: new Date('2025-11-13T18:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-013',
              reportId: 'hazard-011',
              userId: 'user-024',
              userName: 'Javier Castillo',
              comment: 'This is really bad! Pole is at a 45-degree angle. Danger to pedestrians!',
              createdAt: new Date('2025-11-14T07:30:00')
            },
            {
              id: 'comment-014',
              reportId: 'hazard-011',
              userId: 'user-025',
              userName: 'Beatriz Flores',
              comment: 'Already called emergency hotline. Stay safe everyone!',
              createdAt: new Date('2025-11-14T08:15:00')
            }
          ]
        },
        {
          id: 'hazard-012',
          userId: 'user-026',
          userName: 'Alejandro Ruiz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'moderate',
          location: { lat: 14.6005, lng: 120.9895 },
          address: '258 Rosario St, Pasig City',
          status: 'pending',
          createdAt: new Date('2025-11-12T20:00:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-015',
              reportId: 'hazard-012',
              userId: 'user-027',
              userName: 'Daniela Ortiz',
              comment: 'Heard buzzing sounds from the transformer. Should be checked.',
              createdAt: new Date('2025-11-13T12:00:00')
            }
          ]
        },
        // Additional mock data for better visibility
        {
          id: 'hazard-013',
          userId: 'user-028',
          userName: 'Marco Santos',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'urgent',
          location: { lat: 14.5500, lng: 121.0200 },
          address: 'BGC, Taguig City',
          status: 'pending',
          createdAt: new Date('2025-11-13T09:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-016',
              reportId: 'hazard-013',
              userId: 'user-029',
              userName: 'Sarah Lee',
              comment: 'Very dangerous! Near a busy intersection.',
              createdAt: new Date('2025-11-14T10:00:00')
            }
          ]
        },
        {
          id: 'hazard-014',
          userId: 'user-030',
          userName: 'Jose Velasco',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'moderate',
          location: { lat: 14.5400, lng: 121.0100 },
          address: 'Market Market, Taguig',
          status: 'pending',
          createdAt: new Date('2025-11-12T15:00:00'),
          pointsAwarded: 100,
          comments: []
        },
        {
          id: 'hazard-015',
          userId: 'user-031',
          userName: 'Angela Cruz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'urgent',
          location: { lat: 14.6500, lng: 121.0500 },
          address: 'Quezon City Circle',
          status: 'pending',
          createdAt: new Date('2025-11-11T08:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-017',
              reportId: 'hazard-015',
              userId: 'user-032',
              userName: 'Ramon Diaz',
              comment: 'Sparks every night! Very scary for residents.',
              createdAt: new Date('2025-11-12T07:00:00')
            },
            {
              id: 'comment-018',
              reportId: 'hazard-015',
              userId: 'user-033',
              userName: 'Linda Torres',
              comment: 'Meralco scheduled for Nov 15 inspection.',
              createdAt: new Date('2025-11-13T14:00:00')
            }
          ]
        },
        {
          id: 'hazard-016',
          userId: 'user-034',
          userName: 'Victor Reyes',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'normal',
          location: { lat: 14.6200, lng: 121.0300 },
          address: 'Katipunan Ave, QC',
          status: 'pending',
          createdAt: new Date('2025-11-10T11:00:00'),
          pointsAwarded: 75,
          comments: [
            {
              id: 'comment-019',
              reportId: 'hazard-016',
              userId: 'user-035',
              userName: 'Grace Mendoza',
              comment: 'Trees need trimming before typhoon season.',
              createdAt: new Date('2025-11-11T09:00:00')
            }
          ]
        },
        {
          id: 'hazard-017',
          userId: 'user-036',
          userName: 'Henry Gomez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'moderate',
          location: { lat: 14.5700, lng: 121.0000 },
          address: 'Rockwell, Makati',
          status: 'in-progress',
          createdAt: new Date('2025-11-09T16:00:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-020',
              reportId: 'hazard-017',
              userId: 'user-037',
              userName: 'Melissa Aquino',
              comment: 'Crew arrived this morning!',
              createdAt: new Date('2025-11-14T08:30:00')
            }
          ]
        },
        {
          id: 'hazard-018',
          userId: 'user-038',
          userName: 'Pablo Rivera',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'urgent',
          location: { lat: 14.5550, lng: 120.9950 },
          address: 'Guadalupe, Makati',
          status: 'pending',
          createdAt: new Date('2025-11-13T12:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-021',
              reportId: 'hazard-018',
              userId: 'user-039',
              userName: 'Nina Garcia',
              comment: 'Super tangled! Fire hazard for sure.',
              createdAt: new Date('2025-11-13T18:00:00')
            },
            {
              id: 'comment-022',
              reportId: 'hazard-018',
              userId: 'user-040',
              userName: 'Oscar Lopez',
              comment: 'Called 16211. Reference number: HZ-2025-1234',
              createdAt: new Date('2025-11-14T09:00:00')
            }
          ]
        },
        {
          id: 'hazard-019',
          userId: 'user-041',
          userName: 'Rita Morales',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'moderate',
          location: { lat: 14.6100, lng: 121.0200 },
          address: 'Cubao, Quezon City',
          status: 'pending',
          createdAt: new Date('2025-11-12T07:30:00'),
          pointsAwarded: 100,
          comments: []
        },
        {
          id: 'hazard-020',
          userId: 'user-042',
          userName: 'Samuel Tan',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'normal',
          location: { lat: 14.5800, lng: 121.0400 },
          address: 'Ortigas Center, Pasig',
          status: 'resolved',
          createdAt: new Date('2025-11-08T10:00:00'),
          pointsAwarded: 75,
          comments: [
            {
              id: 'comment-023',
              reportId: 'hazard-020',
              userId: 'user-043',
              userName: 'Tina Ramos',
              comment: 'All cleared! Trees trimmed yesterday.',
              createdAt: new Date('2025-11-13T16:00:00')
            }
          ]
        },
        {
          id: 'hazard-021',
          userId: 'user-044',
          userName: 'Ulysses Cruz',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'urgent',
          location: { lat: 14.5900, lng: 120.9750 },
          address: 'Malate, Manila',
          status: 'pending',
          createdAt: new Date('2025-11-14T06:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-024',
              reportId: 'hazard-021',
              userId: 'user-045',
              userName: 'Vera Santos',
              comment: 'Just reported! Pole almost falling down!',
              createdAt: new Date('2025-11-14T07:00:00')
            }
          ]
        },
        {
          id: 'hazard-022',
          userId: 'user-046',
          userName: 'Walter Perez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'spaghetti-wires',
          hazardIntensity: 'moderate',
          location: { lat: 14.6300, lng: 121.0100 },
          address: 'Timog Ave, QC',
          status: 'pending',
          createdAt: new Date('2025-11-13T14:00:00'),
          pointsAwarded: 100,
          comments: []
        },
        {
          id: 'hazard-023',
          userId: 'user-047',
          userName: 'Ximena Torres',
          photoURL: '/placeholder-hazard.jpg',
          category: 'sparking-transformer',
          hazardIntensity: 'urgent',
          location: { lat: 14.5600, lng: 121.0150 },
          address: 'Forbes Park, Makati',
          status: 'pending',
          createdAt: new Date('2025-11-13T20:00:00'),
          pointsAwarded: 150,
          comments: [
            {
              id: 'comment-025',
              reportId: 'hazard-023',
              userId: 'user-048',
              userName: 'Yolanda Diaz',
              comment: 'Loud buzzing and sparks! Emergency!',
              createdAt: new Date('2025-11-14T06:30:00')
            }
          ]
        },
        {
          id: 'hazard-024',
          userId: 'user-049',
          userName: 'Zeus Fernandez',
          photoURL: '/placeholder-hazard.jpg',
          category: 'vegetation',
          hazardIntensity: 'moderate',
          location: { lat: 14.6400, lng: 121.0400 },
          address: 'Commonwealth Ave, QC',
          status: 'pending',
          createdAt: new Date('2025-11-11T13:00:00'),
          pointsAwarded: 100,
          comments: [
            {
              id: 'comment-026',
              reportId: 'hazard-024',
              userId: 'user-050',
              userName: 'Anna Reyes',
              comment: 'Bamboo growing too close to wires.',
              createdAt: new Date('2025-11-12T11:00:00')
            }
          ]
        },
        {
          id: 'hazard-025',
          userId: 'user-051',
          userName: 'Benjamin Sy',
          photoURL: '/placeholder-hazard.jpg',
          category: 'leaning-pole',
          hazardIntensity: 'normal',
          location: { lat: 14.5450, lng: 121.0050 },
          address: 'Venice Piazza, Taguig',
          status: 'pending',
          createdAt: new Date('2025-11-14T11:00:00'),
          pointsAwarded: 75,
          comments: []
        },
      ],
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
        user: state.user ? {
          ...state.user,
          barangayPoints: (state.user.barangayPoints || 0) + points,
        } : null,
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
      
      setHazardReports: (reports) => set({ hazardReports: reports }),
      
      addCommentToReport: (reportId, comment) => set((state) => ({
        hazardReports: state.hazardReports.map(report => 
          report.id === reportId 
            ? { ...report, comments: [...(report.comments || []), comment] }
            : report
        ),
      })),
      
      updateReportComments: (reportId, comments) => set((state) => ({
        hazardReports: state.hazardReports.map(report =>
          report.id === reportId
            ? { ...report, comments }
            : report
        ),
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
