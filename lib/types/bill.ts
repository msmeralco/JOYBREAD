import { ParsedBillData } from '@/lib/agents/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SavedBill {
  id: string;
  userId: string;
  fileName: string;
  imageData: string; // base64 encoded image
  uploadedAt: number;
  parsedData: ParsedBillData;
  ocrConfidence: number;
  chatHistory: ChatMessage[];
  lastUpdated: number;
}

export interface BillUploadResponse {
  success: boolean;
  billId?: string;
  imageData?: string; // base64 encoded image
  parsedData?: ParsedBillData;
  ocrConfidence?: number;
  error?: string;
}

export interface BillListResponse {
  success: boolean;
  bills?: SavedBill[];
  error?: string;
}
