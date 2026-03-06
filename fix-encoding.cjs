const fs = require("fs");
const path = require("path");

// Файлы для исправления
const files = [
  "app/landmarks/data/home.ru.json",
  "app/landmarks/data/home.uk.json",
];

files.forEach((file) => {
  try {
    const filePath = path.join(__dirname, file);

    // Читаем файл как binary buffer
    const buffer = fs.readFileSync(filePath);

    // Декодируем как UTF-8 (это даст нам испорченные символы)
    const wrongText = buffer.toString("utf-8");

    // Конвертируем обратно в Latin1 binary
    const latin1Buffer = Buffer.from(wrongText, "latin1");

    // Теперь декодируем как UTF-8 правильно
    const correctText = latin1Buffer.toString("utf-8");

    // Сохраняем исправленный файл
    fs.writeFileSync(filePath, correctText, "utf-8");

    console.log(`✓ Fixed: ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log("Done!");
