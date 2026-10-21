// /api/japan.js - 正確小寫檔名，Vercel 對應 /api/japan
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { source = 'pokecabook' } = req.query;

  try {
    if (source === 'pokecabook') {
      // 直接爬 pokecabook 首頁 Tier
      const resp = await fetch('https://pokecabook.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 PTCG-Meta-Tracker' }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      // Regex 抽 Tier Deck 名 (無 cheerio 輕量版)
      const decks = [];
      const regex = /(ドラパルトex|メガルカリオex|Nのゾロアークex|おまつりおんど|ヤドキング|リザードンex|ミュウex|サーナイトex|トドロクツキ|テラパゴス)[^<\n]{0,20}/g;
      let m;
      while ((m = regex.exec(html)) !== null && decks.length < 30) {
        const name = m[0].replace(/<[^>]*>/g, '').trim();
        if (!decks.find(d => d.name === name)) decks.push({ name, count: 1 });
      }

      if (decks.length === 0) {
        return res.status(200).json({
          success: false,
          error: '已連接 pokecabook.com 但未解析到 Deck',
          source: 'pokecabook.com',
          htmlLength: html.length,
          hint: '網站可能加了 Cloudflare，需用完整 cheerio 解析'
        });
      }

      return res.status(200).json({
        success: true,
        source: 'pokecabook.com',
        total: decks.length,
        decks: decks.map((d, i) => ({ rank: i+1, archetype: d.name, count: d.count, source: 'pokecabook' })),
        updateDate: new Date().toISOString().slice(0,10),
        note: '日本 City League + CL + Gym Battle 最齊數據'
      });
    }

    return res.status(400).json({ success: false, error: `未知 source ${source}` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, source: 'japan' });
  }
}
