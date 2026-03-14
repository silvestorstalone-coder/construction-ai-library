/**
 * ai_runner.js - v5.4 [MODERNIZATION & SANITY CHECK]
 * Исправлено: Git push вынесен из цикла + безопасный pre-flight
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
  } catch (e) {
    console.warn("⚠️ Git config warning");
  }
}

function syncState() {
  try {
    execSync("git fetch origin main");
    execSync("git reset --hard origin/main");
    execSync("git pull origin main --rebase");
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (e) {}
  return [];
}

async function askAI(payload) {
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
}

async function runSafeCycle() {
  console.log("🚀 AI-Инженер v5.4 [REFACTORING MODE]");
  setupGit();
  let processed = syncState();
  const filesToCommit = [];

  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "MISSING";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "MISSING";

  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    if (processed.includes(file) && file !== 'finance.gs' && file !== 'technology.gs') continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Модернизация модуля: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.3, maxTokens: 4000 },
      messages: [
        {
          role: "system",
          text: `Ты — ведущий инженер GAS. ПОЛНОСТЬЮ ПЕРЕПИШИ код на ES6+.
          
          ОБЯЗАТЕЛЬНО:
          1. В начале комментарий: // AI Refactored: ${new Date().toISOString()}
          2. FINANCE: Config.get('hourly_rate'), 'tax_multiplier', 'overhead_multiplier'
          3. TECHNOLOGY: Sanity Check, деление сложных сметных строк
          4. ЭТАЛОН: ${pipeline}
          5. Выдавай только чистый код`
        },
        { role: "user", text: `Индекс: ${index}\nКод:\n${code}` }
      ]
    };

    try {
      const data = await askAI(payload);
      let newCode = data?.result?.alternatives?.[0]?.message?.text || "";
      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        filesToCommit.push(filePath);
        if (!processed.includes(file)) processed.push(file);
        fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
        console.log(`✅ ${file} обновлен.`);
      } else {
        console.log(`ℹ️ ${file}: изменений не требуется.`);
      }
    } catch (err) {
      console.error(`❌ Ошибка на ${file}: ${err.message}`);
    }
  }

  // =======================
  // Batch commit + push
  // =======================
  if (filesToCommit.length > 0) {
    try {
      // Pre-flight check: один git add на файл
      for (const f of filesToCommit) {
        execSync(`git add "${f}"`);
      }

      execSync(`git commit -m "AI upgrade: batch refactor v5.4" || echo "Nothing to commit"`);

      // Синхронизация с origin/main
      execSync("git pull --rebase origin main -X ours");
      execSync("git push origin main");
      console.log("🚀 Batch commit и push выполнены успешно.");
    } catch (err) {
      console.error(`❌ Batch git error: ${err.message}`);
    }
  } else {
    console.log("ℹ️ Нет изменений для commit/push");
  }
}

runSafeCycle();
