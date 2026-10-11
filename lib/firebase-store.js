import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'persona-online';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : null;

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      initializeApp({ projectId });
    }
  }

  dbInstance = getFirestore();
  return dbInstance;
}

/**
 * 최근 대화 내역 조회 (기본 25개)
 */
export async function getRecentChatHistory(limitCount = 25) {
  try {
    const db = getDb();
    const snapshot = await db.collection('chat_history')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender || 'jian',
        text: data.text || '',
        timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : new Date().toISOString(),
      });
    });

    // 시간 오름차순으로 재정렬
    return messages.reverse();
  } catch (error) {
    console.error('[Firebase] Failed to fetch chat history:', error.message);
    return [];
  }
}

/**
 * 대화 메시지 단건 저장
 */
export async function saveChatMessage(sender, text, isoTimestamp) {
  try {
    const db = getDb();
    const docRef = await db.collection('chat_history').add({
      sender,
      text,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: isoTimestamp || new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[Firebase] Failed to save chat message:', error.message);
    return null;
  }
}

/**
 * 지안의 최근 기억(memories) 조회
 */
export async function getRecentMemories(limitCount = 5) {
  try {
    const db = getDb();
    const snapshot = await db.collection('memories')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();

    if (snapshot.empty) return [];

    const memories = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      memories.push(data.content || data.summary || '');
    });
    return memories.filter(Boolean);
  } catch (error) {
    console.warn('[Firebase] memories collection fetch skipped:', error.message);
    return [];
  }
}
