// ai_runner.js

import fs from "fs";
import { execSync } from "child_process";

const API_URL =
  "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

const GH_TOKEN = process.env.GH_TOKEN;
const API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const TARGET_FILE = "./docs/SYSTEM_PIPELINE.md";

if (!API_KEY || !FOLDER_ID) {
  console.error("Missing Yandex credentials");
  process.exit(1);
}

// Чтение старого файла
let oldContent = "";

if (fs.existsSync(TARGET_FILE)) {
  oldContent = fs.readFileSync(TARGET_FILE, "utf8");
}

// Prompt для AI
const prompt = `
Обнови файл SYSTEM_PIPELINE.md.

Требования:
- описать архитектуру AI pipeline
- GitHub Actions
- YandexGPT integration
- структура модулей
- CI/CD поток

Ответ должен быть только содержимым markdown файла.
`;

// Payload
const payload = {
  modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite/latest`,
  completionOptions: {
    temperature: 0.2,
    maxTokens: 1500
  },
  messages: [
    {
      role: "system",
      text: "Ты инженер DevOps и AI pipeline."
    },
    {
      role: "user",
      text: prompt
    }
  ]
};

// Retry функция
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

      if (!response.ok) {
        console.error("API error:", response.status);
        console.error(text);
        throw new Error("Yandex API error");
      }

      const data = JSON.parse(text);

      return data;

    } catch (err) {

      console.error(`Attempt ${attempt} failed:`, err.message);

      if (attempt === MAX_RETRIES) {
        throw err;
      }

      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

// Обновление файла
async function updateFile() {

  let data;

  try {
    data = await callYandexGPT();
  } catch (err) {
    console.error("Yandex GPT request failed:", err.message);
    return;
  }

  console.log("Raw response:", JSON.stringify(data, null, 2));

  const updatedText =
    data?.result?.alternatives?.[0]?.message?.text || "";

  if (!updatedText || updatedText.trim().length < 50) {
    console.log("AI response empty — skipping update");
    return;
  }

  if (updatedText.trim() === oldContent.trim()) {
    console.log("No changes detected");
    return;
  }

  fs.writeFileSync(TARGET_FILE, updatedText, "utf8");

  console.log("File updated:", TARGET_FILE);

  try {

    execSync("git config user.name 'AI Pipeline'");
    execSync("git config user.email 'ai@pipeline.local'");

    execSync(`git add ${TARGET_FILE}`);

    execSync(`git commit -m "AI: update SYSTEM_PIPELINE.md"`);

    execSync("git push");

    console.log("Changes pushed");

  } catch (err) {

    console.error("Git commit failed:", err.message);
  }
}

updateFile();
