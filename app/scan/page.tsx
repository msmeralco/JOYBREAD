'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateChallengeProgress } from '@/lib/services/challenges';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ArrowLeft, History, Zap, Send, Loader2, X, FileText, Calendar, Trash2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage, SavedBill } from '@/lib/types/bill';
import { db } from '@/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, query, where, getDocs, getDoc, deleteDoc } from 'firebase/firestore';

type ViewState = 'upload' | 'processing' | 'chat' | 'history';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [currentBill, setCurrentBill] = useState<SavedBill | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [historyBills, setHistoryBills] = useState<any[]>([]);  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Load existing bill if billId in URL
  useEffect(() => {
    const billId = searchParams.get('billId');
    if (billId && user) {
      loadExistingBill(billId);
    }
  }, [searchParams, user]);

  const loadExistingBill = async (billId: string) => {
    if (!user) return;
    
    try {
      console.log(`[Load Bill] Fetching bill ${billId} from Firestore...`);
      const billRef = doc(db, 'bills', billId);
      const billSnap = await getDoc(billRef);

      if (billSnap.exists() && billSnap.data().userId === user.uid) {
        const billData: any = {
          id: billSnap.id,
          ...billSnap.data(),
          uploadedAt: billSnap.data().uploadedAt?.toMillis?.() || Date.now(),
          lastUpdated: billSnap.data().lastUpdated?.toMillis?.() || Date.now(),
        };
        
        setCurrentBill(billData as SavedBill);
        setPreview(billData.imageData);
        setMessages(billData.chatHistory || []);
        setViewState('chat');
        console.log('[Load Bill] Bill loaded successfully');
      } else {
        console.error('[Load Bill] Bill not found or unauthorized');
        alert('Could not load bill');
      }
    } catch (error) {
      console.error('[Load Bill] Error:', error);
      alert('Error loading bill');
    }
  };

  // Compress image to stay under Firestore 1MB limit
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px width)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with quality adjustment to stay under 800KB
          let quality = 0.7;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, reduce quality further
          while (compressedDataUrl.length > 800000 && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          console.log(`[Compress] Original: ${file.size} bytes, Compressed: ${compressedDataUrl.length} bytes`);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file || !user) return;

    setViewState('processing');
    setUploadProgress('📸 Reading your bill...');

    try {
      // Compress and convert image to base64
      const compressedImage = await compressImage(file);
      setPreview(compressedImage);

      setUploadProgress('🔍 Scanning text with OCR...');

      // Perform OCR on client side
      const Tesseract = (await import('tesseract.js')).default;
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setUploadProgress(`🔍 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      const { data } = await worker.recognize(file);
      await worker.terminate();

      setUploadProgress(`✅ OCR Complete (${data.confidence.toFixed(0)}% confidence)`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress('📊 Analyzing your bill data...');

      // Send to API for analysis only
      const response = await fetch('/api/bills/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extractedText: data.text,
          ocrConfidence: data.confidence
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress('💾 Saving to your account...');

      // Verify user is authenticated
      if (!user || !user.uid) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('[Bill Upload] User authenticated:', user.uid);
      console.log('[Bill Upload] Saving to Firestore...');

      // Save to Firestore on client-side (where user is authenticated)
      const billDoc = await addDoc(collection(db, 'bills'), {
        userId: user.uid,
        fileName: file.name,
        imageData: compressedImage,
        uploadedAt: serverTimestamp(),
        parsedData: result.parsedData,
        ocrConfidence: result.ocrConfidence,
        chatHistory: [],
        lastUpdated: serverTimestamp(),
      });

      console.log(`[Bill Upload] Bill saved with ID: ${billDoc.id}`);

      // Update monthly challenge progress
      try {
        await updateChallengeProgress(user.uid, 'bill_scan', 1);
      } catch (error) {
        console.error('Error updating challenge progress:', error);
      }

      // Set bill data
      setCurrentBill({
        id: billDoc.id,
        userId: user.uid,
        fileName: file.name,
        imageData: compressedImage,
        uploadedAt: Date.now(),
        parsedData: result.parsedData,
        ocrConfidence: result.ocrConfidence,
        chatHistory: [],
        lastUpdated: Date.now(),
      });

      setUploadProgress('💬 Starting chat with Ka-KILOS...');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize chatbot
      const welcomeMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `👋 Hi! I'm Ka-KILOS, your electricity bill assistant.\n\nI can see you've uploaded your bill. Let me explain it for you! 📊`,
        timestamp: Date.now()
      };
      
      setMessages([welcomeMsg]);
      setViewState('chat');

      // Auto-explain bill
      setTimeout(() => {
        autoExplainBill(billDoc.id, result.parsedData);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setViewState('upload');
      setUploadProgress('');
      alert(error instanceof Error ? error.message : 'Failed to upload bill');
    }
  };

  const autoExplainBill = async (billId: string, billData: any) => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "Explain my bill breakdown. Show me the detailed charges and where each peso comes from. Why is my total amount what it is?",
          billData,
          sessionId,
          billId,
          userId: user!.uid,
          saveToFirestore: true,
        })
      });

      const result = await response.json();

      if (result.success) {
        addMessage('assistant', result.response);
      }
    } catch (error) {
      console.error('Auto-explain error:', error);
      addMessage('assistant', '❌ Sorry, I had trouble analyzing your bill. Please try asking a question!');
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = async (role: 'user' | 'assistant', content: string): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);

    // Save to Firestore if we have a current bill
    if (currentBill?.id && user?.uid) {
      try {
        const billRef = doc(db, 'bills', currentBill.id);
        await updateDoc(billRef, {
          chatHistory: arrayUnion(newMessage),
          lastUpdated: serverTimestamp(),
        });
        console.log('[Chat] Message saved to Firestore');
      } catch (error) {
        console.error('[Chat] Error saving message:', error);
        // Don't block UI if save fails
      }
    }

    return newMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing || !currentBill || !user) return;

    const userQuery = input.trim();
    setInput('');
    addMessage('user', userQuery);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          billData: currentBill.parsedData,
          sessionId,
          billId: currentBill.id,
          userId: user.uid,
          saveToFirestore: true,
        })
      });

      const result = await response.json();

      if (result.success) {
        addMessage('assistant', result.response);
      } else {
        addMessage('assistant', '❌ Sorry, I encountered an error. Please try again!');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', '❌ Connection error. Please check your internet!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewBill = () => {
    setCurrentBill(null);
    setPreview(null);
    setMessages([]);
    setViewState('upload');
    router.push('/scan');
  };

  const handleViewHistory = async () => {
    if (!user) return;
    
    try {
      console.log('[History] Fetching bills from Firestore...');
      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef,
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      let bills = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toMillis?.() || Date.now(),
        lastUpdated: doc.data().lastUpdated?.toMillis?.() || Date.now(),
      }));

      // Sort client-side instead of using Firestore orderBy (which requires index)
      bills = bills.sort((a: any, b: any) => b.uploadedAt - a.uploadedAt);

      console.log(`[History] Found ${bills.length} bills`);
      
      setHistoryBills(bills);
      setViewState('history');
    } catch (error) {
      console.error('[History] Error:', error);
      alert('Failed to load history');
    }
  };

  const handleSelectBill = (billId: string) => {
    loadExistingBill(billId);
  };

  const handleDeleteBill = async (billId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm('Delete this bill and all chat history?')) return;
    
    try {
      const billRef = doc(db, 'bills', billId);
      await deleteDoc(billRef);
      
      // Refresh history
      setHistoryBills(prev => prev.filter(b => b.id !== billId));
      console.log(`[Delete] Bill ${billId} deleted`);
    } catch (error) {
      console.error('[Delete] Error:', error);
      alert('Failed to delete bill');
    }
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen pb-20 ${viewState === 'upload' ? 'bg-black' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50'}`}>
      <AnimatePresence mode="wait">
        {/* Upload View */}
        {viewState === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 pt-12 pb-8 px-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewHistory}
                  className="text-white hover:bg-white/20"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Bill Decoder</h1>
                  <p className="text-white/80 text-sm mt-1">
                    Upload your bill and chat with Ka-KILOS
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="px-6 py-8">
              <Card className="shadow-lg bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      className="h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    >
                      <Camera className="w-12 h-12" />
                      <span className="font-medium">Take Photo</span>
                    </Button>

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                    >
                      <Upload className="w-12 h-12" />
                      <span className="font-medium">Upload File</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="font-bold text-purple-400 mt-0.5">1.</span>
                      <p>Take a clear photo of your entire electricity bill</p>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="font-bold text-purple-400 mt-0.5">2.</span>
                      <p>We'll scan and extract all the important details</p>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="font-bold text-purple-400 mt-0.5">3.</span>
                      <p>Chat with Ka-KILOS to understand your bill better!</p>
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-center text-gray-500">
                    Supported: JPG, PNG • Max 10MB
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Processing View */}
        {viewState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6"
          >
            {preview && (
              <Card className="w-full max-w-md mb-6">
                <img
                  src={preview}
                  alt="Bill preview"
                  className="w-full h-auto rounded-lg"
                />
              </Card>
            )}
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <Zap className="w-16 h-16 text-purple-600" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Your Bill</h3>
            <p className="text-gray-600 text-center max-w-sm">{uploadProgress}</p>
          </motion.div>
        )}

        {/* Chat View */}
        {viewState === 'chat' && currentBill && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-screen"
          >
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewBill}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    New Bill
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewHistory}
                  >
                    <History className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-start gap-3">
                  <img
                    src={currentBill.imageData}
                    alt="Bill"
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900">
                      ₱{currentBill.parsedData.totalAmount?.toFixed(2) || '0.00'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentBill.parsedData.consumption?.kwh || 0} kWh consumed
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentBill.parsedData.billingPeriod?.from || 'N/A'} - {currentBill.parsedData.billingPeriod?.to || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <Card className="bg-white">
                    <CardContent className="p-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-4 pb-6">
              <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your bill..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInput("What if I buy an aircon?")}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                  disabled={isProcessing}
                >
                  💨 What if I buy an aircon?
                </button>
                <button
                  onClick={() => setInput("How can I reduce my bill?")}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                  disabled={isProcessing}
                >
                  💡 Tips to save
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* History View */}
        {viewState === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 pt-12 pb-8 px-6">
              <button
                onClick={() => setViewState('upload')}
                className="mb-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-3xl font-bold text-white mb-2">
                💬 Bill History
              </h1>
              <p className="text-purple-100">
                {historyBills.length} {historyBills.length === 1 ? 'bill' : 'bills'} saved
              </p>
            </div>

            {/* Bills List */}
            <div className="px-4 py-6 space-y-3 pb-24">
              {historyBills.length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No bills yet</p>
                    <p className="text-sm text-gray-400">Upload your first bill to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                historyBills.map((bill: any) => (
                  <Card
                    key={bill.id}
                    className="bg-white border-gray-200 hover:border-purple-300 transition-all hover:shadow-md relative"
                  >
                    <CardContent className="p-4">
                      {/* Delete Button - Always visible on mobile */}
                      <button
                        onClick={(e) => handleDeleteBill(bill.id, e)}
                        className="absolute top-3 right-3 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full"
                        title="Delete bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-start gap-4 cursor-pointer pr-10" onClick={() => handleSelectBill(bill.id)}>
                        {/* Bill Preview Thumbnail */}
                        {bill.imageData && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={bill.imageData}
                              alt="Bill"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Bill Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                ₱{bill.parsedData?.totalAmount?.toFixed(2) || '0.00'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {typeof bill.parsedData?.consumption === 'object' 
                                  ? (bill.parsedData?.consumption?.kwh || bill.parsedData?.consumption?.current || 0)
                                  : (bill.parsedData?.consumption || 0)} kWh
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(bill.uploadedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Messages Count */}
                          {bill.chatHistory?.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-purple-600">
                              <Zap className="w-3 h-3" />
                              <span>{bill.chatHistory.length} messages</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
