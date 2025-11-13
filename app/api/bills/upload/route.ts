import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedText, ocrConfidence } = body;
    
    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'Missing extracted text' },
        { status: 400 }
      );
    }

    console.log(`[Bill Upload] Analyzing bill data...`);
    console.log(`[Bill Upload] OCR confidence: ${ocrConfidence.toFixed(1)}%`);

    // Analyze the bill using the analyze-text API
    const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extractedText,
        ocrConfidence,
      }),
    });

    const analyzeResult = await analyzeResponse.json();

    if (!analyzeResult.success) {
      throw new Error(analyzeResult.error || 'Failed to analyze bill');
    }

    console.log(`[Bill Upload] Analysis successful`);

    // Return analysis result - client will save to Firestore
    return NextResponse.json({
      success: true,
      parsedData: analyzeResult.parsedData,
      ocrConfidence,
    });

  } catch (error) {
    console.error('[Bill Upload] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bill Upload API',
    version: '1.0.0',
    description: 'Upload bills with OCR and Firestore integration',
  });
}
