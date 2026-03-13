import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// --- ПРОВЕРКА СРЕДЫ (Чтобы GitHub не ругался на fetch) ---
if (parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: Требуется Node.js v18+. Обновите workflow (node-version: 20).");
  process.exit(1);
}

const API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";
const API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const PIPELINE_FILE = "./docs/SYSTEM_PIPELINE.md";
const INDEX_FILE = "./docs/MODULE_INDEX.md";
const MODULES_DIR = "./modules/";
const STATE_FILE = "./.ai_state.json";

if (!API_KEY || !FOLDER_ID) {
  console.error("❌ ОШИБКА: Отсутствуют YANDEX_API_KEY или YANDEX_FOLDER_ID в Secrets.");
  process.exit(1);
}

// --- 1. ПАМЯТЬ (STATE) ---
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (e) { return []; }
  }
  return [];
}

function saveToState(fileName) {
  const state = loadState();
  if (!state.includes(fileName)) {
    state.push(fileName);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }
}

// --- 2. СЕТЕВОЙ БЛОК (RETRY) ---
async function askAI(payload) {
  const MAX_RETRIES = 3;
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Api-Key ${API_KEY}`,
          "Content-Type": "application/json",
          "x-folder-id": FOLDER_ID
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "API Error");
      return data;
    } catch (err) {
      console.warn(`⚠️ Попытка ${i} не удалась: ${err.message}`);
      if (i === MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
}

// --- 3. ГЛАВНЫЙ ПРОЦЕСС ---
async function startMassUpgrade() {
  console.log("🚀 Запуск Массового ИИ-Инженера v4.2");

  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "";
  const processed = loadState();

  if (!fs.existsSync(MODULES_DIR)) {
    console.error("❌ Папка ./modules/ не найдена.");
    return;
  }

  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    if (processed.includes(file)) {
      console.log(`⏩ ${file} уже обработан. Пропуск.`);
      continue;
    }

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`\n🛠 Анализ: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.1, maxTokens: 2500 },
      messages: [
        { role: "system", text: "Ты эксперт Google Apps Script. Возвращаешь только чистый код." },
        { role: "user", text: `ЭТАЛОН: ${pipeline}\nИНДЕКС: ${index}\nКОД: ${code}\n\nЗАДАНИЕ: Обнови код по эталону. Удали заглушки. Только код.` }
      ]
    };

    try {
      const result = await askAI(payload);
      let newCode = result?.result?.alternatives?.[0]?.message?.text || "";
      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode !== code && newCode.length > 50) {
        fs.writeFileSync(filePath, newCode, "utf8");
        
        // Git секция
        execSync("git config user.name 'AI Engineer'");
        execSync("git config user.email 'ai-engineer@pipeline.local'");
        execSync("git pull --rebase origin main");
        execSync(`git add ${filePath}`);
        execSync(`git add ${STATE_FILE}`);
        execSync(`git commit -m "AI upgrade: ${file} (v4.2)"`);
        execSync("git push origin main");

        saveToState(file);
        console.log(`✅ ${file} обновлен и запушен.`);
      } else {
        console.log(`ℹ️ ${file} не требует правок.`);
        saveToState(file);
        // Пушим состояние даже если код не меняли, чтобы не проверять заново
        execSync(`git add ${STATE_FILE}`);
        execSync(`git commit -m "AI check: ${file} (no changes)" || true`);
        execSync("git push origin main || true");
      }
    } catch (err) {
      console.error(`❌ Сбой на ${file}: ${err.message}`);
      process.exit(1); 
    }
  }
  console.log("\n🏁 Все модули обработаны успешно.");
}

startMassUpgrade();
