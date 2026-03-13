import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";
const API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const PIPELINE_FILE = "./docs/SYSTEM_PIPELINE.md";
const INDEX_FILE = "./docs/MODULE_INDEX.md";
const MODULES_DIR = "./modules/";
const STATE_FILE = "./.ai_state.json"; // Память процесса

if (!API_KEY || !FOLDER_ID) {
  console.error("Missing Yandex credentials");
  process.exit(1);
}

// --- 1. ФУНКЦИИ ПАМЯТИ (STATE MANAGEMENT) ---
function getProcessedFiles() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch (e) { return []; }
  }
  return [];
}

function saveProcessedFile(fileName) {
  const processed = getProcessedFiles();
  if (!processed.includes(fileName)) {
    processed.push(fileName);
    fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
  }
}

// --- 2. СЕТЕВОЙ БЛОК (Retry логика сохранена) ---
async function callYandexGPT(payload) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Api-Key ${API_KEY}`,
          "Content-Type": "application/json",
          "x-folder-id": FOLDER_ID
        },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`API error: ${response.status} - ${text}`);
      return JSON.parse(text);
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

// --- 3. ГЛАВНАЯ ФУНКЦИЯ (МАССОВЫЙ ЦИКЛ v4.0) ---
async function runMassEngineerCycle() {
  console.log("🚀 Запуск AI-Инженера v4.0: Массовая модернизация модулей");

  const pipelineContent = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "Файл не найден";
  const indexContent = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "Файл не найден";
  const processedFiles = getProcessedFiles();

  if (!fs.existsSync(MODULES_DIR)) {
    console.error("❌ Директория модулей не найдена. Проверьте путь ./modules/");
    return;
  }

  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));
  console.log(`📂 Найдено файлов: ${files.length}. Уже обработано: ${processedFiles.length}`);

  for (const fileName of files) {
    if (processedFiles.includes(fileName)) {
      console.log(`⏩ Пропуск ${fileName}: уже в памяти.`);
      continue;
    }

    const filePath = path.join(MODULES_DIR, fileName);
    const currentCode = fs.readFileSync(filePath, "utf8");

    console.log(`\n🛠 Анализ модуля: ${fileName}`);

    const prompt = `
Ты — ведущий инженер-программист. Твоя задача: привести код модуля в соответствие с архитектурным эталоном.

ЭТАЛОН ЛОГИКИ (SYSTEM_PIPELINE.md):
${pipelineContent}

КАРТА СВЯЗЕЙ (MODULE_INDEX.md):
${indexContent}

ТЕКУЩИЙ КОД МОДУЛЯ (${fileName}):
${currentCode}

ЗАДАНИЕ:
1. Проверь наличие заглушек.
2. Внедряй реальную логику и связи согласно эталону.
3. Верни ТОЛЬКО чистый код исправленного файла. Не пиши никаких пояснений, только код Google Apps Script.
`;

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`, 
      completionOptions: { temperature: 0.1, maxTokens: 2500 },
      messages: [
        { role: "system", text: "Ты эксперт по автоматизации строительных расчетов и Google Apps Script. Возвращаешь только чистый код." },
        { role: "user", text: prompt }
      ]
    };

    try {
      const data = await callYandexGPT(payload);
      let updatedCode = data?.result?.alternatives?.[0]?.message?.text || "";

      // Очистка ответа от Markdown-оберток
      updatedCode = updatedCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (!updatedCode || updatedCode.length < 100) {
        console.log(`⚠️ Модуль ${fileName}: ответ пустой или слишком короткий. Пропуск.`);
        continue;
      }

      if (updatedCode.trim() === currentCode.trim()) {
        console.log(`✅ Модуль ${fileName}: код уже соответствует эталону.`);
        saveProcessedFile(fileName);
        continue;
      }

      // Сохраняем результат
      fs.writeFileSync(filePath, updatedCode, "utf8");
      console.log(`📝 Модуль ${fileName} обновлен локально.`);

      // --- БЛОК GIT ДЛЯ КАЖДОГО ФАЙЛА ---
      try {
        execSync("git config user.name 'AI Engineer'");
        execSync("git config user.email 'ai-engineer@pipeline.local'");
        
        execSync("git pull --rebase origin main");
        execSync(`git add ${filePath}`);
        execSync(`git add ${STATE_FILE}`); // Сохраняем память в Git
        execSync(`git commit -m "AI upgrade: ${fileName} (v4.0)"`);
        execSync("git push origin main");

        saveProcessedFile(fileName);
        console.log(`🚀 Изменения для ${fileName} отправлены в репозиторий!`);
      } catch (gitErr) {
        console.error(`⚠️ Git ошибка на файле ${fileName}:`, gitErr.message);
      }

    } catch (err) {
      console.error(`❌ Критическая ошибка при обработке ${fileName}:`, err.message);
      console.log("⏸ Процесс остановлен для сохранения прогресса.");
      process.exit(1); 
    }
  }

  console.log("\n✨ Все модули успешно обработаны!");
}

runMassEngineerCycle();
