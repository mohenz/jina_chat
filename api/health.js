export default async function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    service: 'jian_chat',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
