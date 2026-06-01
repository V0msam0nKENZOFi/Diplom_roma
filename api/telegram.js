module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  const { text, chat_id: chatId, action } = req.body || {};

  try {
    if (action === 'getUpdates') {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=30`);
      const data = await response.json();
      return res.status(response.ok ? 200 : 500).json(data);
    }

    const chat = chatId || process.env.TELEGRAM_CHAT_ID;
    if (!text) {
      return res.status(400).json({ ok: false, error: 'text required' });
    }
    if (!chat) {
      return res.status(500).json({ ok: false, error: 'TELEGRAM_CHAT_ID not set' });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' })
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 500).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
