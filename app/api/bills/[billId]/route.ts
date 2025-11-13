import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/firebase/firebase';

const db = getFirestore(app);

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { billId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User ID required' },
        { status: 401 }
      );
    }

    if (!billId) {
      return NextResponse.json(
        { success: false, error: 'Bill ID required' },
        { status: 400 }
      );
    }

    const billRef = doc(db, 'bills', billId);
    const billDoc = await getDoc(billRef);

    if (!billDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    const billData = billDoc.data();

    // Verify ownership
    if (billData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not your bill' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      bill: {
        id: billDoc.id,
        ...billData,
        uploadedAt: billData.uploadedAt?.toMillis() || Date.now(),
        lastUpdated: billData.lastUpdated?.toMillis() || Date.now(),
      },
    });

  } catch (error) {
    console.error('[Get Bill] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}
