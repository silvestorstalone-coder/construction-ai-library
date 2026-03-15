/**
 * ai_runner.js - v5.5 STABLE
 * Safe AI modernization runner
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
    execSync("git config --global user.email '41898282+github-actions[bot]@users.noreply.github.com'");
  } catch {
    console.warn("Git config skipped");
  }
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function safeDiff(oldCode, newCode) {
  if (!oldCode) return newCode;
  const diff = Math.abs(oldCode.length - newCode.length) / oldCode.length;
  if (diff > 0.35) {
    console.log("⚠️ AI change rejected (too large diff)");
    return oldCode;
  }
  return newCode;
}

async function askAI(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${API_KEY}`,
      "Content-Type": "application/json",
      "x-folder-id": FOLDER_ID
    },
    body: JSON.stringify(payload)
  });

  return await res.json();
}

async function runSafeCycle() {

  console.log("🚀 AI ENGINE v5.5");

  setupGit();

  const processed = loadState();
  const filesToCommit = [];

  const pipeline = fs.existsSync(PIPELINE_FILE)
    ? fs.readFileSync(PIPELINE_FILE, "utf8")
    : "PIPELINE MISSING";

  const index = fs.existsSync(INDEX_FILE)
    ? fs.readFileSync(INDEX_FILE, "utf8")
    : "INDEX MISSING";

  if (!fs.existsSync(MODULES_DIR)) return;

  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  for (const file of files) {

    if (processed.includes(file) && file !== "finance.gs" && file !== "technology.gs") {
      continue;
    }

    const filePath = path.join(MODULES_DIR, file);
    const oldCode = fs.readFileSync(filePath, "utf8");

    console.log(`🛠 AI modernization: ${file}`);

    const payload = {
      modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
      completionOptions: { temperature: 0.3, maxTokens: 4000 },
      messages: [
        {
          role: "system",
          text: `Ты ведущий инженер Google Apps Script.
Перепиши код на ES6+.

ОБЯЗАТЕЛЬНО:
1. Комментарий // AI Refactored
2. Используй Config.get()
3. Сохрани API функций
4. Выводи только код
Эталон: ${pipeline}`
        },
        { role: "user", text: `INDEX:\n${index}\nCODE:\n${oldCode}` }
      ]
    };

    try {

      const data = await askAI(payload);

      let newCode =
        data?.result?.alternatives?.[0]?.message?.text || "";

      newCode = newCode
        .replace(/```javascript/g, "")
        .replace(/```/g, "")
        .trim();

      newCode = safeDiff(oldCode, newCode);

      if (newCode !== oldCode && newCode.length > 50) {

        fs.writeFileSync(filePath, newCode);

        filesToCommit.push(filePath);

        if (!processed.includes(file)) {
          processed.push(file);
        }

        saveState(processed);

        console.log(`✅ ${file} updated`);

      } else {

        console.log(`ℹ️ ${file} unchanged`);

      }

    } catch (err) {

      console.error(`AI error ${file}:`, err.message);

    }

  }

  if (filesToCommit.length === 0) {
    console.log("ℹ️ No changes");
    return;
  }

  try {

    for (const f of filesToCommit) {
      execSync(`git add "${f}"`);
    }

    execSync(`git add ${STATE_FILE}`);

    execSync(`git commit -m "AI modernization batch v5.5" || echo "Nothing to commit"`);

    execSync("git push origin main");

    console.log("🚀 Push complete");

  } catch (err) {

    console.error("Git error:", err.message);

  }

}

runSafeCycle();
