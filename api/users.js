const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ ok: false, error: 'NEON_DATABASE_URL not set' });
  }

  try {
    const sql = neon(connectionString);

    switch (req.method) {
      case 'GET': {
        const result = await sql`SELECT * FROM users ORDER BY registered_at DESC`;
        const users = result.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          blocked: u.blocked,
          blockReason: u.block_reason || '',
          registeredAt: u.registered_at
        }));
        return res.status(200).json({ ok: true, users });
      }

      case 'POST': {
        const { name, email, phone, password } = req.body || {};
        if (!name || !email || !password) {
          return res.status(400).json({ ok: false, error: 'name, email, password required' });
        }
        const id = `user_${Date.now()}`;
        await sql`
          INSERT INTO users (id, name, email, phone, password)
          VALUES (${id}, ${name.trim()}, ${email.trim().toLowerCase()}, ${(phone || '').trim()}, ${password})
        `;
        return res.status(201).json({ ok: true, user: { id, name: name.trim(), email: email.trim().toLowerCase(), phone: (phone || '').trim(), blocked: false, blockReason: '', registeredAt: new Date().toISOString() } });
      }

      case 'PATCH': {
        const { email: targetEmail, action } = req.body || {};
        if (!targetEmail || !action) {
          return res.status(400).json({ ok: false, error: 'email and action required' });
        }
        if (action === 'ban') {
          await sql`UPDATE users SET blocked = true, block_reason = 'Заблокирован администратором' WHERE email = ${targetEmail}`;
        } else if (action === 'unban') {
          await sql`UPDATE users SET blocked = false, block_reason = '' WHERE email = ${targetEmail}`;
        } else {
          return res.status(400).json({ ok: false, error: 'action must be ban or unban' });
        }
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (err) {
    if (err.constraint === 'users_email_key') {
      return res.status(409).json({ ok: false, error: 'Пользователь с таким email уже зарегистрирован' });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
}
