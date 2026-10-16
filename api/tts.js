import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// In-memory audio cache for frequent phrases
const audioCache = new Map();
const MAX_CACHE_SIZE = 100;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let text = '';
    let voiceMode = 'sunhi-natural';
    let voiceName = 'ko-KR-SunHiNeural';
    let rate = '+0%';
    let pitch = '+0Hz';

    if (req.method === 'POST') {
      let body = {};
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      } catch (parseErr) {
        body = {};
      }
      text = body.text || '';
      voiceMode = body.voice || voiceMode;
    } else {
      text = req.query?.text || '';
      voiceMode = req.query?.voice || voiceMode;
    }

    if (voiceMode === 'sunhi-calm') {
      rate = '-6%';
      pitch = '-2Hz';
    }

    // Clean text: strip emojis, markdown symbols, and extra whitespace
    text = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .trim();

    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    // Check memory cache
    const cacheKey = `${voiceName}_${rate}_${pitch}_${text}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      if (typeof res.send === 'function') {
        return res.status(200).send(cached);
      }
      return res.status(200).end(cached);
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate, pitch });

    const chunks = [];
    audioStream.on('data', chunk => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    // Save to LRU cache
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value;
      audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    if (typeof res.send === 'function') {
      return res.status(200).send(buffer);
    }
    return res.status(200).end(buffer);
  } catch (error) {
    console.error('[TTS API Error]:', error);
    return res.status(500).json({ error: 'TTS Synthesis Failed', message: error.message });
  }
}
