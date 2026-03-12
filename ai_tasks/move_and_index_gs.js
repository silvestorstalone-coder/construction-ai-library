import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, "modules");
const DOCS_DIR = path.join(ROOT_DIR, "docs");

// Гарантируем наличие папок
if (!fs.existsSync(MODULES_DIR)) fs.mkdirSync(MODULES_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

function findGsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Игнорируем только системные папки
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "ai_tasks" || entry.name === ".github") continue;

    if (entry.isDirectory()) {
      results = results.concat(findGsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".gs")) {
      results.push(fullPath);
    }
  }
  return results;
}

// УЛУЧШЕННЫЙ АНАЛИЗ (Ищет связи между твоими модулями)
function analyzeGs(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Ищем объявленные функции
    const functions = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
    
    // Ищем вызовы твоих объектов-модулей (Estimate, Finance и т.д.)
    const internalModules = ["Estimate", "Technology", "Finance", "Schedule", "Materials", "Commerce", "AuditModule", "Utils", "Config"];
    const dependencies = internalModules.filter(m => {
        // Проверяем, что файл НЕ является самим этим модулем, но содержит его вызов
        return !path.basename(filePath).toLowerCase().includes(m.toLowerCase()) && 
               (content.includes(m + ".") || content.includes(m + "["));
    });

    return { functions, dependencies };
  } catch (e) { return { functions: [], dependencies: [] }; }
}

function cleanUp(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanUp(fullPath);
    } else if (entry.name === ".gitkeep" || entry.name === "gitkeep") {
      fs.unlinkSync(fullPath);
    }
  }
  const protectedDirs = ["modules", ".git", "ai_tasks", "docs", "node_modules", ".github"];
  if (fs.readdirSync(dir).length === 0 && !protectedDirs.includes(path.basename(dir)) && dir !== ROOT_DIR) {
    fs.rmdirSync(dir);
  }
}

function moveAndIndex() {
  const gsFiles = findGsFiles(ROOT_DIR);
  const indexLines = [
    "# MODULE_INDEX.md", 
    `Последнее обновление: ${new Date().toLocaleString()}`,
    "> Этот файл является ЭТАЛОНОМ связей для ИИ.",
    ""
  ];

  console.log(`Найдено файлов для индексации: ${gsFiles.length}`);

  for (let file of gsFiles) {
    const fileName = path.basename(file);
    const targetPath = path.join(MODULES_DIR, fileName);

    try {
      if (file !== targetPath) {
        fs.renameSync(file, targetPath);
      }
      
      const { functions, dependencies } = analyzeGs(targetPath);
      indexLines.push(`## 📦 ${fileName}`);
      indexLines.push(`- **Функции**: ${functions.join(", ") || "нет"}`);
      indexLines.push(`- **Зависимости (связи)**: ${dependencies.join(" ➔ ") || "автономен"}\n`);
    } catch (err) {
      console.error(`❌ Ошибка с файлом ${fileName}: ${err.message}`);
    }
  }

  const indexPath = path.join(DOCS_DIR, "MODULE_INDEX.md");
  fs.writeFileSync(indexPath, indexLines.join("\n"), "utf-8");
  
  cleanUp(ROOT_DIR);
  console.log(`✅ Индекс обновлен (с сохранением структуры): ${indexPath}`);
}

moveAndIndex();
