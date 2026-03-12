import fs from "fs";
import path from "path";

// Корневая папка репозитория
const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, "modules");

// 1. Создаём modules/, если нет
if (!fs.existsSync(MODULES_DIR)) {
  fs.mkdirSync(MODULES_DIR, { recursive: true });
}

// Функция для рекурсивного поиска файлов
function findGsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Пропускаем системные папки и саму папку модулей
    if (entry.name === "modules" || entry.name === ".git" || entry.name === "node_modules") continue;

    if (entry.isDirectory()) {
      results = results.concat(findGsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".gs")) {
      results.push(fullPath);
    }
  }
  return results;
}

// Анализ контента
function analyzeGs(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const funcMatches = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)];
    const functions = funcMatches.map(m => m[1]);

    const depMatches = [...content.matchAll(/(?:import|require|call)\s*\(?['"]([a-zA-Z0-9_./]+)['"]\)?/g)];
    const dependencies = depMatches.map(m => m[1]);

    return { functions, dependencies };
  } catch (e) {
    return { functions: [], dependencies: [] };
  }
}

// Рекурсивная очистка пустых папок и .gitkeep
function cleanUp(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanUp(fullPath);
    } else if (entry.name === ".gitkeep" || entry.name === "gitkeep") {
      // Удаляем .gitkeep, так как файлы .gs уже уехали
      fs.unlinkSync(fullPath);
    }
  }

  // Список папок, которые КАТЕГОРИЧЕСКИ нельзя удалять
  const protectedDirs = ["modules", ".git", "ai_tasks", "docs", "node_modules", ".github"];
  const dirName = path.basename(dir);

  // Если папка пуста и не защищена — удаляем
  if (fs.readdirSync(dir).length === 0 && !protectedDirs.includes(dirName) && dir !== ROOT_DIR) {
    console.log(`🗑️ Удалена пустая папка: ${dir}`);
    fs.rmdirSync(dir);
  }
}

// Основной процесс
function moveAndIndex() {
  const gsFiles = findGsFiles(ROOT_DIR);
  const indexLines = ["# MODULE_INDEX.md", "Авто-сгенерировано скриптом move_and_index_gs.js", ""];

  console.log(`Найдено файлов: ${gsFiles.length}`);

  for (let file of gsFiles) {
    const fileName = path.basename(file);
    const targetPath = path.join(MODULES_DIR, fileName);

    try {
      // Перемещаем
      fs.renameSync(file, targetPath);
      
      // Анализируем уже на новом месте
      const { functions, dependencies } = analyzeGs(targetPath);

      indexLines.push(`## ${fileName}`);
      indexLines.push(`- **Функции**: ${functions.join(", ") || "нет"}`);
      indexLines.push(`- **Зависимости**: ${dependencies.join(", ") || "нет"}`);
      indexLines.push("");
    } catch (err) {
      console.error(`❌ Ошибка с файлом ${fileName}: ${err.message}`);
    }
  }

  // Сохраняем индекс в корне
  fs.writeFileSync(path.join(ROOT_DIR, "MODULE_INDEX.md"), indexLines.join("\n"), "utf-8");
  
  // Запускаем очистку
  console.log("Очистка пустых папок...");
  cleanUp(ROOT_DIR);

  console.log(`✅ Готово. Перемещено ${gsFiles.length} файлов.`);
}

moveAndIndex();
