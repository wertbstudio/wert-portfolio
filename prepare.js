// В публичную сборку попадают только файлы сайта. Секреты и исходники сервера исключены.
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'public');
fs.mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js', 'projects.js']) fs.copyFileSync(path.join(__dirname, file), path.join(output, file));
fs.cpSync(path.join(__dirname, 'assets'), path.join(output, 'assets'), { recursive: true, filter: source => !source.endsWith('.md') });
console.log('Public files prepared.');
