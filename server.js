const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const BOT_TOKEN = process.env.BOT_TOKEN; // Токен бота берём из переменной окружения
const app = express();
app.use(bodyParser.json());

// --- Функция проверки подписи Telegram ---
function checkTelegramAuth(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
                          .update(botToken)
                          .digest();

  const hmac = crypto.createHmac('sha256', secretKey)
                     .update(dataCheckString)
                     .digest('hex');

  return hmac === hash;
}

// --- Простейшая «база» в памяти ---
const attendance = new Set();

// --- Основной маршрут ---
app.post('/attendance', (req, res) => {
  const { initData, name } = req.body;

  if (!checkTelegramAuth(initData, BOT_TOKEN)) {
    return res.status(403).json({ ok: false, error: 'Неверная подпись' });
  }

  const userParam = new URLSearchParams(initData).get('user');
  const user = JSON.parse(userParam);
  const userId = user.id;

  if (attendance.has(userId)) {
    return res.json({ ok: false, error: 'Вы уже отметились' });
  }

  attendance.add(userId);
  console.log(`✅ ${name} (tg_id: ${userId}) отметил присутствие`);
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));

