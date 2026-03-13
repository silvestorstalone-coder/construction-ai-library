/**
 * ai_runner.js - v5.0 [Жёсткий регламент модернизации]
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
    execSync("git config --global pull.rebase true");
  } catch (e) { console.warn("⚠️ Git config warning"); }
}

function syncState() {
  try {
    console.log("🔄 Синхронизация репозитория...");
    execSync("git reset --hard origin/main");
    execSync("git pull origin main --rebase");
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (e) { console.warn("⚠️ State sync warning:", e.message); }
  return [];
}

function saveState(processed) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
  try {
    execSync(`git add ${STATE_FILE}`);
    execSync(`git commit -m "AI: sync state [skip ci]" || true`);
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
  console.log("🚀 AI-Инженер v5.0 [Режим активной модернизации]");
  
  setupGit();
  let processed = syncState();
  
  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "";
  
  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    if (processed.includes(file)) continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Модернизация модуля: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.2, maxTokens: 4000 },
      messages: [
        { 
          role: "system", 
          text: "Ты ведущий инженер-программист GAS. Твоя задача — МОДЕРНИЗИРОВАТЬ код. " +
                "Сравни КОД с ЭТАЛОНОМ (Pipeline). Если в коде отсутствуют функции или логика из ЭТАЛОНА, " +
                "ПЕРЕПИШИ код полностью, внедрив современные стандарты ES6. " +
                "Выдавай только чистый код без пояснений и Markdown-разметки." 
        },
        { role: "user", text: `ЭТАЛОН: ${pipeline}\n\nИНДЕКС: ${index}\n\nТЕКУЩИЙ КОД:\n${code}` }
      ]
    };

    try {
      const data = await askAI(payload);
      let newCode = data?.result?.alternatives?.[0]?.message?.text || "";
      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        
        execSync(`git add ${filePath}`);
        execSync(`git commit -m "AI upgrade: ${file} to v5.0"`);
        
        execSync("git pull --rebase origin main -X ours"); 
        
        processed.push(file);
        saveState(processed);
        
        execSync("git push origin main");
        console.log(`✅ ${file} успешно модернизирован до v5.0.`);
      } else {
        console.log(`ℹ️ ${file} соответствует эталону. Помечаем.`);
        processed.push(file);
        saveState(processed);
        execSync("git push origin main || true");
      }
    } catch (err) {
      console.error(`❌ Сбой на ${file}: ${err.message}`);
      process.exit(1);
    }
  }
}

runSafeCycle();
