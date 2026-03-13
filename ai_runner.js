/**
 * ai_runner.js - v5.3 [MODERNIZATION & SANITY CHECK]
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
  console.log("🚀 AI-Инженер v5.3 [REFACTORING MODE]");
  setupGit();
  let processed = syncState();
  
  const pipeline = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "MISSING";
  const index = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "MISSING";
  
  if (!fs.existsSync(MODULES_DIR)) return;
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {
    // Обработка критических файлов и новых из списка
    if (processed.includes(file) && file !== 'finance.gs' && file !== 'technology.gs') continue;

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 Модернизация модуля: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.3, maxTokens: 4000 }, // Снижена температура для точности расчетов
      messages: [
        { 
          role: "system", 
          text: `Ты — ведущий инженер GAS. Твоя задача: ПОЛНОСТЬЮ ПЕРЕПИСАТЬ код на ES6+.
          
          ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
          1. В начале добавь комментарий: // AI Refactored: ${new Date().toISOString()}
          2. Модуль FINANCE: Используй Config.get('hourly_rate'), 'tax_multiplier', 'overhead_multiplier'. Итог: (DirectCosts * overhead) * tax.
          3. Модуль TECHNOLOGY: Внедрить Sanity Check. Если норма на единицу > 100 чел/час — это ошибка, используй ГЭСН-аналоги. Дели сложные сметные строки на подобъекты.
          4. ИСПОЛЬЗУЙ ЭТАЛОН: ${pipeline}
          5. ВЫДАВАЙ ТОЛЬКО ЧИСТЫЙ КОД (без markdown и пояснений).` 
        },
        { role: "user", text: `ТЕКУЩИЙ ИНДЕКС: ${index}\n\nКОД ДЛЯ ОБРАБОТКИ:\n${code}` }
      ]
    };

    try {
      const data = await askAI(payload);
      let newCode = data?.result?.alternatives?.[0]?.message?.text || "";
      
      console.log(`🔍 Ответ для ${file}: ${newCode.substring(0, 100).replace(/\n/g, ' ')}...`);

      newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

      if (newCode && newCode.length > 50 && newCode !== code) {
        fs.writeFileSync(filePath, newCode, "utf8");
        execSync(`git add ${filePath}`);
        execSync(`git commit -m "AI upgrade: ${file} (v5.3 refactor)" || true`);
        execSync("git pull --rebase origin main -X ours"); 
        execSync("git push origin main");
        
        if (!processed.includes(file)) processed.push(file);
        fs.writeFileSync(STATE_FILE, JSON.stringify(processed, null, 2));
        console.log(`✅ ${file} успешно обновлен.`);
      } else {
        console.log(`ℹ️ ${file}: Изменений не требуется.`);
      }
    } catch (err) {
      console.error(`❌ Ошибка на ${file}: ${err.message}`);
    }
  }
}

runSafeCycle();
