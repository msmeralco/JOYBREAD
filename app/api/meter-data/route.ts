import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for latest meter data
let latestMeterData = {
  meterId: 'demo_meter_001',
  consumption: 350,
  hour: 12,
  challengeActive: false,
  period: 'normal',
  timestamp: 0,
  lastUpdated: new Date().toISOString()
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Update latest meter data
    latestMeterData = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📊 Meter data received:', latestMeterData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data received',
      data: latestMeterData 
    });
  } catch (error) {
    console.error('Error processing meter data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return latest data for dashboard
  return NextResponse.json({
    success: true,
    data: latestMeterData
  });
}
