// Agent Communication Types
export interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: MessageType;
  data: any;
  timestamp: number;
  correlationId: string;
}

export enum AgentType {
  ORCHESTRATOR = 'ORCHESTRATOR',
  OCR = 'OCR',
  PARSER = 'PARSER',
  APPLIANCE_ANALYZER = 'APPLIANCE_ANALYZER',
  INSIGHTS = 'INSIGHTS',
  CONVERSATIONAL = 'CONVERSATIONAL',
  WHAT_IF = 'WHAT_IF',
  SUPERVISOR = 'SUPERVISOR',          // NEW: Intelligent router
  BILL_EXPLAINER = 'BILL_EXPLAINER',  // NEW: Bill terminology specialist
  VALIDATION = 'VALIDATION'            // NEW: Fact-checker
}

export enum MessageType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  STATUS = 'STATUS'
}

// Bill Data Types
export interface RawBillData {
  imageUrl?: string;
  imageBuffer?: Buffer;
  extractedText?: string;
}

export interface ParsedBillData {
  accountNumber?: string;
  accountName?: string;
  billingPeriod?: {
    from: string;
    to: string;
  };
  dueDate?: string;
  totalAmount?: number;
  currentCharges?: number;
  consumption?: {
    current: number;
    previous: number;
    kwh: number;
  };
  meterReading?: {
    current: number;
    previous: number;
  };
  // Detailed charge breakdown
  charges?: {
    generation?: number;
    transmission?: number;
    systemLoss?: number;
    distribution?: number;
    subsidies?: number;
    governmentTaxes?: number;
    universalCharges?: number;
    fitAll?: number;
    appliedCredits?: number;
    otherCharges?: number;
  };
  ratePerKwh?: number;
  rawText?: string;
  confidence?: number;
}

export interface ApplianceBreakdown {
  appliance: string;
  estimatedKwh: number;
  estimatedCost: number;
  percentage: number;
  category: ApplianceCategory;
  icon?: string;
}

export enum ApplianceCategory {
  COOLING = 'COOLING',
  LIGHTING = 'LIGHTING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  KITCHEN = 'KITCHEN',
  LAUNDRY = 'LAUNDRY',
  OTHER = 'OTHER'
}

export interface ApplianceProfile {
  name: string;
  category: ApplianceCategory;
  averageWattage: number;
  averageHoursPerDay: number;
  icon?: string;
}

export interface EnergyInsights {
  comparisonToPrevious?: {
    percentageChange: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    message: string;
  };
  topConsumers: ApplianceBreakdown[];
  recommendations: EnergyRecommendation[];
  kilosScore?: number; // Gamification score
  achievementBadges?: string[];
}

export interface EnergyRecommendation {
  title: string;
  description: string;
  potentialSavings: number; // in pesos
  difficulty: 'easy' | 'medium' | 'hard';
  category: ApplianceCategory;
  priority: number;
}

export interface BillDecoderResult {
  success: boolean;
  parsedData?: ParsedBillData;
  applianceBreakdown?: ApplianceBreakdown[];
  insights?: EnergyInsights;
  error?: string;
  processingTime?: number;
  agentLogs?: AgentLog[];
}

export interface AgentLog {
  agent: AgentType;
  action: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  details?: any;
}

// Base Agent Interface
export interface IAgent {
  type: AgentType;
  process(message: AgentMessage): Promise<AgentMessage>;
  getStatus(): AgentStatus;
}

export interface AgentStatus {
  type: AgentType;
  state: 'idle' | 'processing' | 'error';
  lastProcessed?: number;
  errorCount?: number;
}

// DOE Appliance Profiles (Philippine context)
export const DOE_APPLIANCE_PROFILES: ApplianceProfile[] = [
  {
    name: 'Air Conditioner (1.5HP)',
    category: ApplianceCategory.COOLING,
    averageWattage: 1200,
    averageHoursPerDay: 8,
    icon: '❄️'
  },
  {
    name: 'Refrigerator',
    category: ApplianceCategory.KITCHEN,
    averageWattage: 150,
    averageHoursPerDay: 24,
    icon: '🧊'
  },
  {
    name: 'Electric Fan',
    category: ApplianceCategory.COOLING,
    averageWattage: 75,
    averageHoursPerDay: 12,
    icon: '🌀'
  },
  {
    name: 'LED Bulbs (5 bulbs)',
    category: ApplianceCategory.LIGHTING,
    averageWattage: 50,
    averageHoursPerDay: 6,
    icon: '💡'
  },
  {
    name: 'Television',
    category: ApplianceCategory.ENTERTAINMENT,
    averageWattage: 100,
    averageHoursPerDay: 6,
    icon: '📺'
  },
  {
    name: 'Washing Machine',
    category: ApplianceCategory.LAUNDRY,
    averageWattage: 500,
    averageHoursPerDay: 1,
    icon: '🧺'
  },
  {
    name: 'Rice Cooker',
    category: ApplianceCategory.KITCHEN,
    averageWattage: 400,
    averageHoursPerDay: 2,
    icon: '🍚'
  },
  {
    name: 'Water Heater',
    category: ApplianceCategory.OTHER,
    averageWattage: 2000,
    averageHoursPerDay: 0.5,
    icon: '🚿'
  },
  {
    name: 'Computer/Laptop',
    category: ApplianceCategory.ENTERTAINMENT,
    averageWattage: 200,
    averageHoursPerDay: 6,
    icon: '💻'
  },
  {
    name: 'Microwave',
    category: ApplianceCategory.KITCHEN,
    averageWattage: 1000,
    averageHoursPerDay: 0.5,
    icon: '🍽️'
  }
];
