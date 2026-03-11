/**
 * organize_modules.js
 * Автоматизация: рекурсивный перенос .gs файлов в modules/ и генерация MODULE_INDEX.md
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, "modules");
const DOCS_DIR = path.join(ROOT_DIR, "docs");
const MODULE_INDEX_FILE = path.join(DOCS_DIR, "MODULE_INDEX.md");

// --- Создание папок ---
if (!fs.existsSync(MODULES_DIR)) fs.mkdirSync(MODULES_DIR);
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR);

// --- Рекурсивный поиск .gs файлов ---
function findGSFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(findGSFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".gs")) {
      results.push(fullPath);
    }
  }
  return results;
}

const gsFiles = findGSFiles(ROOT_DIR).filter(f => !f.includes(MODULES_DIR));

if (gsFiles.length === 0) {
  console.log("Нет .gs файлов для перемещения.");
  process.exit(0);
}

// --- Перенос файлов в modules/ ---
gsFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const targetPath = path.join(MODULES_DIR, fileName);

  // Если файл уже есть, перезаписываем
  fs.renameSync(filePath, targetPath);
  console.log(`Перемещён: ${filePath} → modules/${fileName}`);
});

// --- Генерация MODULE_INDEX.md ---
let indexContent = "# Индекс модулей\n\n";
indexContent += "| Файл | Функции | Зависимости |\n";
indexContent += "|------|---------|-------------|\n";

gsFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(path.join(MODULES_DIR, fileName), "utf8");

  const functions = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)]
    .map(m => m[1])
    .join(", ") || "-";

  const dependencies = [
    ...(content.match(/callYandexGPT/g) || []),
    ...(content.match(/import\s+.*from/g) || [])
  ].join(", ") || "-";

  indexContent += `| ${fileName} | ${functions} | ${dependencies} |\n`;
});

// --- Сохраняем файл ---
fs.writeFileSync(MODULE_INDEX_FILE, indexContent, "utf8");
console.log(`MODULE_INDEX.md сгенерирован → docs/MODULE_INDEX.md`);
