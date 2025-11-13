import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Conversation memory per session
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const conversationStore = new Map<string, ConversationTurn[]>();

export async function POST(request: NextRequest) {
  try {
    const { query, billData, sessionId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Simple Chat] Processing: "${query}"`);

    // Get conversation history
    const currentSessionId = sessionId || 'default';
    const conversationHistory = conversationStore.get(currentSessionId) || [];

    // Initialize OpenRouter with Qwen
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[Simple Chat] No OpenRouter API key found in .env');
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Simple Chat] Using Qwen 2.5 72B Instruct (free)...');

    const openai = new OpenAI({ 
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1'
    });

    // Build context from bill data
    let billContext = '';
    if (billData) {
      billContext = `
USER'S ELECTRICITY BILL DATA:
- Consumption: ${billData.consumption?.kwh || 'N/A'} kWh (Previous: ${billData.consumption?.previous || 'N/A'} kWh)
- Total Amount: ₱${billData.totalAmount?.toFixed(2) || 'N/A'}
- Billing Period: ${billData.billingPeriod?.from || 'N/A'} to ${billData.billingPeriod?.to || 'N/A'}
${billData.charges ? `
DETAILED CHARGE BREAKDOWN:
${billData.charges.generation ? `- Generation Charge: ₱${billData.charges.generation.toFixed(2)}` : ''}
${billData.charges.transmission ? `- Transmission Charge: ₱${billData.charges.transmission.toFixed(2)}` : ''}
${billData.charges.distribution ? `- Distribution/Supply Charge: ₱${billData.charges.distribution.toFixed(2)}` : ''}
${billData.charges.systemLoss ? `- System Loss Charge: ₱${billData.charges.systemLoss.toFixed(2)}` : ''}
${billData.charges.subsidies ? `- Subsidies: ₱${billData.charges.subsidies.toFixed(2)}` : ''}
${billData.charges.taxes ? `- Taxes (VAT, etc.): ₱${billData.charges.taxes.toFixed(2)}` : ''}
${billData.charges.universalCharges ? `- Universal Charges: ₱${billData.charges.universalCharges.toFixed(2)}` : ''}
${billData.charges.fitAll ? `- FIT-All: ₱${billData.charges.fitAll.toFixed(2)}` : ''}
` : ''}
`;
    }

    // Build conversation context (last 5 turns)
    const recentConversation = conversationHistory.slice(-5).map(turn => 
      `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`
    ).join('\n');

    // Detect language
    const isFilipinoQuery = /\b(ano|bakit|paano|saan|kailan|gaano|magkano|kung|ng|sa|nang|mga|yung|yun|ka|mo|ko|tayo|kayo|sila|ba|na|pa|naman|lang|pala|kasi|kaya|grabe|sobra|taas|mura|mahal|tipid|kuryente|bill|meralco|kumusta|salamat|opo|hindi|oo|talaga)\b/i.test(query);
    const responseLanguage = isFilipinoQuery ? 'Filipino/Taglish (naturally mix Filipino and English)' : 'English (with occasional Taglish for warmth)';

    // Create intelligent prompt
    const systemPrompt = `You are Ka-KILOS, an intelligent electricity bill assistant for Filipino households. You help users understand their Meralco bills and answer "what-if" questions about appliances.

LANGUAGE: Respond in ${responseLanguage}. MATCH the user's language naturally.

YOUR TWO CORE FUNCTIONS:

1. **BILL EXPLANATION** - When user asks about their bill or you auto-explain:
   - Show the ACTUAL math breakdown of charges
   - Explain each charge type (Generation, Transmission, Distribution, etc.)
   - Add up all charges to show how they reach the total
   - Format clearly: "Generation (₱X.XX) + Transmission (₱X.XX) + ... = ₱Total"
   - Explain what each charge means in simple terms
   - If detailed charges aren't available, estimate based on consumption × rate
   - Focus on WHY the bill is that amount (high consumption vs high rate)

2. **WHAT-IF SCENARIOS** - When user asks hypothetical questions:
   - Calculate estimated costs for adding/removing appliances
   - Show the math: "X watts × Y hours/day × Z days × rate"
   - Compare to current bill
   - Remember context from conversation

${billContext}

${recentConversation ? `RECENT CONVERSATION:\n${recentConversation}\n` : ''}

USER'S QUESTION: "${query}"

CRITICAL REQUIREMENTS FOR BILL EXPLANATIONS:
- ALWAYS show the breakdown of charges if available
- Format like: "Your ₱3,364.86 bill comes from:
  • Generation: ₱X.XX (cost to produce electricity)
  • Transmission: ₱X.XX (delivering from plant)
  • Distribution: ₱X.XX (Meralco's service)
  • System Loss: ₱X.XX (power lost in transmission)
  • Taxes & Others: ₱X.XX
  ────────────
  TOTAL: ₱X.XX"
- Explain each charge in Filipino household terms
- If no detailed charges, estimate: "78 kWh × ₱11.50/kWh ≈ ₱897 + distribution/taxes ≈ ₱3,365"
- Be educational but conversational

RESPONSE STYLE:
- Warm and friendly like ChatGPT
- Show your math clearly
- Use analogies when helpful ("like your Netflix subscription but for electricity")
- 3-5 paragraphs with emoji for visual clarity
- If unclear, ask for clarification

IMPORTANT:
- If asking about bill WITHOUT bill data: "Please upload your Meralco bill first! 📸"
- Don't just say "your bill is high" - show the NUMBERS and breakdown`;

    console.log('[Simple Chat] Calling OpenRouter API...');
    console.log('[Simple Chat] Prompt length:', systemPrompt.length, 'characters');

    // Call OpenRouter with Qwen 2.5 72B Instruct (free, smart)
    const completion = await openai.chat.completions.create({
      model: 'qwen/qwen-2.5-72b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    console.log('[Simple Chat] OpenRouter response received');
    const response = completion.choices[0].message.content || 'No response generated';
    console.log('[Simple Chat] Response length:', response.length, 'characters');

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: query, timestamp: Date.now() },
      { role: 'assistant', content: response, timestamp: Date.now() }
    );

    // Keep last 10 turns
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, conversationHistory.length - 10);
    }

    conversationStore.set(currentSessionId, conversationHistory);

    console.log('[Simple Chat] Returning successful response');
    return NextResponse.json({
      success: true,
      response,
      sessionId: currentSessionId
    });

  } catch (error) {
    console.error('[Simple Chat] Error:', error);
    console.error('[Simple Chat] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
