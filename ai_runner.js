import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";
const API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const PIPELINE_FILE = "./docs/SYSTEM_PIPELINE.md";
const INDEX_FILE = "./docs/MODULE_INDEX.md";
const TARGET_MODULE = "./modules/finance.gs"; // Модуль, который мы будем "лечить"

if (!API_KEY || !FOLDER_ID) {
  console.error("Missing Yandex credentials");
  process.exit(1);
}

// --- 1. СБОР КОНТЕКСТА (То, что видит ИИ) ---
const pipelineContent = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, "utf8") : "Файл не найден";
const indexContent = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf8") : "Файл не найден";
const currentCode = fs.existsSync(TARGET_MODULE) ? fs.readFileSync(TARGET_MODULE, "utf8") : "";

const prompt = `
Ты — ведущий инженер-программист. Твоя задача: привести код модуля в соответствие с архитектурным эталоном.

ЭТАЛОН ЛОГИКИ (SYSTEM_PIPELINE.md):
${pipelineContent}

КАРТА СВЯЗЕЙ (MODULE_INDEX.md):
${indexContent}

ТЕКУЩИЙ КОД МОДУЛЯ (${TARGET_MODULE}):
${currentCode}

ЗАДАНИЕ:
1. Проверь наличие заглушек (например, "materialsCost = 0").
2. На основе карты связей (где Finance зависит от Estimate), внедри реальный расчет:
   - materialsCost должен считаться как сумма (work.price * work.quantity) из estimateResult.totalWorksList.
3. Верни ТОЛЬКО чистый код исправленного файла. Не пиши никаких пояснений, только код Google Apps Script.
`;

const payload = {
  modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`, 
  completionOptions: { temperature: 0.1, maxTokens: 2500 },
  messages: [
    { role: "system", text: "Ты эксперт по автоматизации строительных расчетов и Google Apps Script." },
    { role: "user", text: prompt }
  ]
};

// --- 2. СЕТЕВОЙ БЛОК (Retry логика) ---
async function callYandexGPT() {
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

// --- 3. ГЛАВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ---
async function runEngineerCycle() {
  console.log("🚀 AI Инженер начинает анализ модуля: " + TARGET_MODULE);

  try {
    const data = await callYandexGPT();
    let updatedCode = data?.result?.alternatives?.[0]?.message?.text || "";

    // Очистка ответа от Markdown-оберток
    updatedCode = updatedCode.replace(/```javascript/g, "").replace(/```/g, "").trim();

    if (!updatedCode || updatedCode.length < 100) {
      console.log("⚠️ Ответ пустой или слишком короткий — отмена.");
      return;
    }

    if (updatedCode.trim() === currentCode.trim()) {
      console.log("✅ Код уже соответствует эталону.");
      return;
    }

    // Сохраняем результат локально
    fs.writeFileSync(TARGET_MODULE, updatedCode, "utf8");
    console.log("📝 Файл обновлен локально.");

    // --- БЛОК GIT С ЗАЩИТОЙ ОТ КОНФЛИКТОВ ---
    try {
      execSync("git config user.name 'AI Engineer'");
      execSync("git config user.email 'ai-engineer@pipeline.local'");
      
      // Забираем изменения, чтобы избежать конфликта в INDEX.md
      execSync("git pull --rebase origin main");

      execSync(`git add ${TARGET_MODULE}`);
      execSync(`git commit -m "AI: автоматическое внедрение логики в ${path.basename(TARGET_MODULE)}"`);
      execSync("git push origin main");

      console.log("🚀 Изменения успешно отправлены в репозиторий!");
    } catch (gitErr) {
      console.error("⚠️ Ошибка Git (возможно, нет прав или конфликт):", gitErr.message);
    }

  } catch (err) {
    console.error("❌ Критическая ошибка в цикле инженера:", err.message);
  }
}

runEngineerCycle();
