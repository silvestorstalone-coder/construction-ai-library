import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";
const API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const PIPELINE_FILE = "./docs/SYSTEM_PIPELINE.md";
const INDEX_FILE = "./docs/MODULE_INDEX.md";
const MODULES_DIR = "./modules/";
const STATE_FILE = "./.ai_state.json";

if (!API_KEY || !FOLDER_ID) {
  console.error("❌ Missing Secrets");
  process.exit(1);
}

// --- СИНХРОНИЗАЦИЯ ПАМЯТИ ---
function syncState() {
  try {
    execSync("git pull origin main --rebase");
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (e) { console.warn("⚠️ State sync warning"); }
  return [];
}

function saveState(processed) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
  try {
    execSync(`git add ${STATE_FILE}`);
    execSync(`git commit -m "AI: sync state" || true`);
  } catch (e) {}
}

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
      return await res.json();
    } catch (err) {
      if (i === MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
}

async function runSafeCycle() {
  console.log("🚀 AI-Инженер v4.4 [Массовая обработка]");
  
  // 1. Актуализируем список обработанных файлов из облака
  let processed = syncState();
  
  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "";
  
  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    // Повторная проверка прямо в цикле
    if (processed.includes(file)) continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Модуль: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.1, maxTokens: 2500 },
      messages: [
        { role: "system", text: "Ты эксперт GAS. Пишешь только код." },
        { role: "user", text: `ЭТАЛОН: ${pipeline}\nИНДЕКС: ${index}\nКОД: ${code}` }
      ]
    };

    try {
      const data = await askAI(payload);
      let newCode = data?.result?.alternatives?.[0]?.message?.text || "";
      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        
        // --- ПОРЯДОК: COMMIT -> PULL -> PUSH ---
        execSync("git config user.name 'github-actions[bot]'");
        execSync("git config user.email 'github-actions[bot]@users.noreply.github.com'");
        
        execSync(`git add ${filePath}`);
        execSync(`git commit -m "AI upgrade: ${file}"`);
        
        // Попытка слияния с минимизацией конфликта в .ai_state.json
        execSync("git pull --rebase origin main -X ours"); 
        
        processed.push(file);
        saveState(processed);
        
        execSync("git push origin main");
        console.log(`✅ ${file} готов.`);
      } else {
        processed.push(file);
        saveState(processed);
        console.log(`ℹ️ ${file} без изменений.`);
        execSync("git push origin main || true");
      }
    } catch (err) {
      console.error(`❌ Сбой на ${file}: ${err.message}`);
      process.exit(1);
    }
  }
}

runSafeCycle();
