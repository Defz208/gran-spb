const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = __dirname;
const reviewsFile = process.env.REVIEWS_FILE || path.join(root, 'reviews.json');
const port = Number(process.env.PORT || 5187);
const host = process.env.HOST || '127.0.0.1';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
let mutationQueue = Promise.resolve();
const recentSubmissions = new Map();

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function readReviews() {
  try {
    const reviews = JSON.parse(await fs.readFile(reviewsFile, 'utf8'));
    if (!Array.isArray(reviews)) throw new Error('Invalid reviews data');
    return reviews;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readJsonBody(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('Отправьте данные формы в формате JSON.'), { status: 415 });
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 10000) throw Object.assign(new Error('Отзыв слишком длинный.'), { status: 413 });
  }
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error('Не удалось прочитать отзыв.'), { status: 400 }); }
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { json(res, 400, { error: 'Некорректный адрес.' }); return; }

  if (pathname === '/api/reviews') {
    try {
      if (req.method === 'GET') {
        await mutationQueue;
        json(res, 200, { reviews: (await readReviews()).slice(-100).reverse() });
        return;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        const rating = Number(body.rating);
        if (name.length < 2 || name.length > 60 || text.length < 20 || text.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
          json(res, 400, { error: 'Укажите имя, оценку и отзыв от 20 до 1000 символов.' });
          return;
        }
        const visitor = req.socket.remoteAddress || 'unknown';
        if (Date.now() - (recentSubmissions.get(visitor) || 0) < 15000) {
          json(res, 429, { error: 'Подождите немного перед отправкой следующего отзыва.' });
          return;
        }
        const review = { id: randomUUID(), name, text, rating, date: new Date().toISOString() };
        const operation = mutationQueue.then(async () => {
          const reviews = await readReviews();
          reviews.push(review);
          await fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2) + '\n', 'utf8');
          return review;
        });
        mutationQueue = operation.catch(() => {});
        await operation;
        recentSubmissions.set(visitor, Date.now());
        json(res, 201, { review });
        return;
      }
      json(res, 405, { error: 'Метод не поддерживается.' });
    } catch (error) {
      json(res, error.status || 500, { error: error.status ? error.message : 'Не удалось сохранить отзыв. Попробуйте позже.' });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Not found'); }
});

if (require.main === module) server.listen(port, host, () => console.log(`DEV_READY http://${host}:${port}/ — ГРАНЬ`));
module.exports = server;



