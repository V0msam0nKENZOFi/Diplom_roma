const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const root = __dirname;

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

const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
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
});
