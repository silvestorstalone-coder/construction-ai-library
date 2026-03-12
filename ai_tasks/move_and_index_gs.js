import fs from "fs";
import path from "path";

// Корневая папка репозитория
const ROOT_DIR = process.cwd();

// Папка для модулей
const MODULES_DIR = path.join(ROOT_DIR, "modules");

// Создаём modules/, если нет
if (!fs.existsSync(MODULES_DIR)) {
  fs.mkdirSync(MODULES_DIR);
}

// Функция для поиска всех .gs файлов в папках
function findGsFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Пропускаем саму modules/, чтобы не затащить туда старые файлы
    if (fullPath.includes("/modules")) continue;

    if (entry.isDirectory()) {
      results = results.concat(findGsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".gs")) {
      results.push(fullPath);
    }
  }
  return results;
}

// Извлекаем имена функций и зависимости
function analyzeGs(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Простейший regex для функций
  const funcMatches = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)];
  const functions = funcMatches.map(m => m[1]);

  // Ищем вызовы других модулей через import / require / call
  const depMatches = [...content.matchAll(/(?:import|require|call)\s*\(?['"]([a-zA-Z0-9_./]+)['"]\)?/g)];
  const dependencies = depMatches.map(m => m[1]);

  return { functions, dependencies };
}

// Основной процесс
function moveAndIndex() {
  const gsFiles = findGsFiles(ROOT_DIR);
  const indexLines = ["# MODULE_INDEX.md", "Авто-сгенерировано скриптом move_and_index_gs.js", ""];

  for (let file of gsFiles) {
    const fileName = path.basename(file);
    const targetPath = path.join(MODULES_DIR, fileName);

    try {
      // Перемещаем файл
      fs.renameSync(file, targetPath);
      console.log(`✅ Moved: ${fileName}`);
      
      // Удаляем пустую папку, если осталась
      const parentDir = path.dirname(file);
      if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
        fs.rmdirSync(parentDir, { recursive: true });
        console.log(`🗑️ Removed empty folder: ${parentDir}`);
      }

      // Анализируем содержимое
      const { functions, dependencies } = analyzeGs(targetPath);

      indexLines.push(`## ${fileName}`);
      indexLines.push(`Функции: ${functions.join(", ") || "нет"}`);
      indexLines.push(`Зависимости: ${dependencies.join(", ") || "нет"}`);
      indexLines.push("");

    } catch (err) {
      console.error(`❌ Failed for ${fileName}:`, err.message);
    }
  }

  // Сохраняем MODULE_INDEX.md
  const indexPath = path.join(ROOT_DIR, "MODULE_INDEX.md");
  fs.writeFileSync(indexPath, indexLines.join("\n"), "utf-8");

  console.log(`Перемещено ${gsFiles.length} файлов .gs в modules/`);
  console.log(`MODULE_INDEX.md обновлён`);
}

    // Анализируем содержимое
    const { functions, dependencies } = analyzeGs(targetPath);

    indexLines.push(`## ${fileName}`);
    indexLines.push(`Функции: ${functions.join(", ") || "нет"}`);
    indexLines.push(`Зависимости: ${dependencies.join(", ") || "нет"}`);
    indexLines.push("");
  }

  // Сохраняем MODULE_INDEX.md
  const indexPath = path.join(ROOT_DIR, "MODULE_INDEX.md");
  fs.writeFileSync(indexPath, indexLines.join("\n"), "utf-8");

  console.log(`Перемещено ${gsFiles.length} файлов .gs в modules/`);
  console.log(`MODULE_INDEX.md создан`);
}

// Запуск
moveAndIndex();
