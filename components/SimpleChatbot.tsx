'use client';

import { useState, useRef, useEffect } from 'react';
import { BillDecoderResult } from '@/lib/agents/types';
import Tesseract from 'tesseract.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function SimpleChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm Ka-KILOS, your smart electricity assistant.\n\nI can help you:\n\n1️⃣ **Understand your bill** - Upload your Meralco bill and I'll explain WHY it's that amount\n\n2️⃣ **What-if questions** - Ask \"What if I buy an aircon?\" or \"What if I use it once a week?\"\n\nUpload your bill to get started! 📄",
      timestamp: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billData, setBillData] = useState<BillDecoderResult | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addMessage('user', `📎 Uploaded: ${file.name}`);
    setIsProcessing(true);

    try {
      addMessage('assistant', "🔍 Reading your bill...");

      // OCR
      const imageUrl = URL.createObjectURL(file);
      const worker = await Tesseract.createWorker('eng');
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);

      addMessage('assistant', `✅ OCR complete (${data.confidence.toFixed(1)}% confidence)\n\n📊 Analyzing your bill...`);

      // Analyze
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: data.text,
          ocrConfidence: data.confidence
        }),
      });

      const result: BillDecoderResult = await response.json();

      if (result.success && result.parsedData) {
        setBillData(result);
        
        const consumption = result.parsedData.consumption?.kwh || 0;
        const amount = result.parsedData.totalAmount || 0;
        
        addMessage('assistant', `✅ Bill uploaded successfully!\n\n🤔 Let me explain your ₱${amount.toFixed(2)} bill...`);
        
        // Auto-generate detailed breakdown explanation
        setTimeout(async () => {
          try {
            console.log('[SimpleChatbot] Requesting bill explanation...');
            const chatResponse = await fetch('/api/chat-simple', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: "Explain my bill breakdown. Show me the detailed charges and where each peso comes from. Why is my total amount what it is?",
                billData: result.parsedData,
                sessionId
              })
            });
            
            console.log('[SimpleChatbot] Response status:', chatResponse.status);
            const chatResult = await chatResponse.json();
            console.log('[SimpleChatbot] Response:', chatResult);
            
            if (chatResult.success) {
              addMessage('assistant', chatResult.response);
              addMessage('assistant', "💬 You can now ask me:\n• \"What if I buy an aircon?\"\n• \"How can I reduce my bill?\"\n• \"What if I use my aircon only on weekends?\"");
            } else {
              console.error('[SimpleChatbot] API returned error:', chatResult.error);
              addMessage('assistant', `❌ Error: ${chatResult.error}`);
            }
          } catch (err) {
            console.error('Auto-explanation error:', err);
            addMessage('assistant', `❌ Failed to explain bill: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }, 1000);
      } else {
        addMessage('assistant', `❌ Sorry, I couldn't analyze your bill. ${result.error || 'Please try again with a clearer image.'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      addMessage('assistant', '❌ Error processing bill. Please try again.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage('user', userMessage);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          billData: billData?.parsedData || null,
          sessionId
        })
      });

      const result = await response.json();

      if (result.success) {
        addMessage('assistant', result.response);
      } else {
        addMessage('assistant', `❌ ${result.error || 'Something went wrong'}`);
      }
    } catch (err) {
      console.error('Chat error:', err);
      addMessage('assistant', '❌ Error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <h2 className="text-xl font-bold">Ka-KILOS</h2>
            <p className="text-sm opacity-90">Your personal energy savings coach</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="animate-spin text-2xl">⚙️</div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Upload bill image"
          >
            📎
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your energy bill..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          💬 Ask: "Why is my bill high?" • 🔮 Try: "What if I add an aircon?" • 📸 Or upload a bill
        </div>
      </div>
    </div>
  );
}
