/**
 * ai_runner.js - v5.2 [FORCE REWRITE & DEBUG]
 */
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

function setupGit() {
  try {
    execSync("git config --global user.name 'github-actions[bot]'");
    execSync("git config --global user.email 'github-actions[bot]@users.noreply.github.com'");
  } catch (e) { console.warn("⚠️ Git config warning"); }
}

function syncState() {
  try {
    execSync("git reset --hard origin/main");
    execSync("git pull origin main --rebase");
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (e) {}
  return [];
}

async function askAI(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Authorization": `Api-Key ${API_KEY}`, "Content-Type": "application/json", "x-folder-id": FOLDER_ID },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function runSafeCycle() {
  console.log("🚀 AI-Инженер v5.2 [FORCE MODE]");
  setupGit();
  let processed = syncState();
  
  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "MISSING";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "MISSING";
  
  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    // Принудительно обрабатываем finance.gs для теста, остальных по списку
    if (processed.includes(file) && file !== 'finance.gs') continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Анализ: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.7, maxTokens: 4000 },
      messages: [
        { 
          role: "system", 
          text: `Ты — ведущий инженер. Твоя задача: ПЕРЕПИСАТЬ код на ES6+. 
          ОБЯЗАТЕЛЬНО: Начни код с комментария // AI Refactored: ${new Date().toISOString()}.
          Используй правила из ЭТАЛОНА. Выдавай ТОЛЬКО чистый код.` 
        },
        { role: "user", text: `ЭТАЛОН: ${pipeline}\nИНДЕКС: ${index}\nКОД:\n${code}` }
      ]
    };

    try {
      const data = await askAI(payload);
      let newCode = data?.result?.alternatives?.[0]?.message?.text || "";
      
      // LOG DEBUG
      console.log(`🔍 Ответ для ${file}: ${newCode.substring(0, 100).replace(/\n/g, ' ')}...`);

      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        execSync(`git add ${filePath}`);
        execSync(`git commit -m "AI upgrade: ${file} (v5.2 force)" || true`);
        execSync("git pull --rebase origin main -X ours"); 
        execSync("git push origin main");
        
        if (!processed.includes(file)) processed.push(file);
        fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
        console.log(`✅ ${file} ОБНОВЛЕН.`);
      } else {
        console.log(`ℹ️ ${file}: Изменений нет или отказ ИИ.`);
      }
    } catch (err) {
      console.error(`❌ Ошибка на ${file}: ${err.message}`);
    }
  }
}

runSafeCycle();
