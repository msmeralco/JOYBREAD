import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import app from '@/firebase/firebase';

const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { billId, userId, message } = await request.json();

    if (!billId || !userId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const billRef = doc(db, 'bills', billId);

    // Add message to chat history
    await updateDoc(billRef, {
      chatHistory: arrayUnion(message),
      lastUpdated: serverTimestamp(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Save Chat] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save message' },
      { status: 500 }
    );
  }
}
