// /api/taiwan.js - 正確小寫檔名，對應 /api/taiwan
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 嘗試直接抓 Asia Trainers TW 活動頁
    const url = 'https://asia.pokemon-card.com/tw/event-search/';
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 PTCG-Meta-Tracker', 'Accept': 'text/html' }
    });

    if (!resp.ok) {
      return res.status(502).json({
        success: false,
        error: `Asia Trainers 連接失敗 HTTP ${resp.status}`,
        source: 'asia.pokemon-card.com',
        hint: '官方站有 Cloudflare，需後端加 Puppeteer 或改用 Facebook 群組數據',
        url
      });
    }

    const html = await resp.text();
    const events = [];
    // 簡單抽取 Town League 等關鍵字
    const regex = /(Town League|City League|Regional League|Premier Ball|道館賽|聯盟賽|台灣|台北|高雄)[^<\n]{0,40}/gi;
    let m;
    while ((m = regex.exec(html)) !== null && events.length < 30) {
      events.push(m[0].trim());
    }

    if (events.length === 0) {
      return res.status(200).json({
        success: false,
        error: '已連接 Asia Trainers 但未解析到活動',
        source: 'asia.pokemon-card.com',
        htmlLength: html.length,
        hint: '需登入或改用 https://asia.pokemon-card.com/tw/event/ 手動整理',
        url
      });
    }

    return res.status(200).json({
      success: true,
      source: 'asia.pokemon-card.com',
      total: events.length,
      events: events.map((name, i) => ({ id: i+1, name, region: 'TW/HK' })),
      url
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, source: 'taiwan' });
  }
}
