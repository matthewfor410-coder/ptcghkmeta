// /api/pokecabook.js - Vercel Serverless Function
// 代理 pokecabook.com 日本 City League / CL / Gym Battle 優勝數據
// 最齊嘅日本源：每日更新 Tier + Best16

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { date, limit = '30' } = req.query; // date = 2026-10-20 可選

  try {
    // PokecaBook 有按日分頁：https://pokecabook.com/archives/xxxxx
    // 我地試幾個已知結構，失敗就直接回失敗（唔出假數據）
    
    // 方法1: 嘗試抓首頁 Tier + 最新優勝列表
    const mainUrl = 'https://pokecabook.com/';
    const response = await fetch(mainUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PTCG-Meta-Tracker/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ 
        success: false, 
        error: `無法取得 PokecaBook 首頁 - HTTP ${response.status}`,
        source: 'pokecabook.com',
        hint: '網站可能阻擋爬蟲，需加 Cloudflare 繞過或改用 RSS'
      });
    }

    const html = await response.text();

    // 簡單解析：找 Tier 表 + 日期
    // PokecaBook 結構：<h2> 或 class="tier" 裡有 Deck 名
    // 由於無 cheerio (Vercel 輕量)，用 Regex 初步抽取，之後可換 cheerio

    const decks = [];
    // 嘗試抽取形如 "ドラパルトex＋ヨノワール" 等 Deck 名
    const deckPattern = /(ドラパルトex|メガルカリオex|Nのゾロアークex|おまつりおんど|ヤドキング|ボム|ミュウex|リザードンex)[^<]{0,30}/g;
    let match;
    while ((match = deckPattern.exec(html)) !== null && decks.length < 20) {
      const name = match[0].replace(/<[^>]*>/g, '').trim();
      if (name.length > 2 && !decks.includes(name)) decks.push(name);
    }

    // 嘗試抽取更新日
    const dateMatch = html.match(/更新日[：:]\s*([0-9\/\-年]+)/);
    const updateDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0,10);

    if (decks.length === 0) {
      return res.status(200).json({
        success: false,
        error: '已連接 PokecaBook 但未解析到 Deck 數據 - 網站結構可能已改',
        source: 'pokecabook.com',
        rawLength: html.length,
        hint: '建議安裝 cheerio: npm i cheerio，然後用 $("h2,h3").each 解析，或轉用 Note.com 集計',
        sampleHtml: html.slice(0, 500)
      });
    }

    // 成功回傳真實數據結構（無假數據）
    return res.status(200).json({
      success: true,
      source: 'pokecabook.com',
      updateDate,
      totalDecks: decks.length,
      decks: decks.map((name, i) => ({
        rank: i+1,
        archetype: name,
        // 真實數據：如需勝率，需進一步爬 /archives/ 每日優勝數
        count: null, // 需二級爬蟲補齊
        note: '首頁 Tier 數據，詳細優勝數請爬每日 Best16 頁面'
      })),
      nextSteps: [
        '1. 安裝 cheerio: npm i cheerio',
        '2. 爬每日優勝：https://pokecabook.com/?s=シティリーグ',
        '3. 合併多日數據計出 59大會・236Deck 分佈'
      ],
      rawUrl: mainUrl
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: `PokecaBook 爬蟲失敗: ${e.message}`,
      source: 'pokecabook.com',
      stack: e.stack?.slice(0,500)
    });
  }
}
