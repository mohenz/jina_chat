import { getRecentChatHistory } from '../lib/firebase-store.js';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const limit = parseInt(req.query?.limit || '30', 10);
    const messages = await getRecentChatHistory(limit);

    res.status(200).json({
      messages: messages || [],
    });
  } catch (error) {
    console.error('[API /api/history Error]:', error);
    res.status(500).json({
      error: '대화 기록 조회 실패',
      messages: [],
    });
  }
}
