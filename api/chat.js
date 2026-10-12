import { getRecentChatHistory, saveChatMessage, getRecentMemories } from '../lib/firebase-store.js';
import { generateJianReply } from '../lib/gemini.js';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders();
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const message = (body?.message || '').trim();
    const tone = body?.tone || 'daily';
    if (!message) {
      res.status(400).json({ error: '메시지를 입력해 주세요.' });
      return;
    }

    const nowIso = new Date().toISOString();

    // 1. 이전 대화 기록 및 기억 병렬 로드
    const [chatHistory, memories] = await Promise.all([
      getRecentChatHistory(15),
      getRecentMemories(5),
    ]);

    // 2. Gemini를 통한 지안 응답 생성
    const replyText = await generateJianReply(message, chatHistory, memories, tone);
    const replyIso = new Date().toISOString();

    // 3. Firestore에 발화 비동기 저장
    Promise.all([
      saveChatMessage('brian', message, nowIso),
      saveChatMessage('jian', replyText, replyIso),
    ]).catch(err => console.error('[History Save Error]:', err));

    res.status(200).json({
      reply: replyText,
      createdAt: replyIso,
      sender: 'jian',
    });
  } catch (error) {
    console.error('[API /api/chat Error]:', error);
    res.status(500).json({
      error: '대화 처리 중 오류가 발생했습니다.',
      reply: 'Brian, 잠시 연결이 고르지 못했어요. 잠시 후 다시 말씀해 주시겠어요?',
    });
  }
}
