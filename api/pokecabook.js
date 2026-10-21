// /api/pokecabook.js - 正確小寫，對應 /api/pokecabook
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const resp = await fetch('https://pokecabook.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (PTCG-Meta-Tracker)', 'Accept': 'text/html' }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    // 抽取環境 Deck
    const decks = [];
    const pattern = /(ドラパルトex|メガルカリオex|Nのゾロアークex|おまつりおんど|ヤドキング|サーナイトex|リザードンex|ミュウex|トドロクツキex|テラパゴスex)[^<]{0,30}/g;
    let match;
    while ((match = pattern.exec(html)) !== null && decks.length < 40) {
      const clean = match[0].replace(/<[^>]*>/g, '').trim();
      if (clean.length > 2 && !decks.find(d => d.archetype === clean)) {
        decks.push({ archetype: clean, count: 1 });
      }
    }

    if (decks.length === 0) {
      return res.status(200).json({
        success: false,
        error: '已連接但未解析到 Deck，網站結構可能已改',
        source: 'pokecabook.com',
        htmlPreview: html.slice(0, 1000),
        hint: '建議安裝 cheerio: npm i cheerio 後用 load(html)'
      });
    }

    return res.status(200).json({
      success: true,
      source: 'pokecabook.com',
      updateDate: new Date().toISOString().slice(0,10),
      total: decks.length,
      decks: decks.map((d, i) => ({ rank: i+1, archetype: d.archetype, count: d.count })),
      note: '日本 City League + CL 最齊，優於 gumaguma/pokeca-chart'
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, source: 'pokecabook.com' });
  }
}
