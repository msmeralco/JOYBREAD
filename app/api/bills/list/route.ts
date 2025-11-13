import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import app from '@/firebase/firebase';

const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User ID required' },
        { status: 401 }
      );
    }

    console.log(`[Bill List] Fetching bills for user: ${userId}`);

    const billsRef = collection(db, 'bills');
    const q = query(
      billsRef,
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bills = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to numbers for JSON serialization
      uploadedAt: doc.data().uploadedAt?.toMillis() || Date.now(),
      lastUpdated: doc.data().lastUpdated?.toMillis() || Date.now(),
    }));

    console.log(`[Bill List] Found ${bills.length} bills`);

    return NextResponse.json({
      success: true,
      bills,
    });

  } catch (error) {
    console.error('[Bill List] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}
