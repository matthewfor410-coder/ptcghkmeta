export default async function handler(req, res) {
  const { id, limit = '100' } = req.query;
  const url = id
    ? `https://play.limitlesstcg.com/api/tournaments/${id}/standings`
    : `https://play.limitlesstcg.com/api/tournaments?game=PTCG&limit=${limit}&order=date&format=STANDARD`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'PTCG' }, cache: 'no-store' });
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
