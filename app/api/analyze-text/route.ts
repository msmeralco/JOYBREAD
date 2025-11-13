import { NextRequest, NextResponse } from 'next/server';
import { ParserAgent } from '@/lib/agents';
import type { ParsedBillData } from '@/lib/agents/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedText, ocrConfidence } = body;

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'No extracted text provided' },
        { status: 400 }
      );
    }

    console.log(`[API] Processing extracted text (${extractedText.length} characters)...`);

    const startTime = Date.now();

    // ONLY parse the bill - no appliance breakdown, no insights, no scores
    const parser = new ParserAgent();
    const parserResult = await parser.process({
      from: 'API' as any,
      to: 'PARSER' as any,
      type: 'REQUEST' as any,
      data: { extractedText, confidence: ocrConfidence },
      timestamp: Date.now(),
      correlationId: `kilos-${Date.now()}`
    });

    if (parserResult.type === 'ERROR') {
      throw new Error(`Parsing failed: ${parserResult.data.error}`);
    }

    const parsedData = parserResult.data.parsedData as ParsedBillData;
    const processingTime = Date.now() - startTime;

    console.log(`[API] Parsing successful (${processingTime}ms)`);

    return NextResponse.json({
      success: true,
      parsedData,
      processingTime,
      ocrConfidence
    });

  } catch (error) {
    console.error('[API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'KILOS Bill Decoder API - Text Analysis',
    version: '1.0.0',
    endpoints: {
      POST: '/api/analyze-text - Analyze extracted text from bill'
    }
  });
}
