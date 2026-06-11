const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Загрузка .env файла (без внешних зависимостей)
(function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    try {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach((line) => {
                line = line.trim();
                if (!line || line.startsWith('#')) return;
                const eqIdx = line.indexOf('=');
                if (eqIdx === -1) return;
                const key = line.slice(0, eqIdx).trim();
                let value = line.slice(eqIdx + 1).trim();
                // Убираем кавычки, если есть
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            });
            console.log('.env загружен');
        }
    } catch (e) {
        console.warn('Не удалось загрузить .env:', e.message);
    }
})();

const port = Number(process.env.PORT) || 3000;
const root = __dirname;

const pool = process.env.NEON_DATABASE_URL
    ? new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : null;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

function sendFile(response, filePath, statusCode = 200) {
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Ошибка сервера');
            return;
        }

        response.writeHead(statusCode, { 'Content-Type': type });
        response.end(content);
    });
}

function jsonResponse(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    response.end(JSON.stringify(data));
}

function readBody(request) {
    return new Promise((resolve) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString()));
            } catch {
                resolve({});
            }
        });
    });
}

async function handleApiUsers(request, response) {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        response.end();
        return;
    }

    if (!pool) {
        return jsonResponse(response, 500, { ok: false, error: 'NEON_DATABASE_URL not set' });
    }

    try {
        switch (request.method) {
            case 'GET': {
                const result = await pool.query('SELECT * FROM users ORDER BY registered_at DESC');
                const users = result.rows.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone || '',
                    blocked: u.blocked,
                    blockReason: u.block_reason || '',
                    registeredAt: u.registered_at
                }));
                return jsonResponse(response, 200, { ok: true, users });
            }

            case 'POST': {
                const { name, email, phone, password } = await readBody(request);
                if (!name || !email || !password) {
                    return jsonResponse(response, 400, { ok: false, error: 'name, email, password required' });
                }
                const id = `user_${Date.now()}`;
                await pool.query(
                    'INSERT INTO users (id, name, email, phone, password) VALUES ($1, $2, $3, $4, $5)',
                    [id, name.trim(), email.trim().toLowerCase(), (phone || '').trim(), password]
                );
                return jsonResponse(response, 201, { ok: true, user: { id, name: name.trim(), email: email.trim().toLowerCase(), phone: (phone || '').trim(), blocked: false, blockReason: '', registeredAt: new Date().toISOString() } });
            }

            case 'PATCH': {
                const { email: targetEmail, action } = await readBody(request);
                if (!targetEmail || !action) {
                    return jsonResponse(response, 400, { ok: false, error: 'email and action required' });
                }
                if (action === 'ban') {
                    await pool.query('UPDATE users SET blocked = true, block_reason = $1 WHERE email = $2', ['Заблокирован администратором', targetEmail]);
                } else if (action === 'unban') {
                    await pool.query('UPDATE users SET blocked = false, block_reason = $1 WHERE email = $2', ['', targetEmail]);
                } else {
                    return jsonResponse(response, 400, { ok: false, error: 'action must be ban or unban' });
                }
                return jsonResponse(response, 200, { ok: true });
            }

            default:
                return jsonResponse(response, 405, { ok: false, error: 'Method not allowed' });
        }
    } catch (err) {
        if (err.constraint === 'users_email_key') {
            return jsonResponse(response, 409, { ok: false, error: 'Пользователь с таким email уже зарегистрирован' });
        }
        return jsonResponse(response, 500, { ok: false, error: err.message });
    }
}

async function handleApiTelegram(request, response) {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        response.end();
        return;
    }

    if (request.method !== 'POST') {
        return jsonResponse(response, 405, { ok: false, error: 'Method not allowed' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        return jsonResponse(response, 500, { ok: false, error: 'TELEGRAM_BOT_TOKEN not set' });
    }

    const body = await readBody(request);
    const { text, chat_id: chatId, action } = body || {};

    try {
        if (action === 'getUpdates') {
            const apiUrl = `https://api.telegram.org/bot${token}/getUpdates?timeout=30`;
            const data = await httpsGetJson(apiUrl);
            return jsonResponse(response, data.ok ? 200 : 500, data);
        }

        const chat = chatId || process.env.TELEGRAM_CHAT_ID;
        if (!text) {
            return jsonResponse(response, 400, { ok: false, error: 'text required' });
        }
        if (!chat) {
            return jsonResponse(response, 500, { ok: false, error: 'TELEGRAM_CHAT_ID not set' });
        }

        const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const data = await httpsPostJson(apiUrl, {
            chat_id: chat,
            text,
            parse_mode: 'HTML'
        });
        return jsonResponse(response, data.ok ? 200 : 500, data);
    } catch (err) {
        return jsonResponse(response, 500, { ok: false, error: err.message });
    }
}

function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let raw = '';
            res.on('data', (chunk) => raw += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve({ ok: false, error: 'Invalid JSON response' });
                }
            });
        }).on('error', reject);
    });
}

function httpsPostJson(url, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', (chunk) => raw += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve({ ok: false, error: 'Invalid JSON response' });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function handleApiAuth(request, response) {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        response.end();
        return;
    }

    if (request.method !== 'POST') {
        return jsonResponse(response, 405, { ok: false, error: 'Method not allowed' });
    }

    return readBody(request).then((body) => {
        const { password } = body || {};
        const adminPassword = process.env.ADMIN_PASSWORD || 'Vlvlkoktqw@7!!';
        if (password === adminPassword) {
            return jsonResponse(response, 200, { ok: true });
        }
        return jsonResponse(response, 401, { ok: false, error: 'Invalid admin password' });
    });
}

const server = http.createServer(async (request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);

    if (urlPath === '/api/users') {
        return handleApiUsers(request, response);
    }

    if (urlPath === '/api/auth') {
        return handleApiAuth(request, response);
    }

    if (urlPath === '/api/telegram') {
        return handleApiTelegram(request, response);
    }

    let filePath = path.join(root, urlPath);

    if (urlPath === '/' || urlPath === '') {
        filePath = path.join(root, 'index.html');
    }

    if (!filePath.startsWith(root)) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (!error && stats.isFile()) {
            sendFile(response, filePath);
            return;
        }

        const withHtml = `${filePath}.html`;
        fs.stat(withHtml, (htmlError, htmlStats) => {
            if (!htmlError && htmlStats.isFile()) {
                sendFile(response, withHtml);
                return;
            }

            const notFound = path.join(root, '404.html');
            fs.stat(notFound, (nfError) => {
                if (!nfError) {
                    sendFile(response, notFound, 404);
                    return;
                }

                response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                response.end('Страница не найдена');
            });
        });
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`ТехноСервис+ запущен: http://0.0.0.0:${port}`);
    if (pool) {
        console.log('Neon PostgreSQL подключён');
    } else {
        console.log('Neon PostgreSQL не настроен (NEON_DATABASE_URL)');
    }
});
