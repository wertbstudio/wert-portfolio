'use strict';

const TYPES = { landing: 'Лендинг с квизом', image: 'Имиджевый сайт', store: 'Магазин-каталог', other: 'Консультация' };
const clean = value => typeof value === 'string' ? value.trim() : '';
const validContact = value => /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)
  || /^https:\/\/t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/.test(value)
  || (/^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const reply = (status, data) => res.status(status).json(data);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { ok: false, error: 'Метод не поддерживается.' }); }
  // Браузерная форма работает только с текущего домена, CORS не разрешаем.
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return reply(403, { ok: false, error: 'Источник запроса не разрешён.' }); }
    catch { return reply(403, { ok: false, error: 'Некорректный источник запроса.' }); }
  }
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return reply(415, { ok: false, error: 'Ожидается JSON.' });
  if (Number(req.headers['content-length']) > 4096) return reply(413, { ok: false, error: 'Слишком большой запрос.' });
  let data;
  try { data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return reply(400, { ok: false, error: 'Некорректные данные.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { ok: false, error: 'Заполните форму.' });
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > 4096) return reply(413, { ok: false, error: 'Слишком большой запрос.' });
  // Любое заполнение honeypot — тихо отклоняем, Telegram не вызывается.
  if (data.website !== undefined && data.website !== '') return reply(200, { ok: true });
  const name = clean(data.name), contact = clean(data.contact), type = clean(data.type);
  if (name.length < 2 || name.length > 80 || !/\p{L}/u.test(name) || /[\u0000-\u001f\u007f<>]|https?:\/\//i.test(name)) return reply(400, { ok: false, error: 'Укажите имя: от 2 до 80 символов.' });
  if (contact.length > 100 || !validContact(contact)) return reply(400, { ok: false, error: 'Укажите корректный телефон или Telegram (@username).' });
  if (!Object.prototype.hasOwnProperty.call(TYPES, type)) return reply(400, { ok: false, error: 'Выберите тип сайта.' });
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  if (!token || !chatId) return reply(503, { ok: false, error: 'Форма временно недоступна. Напишите @wertbst в Telegram.' });
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `Новая заявка · WERT\n\nИмя: ${name}\nКонтакт: ${contact}\nПроект: ${TYPES[type]}`, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) return reply(502, { ok: false, error: 'Не удалось отправить заявку. Напишите @wertbst в Telegram.' });
    return reply(200, { ok: true });
  } catch {
    // Не логируем URL Telegram и исключения: они могут содержать токен.
    return reply(502, { ok: false, error: 'Сервис временно недоступен. Напишите @wertbst в Telegram.' });
  }
};
