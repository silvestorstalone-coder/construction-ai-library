import fs from "fs";
import path from "path";
import { execSync } from "child_process";

if (parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error("❌ Node.js v18+ required.");
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
  console.error("❌ Missing Secrets (API_KEY/FOLDER_ID)");
  process.exit(1);
}

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
      if (i === MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
}

async function startMassUpgrade() {
  console.log("🚀 AI-Инженер v4.3: Синхронизация...");
  
  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "";
  const processed = loadState();

  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    if (processed.includes(file)) continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Обработка: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.1, maxTokens: 2500 },
      messages: [
        { role: "system", text: "Ты эксперт Google Apps Script. Пишешь только код." },
        { role: "user", text: `ЭТАЛОН: ${pipeline}\nИНДЕКС: ${index}\nКОД: ${code}\nЗАДАНИЕ: Обнови код по эталону без заглушек.` }
      ]
    };

    try {
      const result = await askAI(payload);
      let newCode = result?.result?.alternatives?.[0]?.message?.text || "";
      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        
        // --- БЕЗОПАСНЫЙ GIT ЦИКЛ ---
        try {
          execSync("git config user.name 'AI Engineer'");
          execSync("git config user.email 'ai-engineer@pipeline.local'");
          
          // Сначала фиксируем свое
          execSync(`git add ${filePath}`);
          saveToState(file);
          execSync(`git add ${STATE_FILE}`);
          execSync(`git commit -m "AI upgrade: ${file}"`);
          
          // Затем объединяем с облаком
          execSync("git pull --rebase origin main");
          execSync("git push origin main");
          
          console.log(`✅ ${file} успешно синхронизирован.`);
        } catch (gitErr) {
          console.warn(`⚠️ Git конфликт на ${file}, пропускаем шаг.`);
          // В случае ошибки не прерываем весь процесс
        }
      } else {
        saveToState(file); // Помечаем как проверенный даже без правок
        console.log(`ℹ️ ${file} ок.`);
      }
    } catch (err) {
      console.error(`❌ Ошибка на ${file}: ${err.message}`);
      process.exit(1); 
    }
  }
}

startMassUpgrade();
