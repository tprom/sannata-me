// lib/getMessages.js
import fs from 'fs';
import path from 'path';

export default function getMessages(locale = 'en') {
  const filePath = path.join(process.cwd(), 'locales', locale, 'common.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}
