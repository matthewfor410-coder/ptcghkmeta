export default async function handler(req, res) {
  const { id, limit = '100' } = req.query;
  const url = id
    ? `https://play.limitlesstcg.com/api/tournaments/${id}/standings`
    : `https://play.limitlesstcg.com/api/tournaments?game=PTCG&format=STANDARD&limit=${limit}&order=date`;

  try {
    const r = await fetch(url, { 
      headers: { 'User-Agent': 'PTCG-Tracker/1.0' },
      cache: 'no-store'
    });
    const data = await r.json();
    
    // 禁止 Vercel Cache，確保每次都係最新
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
