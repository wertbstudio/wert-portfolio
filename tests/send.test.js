const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/send');
function request(body, method = 'POST', headers = {}) {
  const req = { method, body, headers: { 'content-type': 'application/json', host: 'portfolio.example', ...headers } };
  const res = { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  return handler(req, res).then(() => res);
}
const valid = { name: 'Иван', contact: '@example_user', type: 'landing', website: '' };
test('защита формы и отправка в Telegram', async t => {
  const originalFetch = global.fetch;
  const previousToken = process.env.BOT_TOKEN, previousChat = process.env.CHAT_ID;
  let calls = 0, sent;
  global.fetch = async (url, options) => { calls++; sent = JSON.parse(options.body); return { ok: true, json: async () => ({ ok: true }) }; };
  try {
    await t.test('не принимает GET', async () => assert.equal((await request(valid, 'GET')).code, 405));
    await t.test('отклоняет чужой Origin', async () => assert.equal((await request(valid, 'POST', { origin: 'https://evil.example' })).code, 403));
    await t.test('отклоняет неверный content-type', async () => assert.equal((await request(valid, 'POST', { 'content-type': 'text/plain' })).code, 415));
    await t.test('отклоняет повреждённый JSON', async () => assert.equal((await request('{')).code, 400));
    await t.test('отклоняет большую заявку', async () => assert.equal((await request({ ...valid, name: 'A'.repeat(5000) })).code, 413));
    await t.test('не отправляет honeypot', async () => { const result = await request({ ...valid, website: 'spam' }); assert.equal(result.code, 200); assert.equal(calls, 0); });
    await t.test('проверяет пустые поля и подмену типов', async () => {
      for (const body of [{}, null, [], { ...valid, name: ' ' }, { ...valid, name: 'Иван\nПодмена' }, { ...valid, contact: 'wrong' }, { ...valid, contact: '123' }, { ...valid, type: '__proto__' }, { ...valid, type: 'constructor' }]) assert.equal((await request(body)).code, 400);
      assert.equal(calls, 0);
    });
    await t.test('честно сообщает об отсутствии настроек', async () => { delete process.env.BOT_TOKEN; delete process.env.CHAT_ID; assert.equal((await request(valid)).code, 503); assert.equal(calls, 0); });
    process.env.BOT_TOKEN = 'test-placeholder'; process.env.CHAT_ID = 'test-placeholder';
    await t.test('отправляет валидную заявку ровно один раз', async () => { assert.equal((await request(valid)).code, 200); assert.equal(calls, 1); assert.match(sent.text, /Иван/); assert.match(sent.text, /Лендинг с квизом/); assert.equal(sent.parse_mode, undefined); });
    await t.test('принимает телефон', async () => assert.equal((await request({ ...valid, contact: '+7 (999) 123-45-67' })).code, 200));
    await t.test('принимает Telegram-ссылку', async () => assert.equal((await request({ ...valid, contact: 'https://t.me/example_user' })).code, 200));
    await t.test('не сообщает успех при отказе Telegram', async () => { global.fetch = async () => ({ ok: true, json: async () => ({ ok: false }) }); assert.equal((await request(valid)).code, 502); });
    await t.test('скрывает техническую ошибку', async () => { global.fetch = async () => { throw Error('sensitive-internal-details'); }; const result = await request(valid); assert.equal(result.code, 502); assert.ok(!JSON.stringify(result.data).includes('sensitive')); });
  } finally {
    global.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.BOT_TOKEN; else process.env.BOT_TOKEN = previousToken;
    if (previousChat === undefined) delete process.env.CHAT_ID; else process.env.CHAT_ID = previousChat;
  }
});
