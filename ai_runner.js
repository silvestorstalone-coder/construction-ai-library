// ai_runner.js
import fs from "fs";
import fetch from "node-fetch";
import { execSync } from "child_process";

const YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

const GH_TOKEN = process.env.GH_TOKEN;
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

// Путь к файлу, который обновляем
const TARGET_FILE = "./docs/SYSTEM_PIPELINE.md";

// Чтение текущего содержимого
let oldContent = "";
if (fs.existsSync(TARGET_FILE)) {
  oldContent = fs.readFileSync(TARGET_FILE, "utf8");
}

// Payload для Yandex GPT
const payload = {
  modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
  completionOptions: { temperature: 0.2, maxTokens: 1000 },
  messages: [
    { role: "user", text: "Обнови SYSTEM_PIPELINE.md с актуальной структурой AI pipeline" }
  ]
};

// Retry-механизм
async function callYandexGPT(payload) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(YANDEX_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Api-Key ${YANDEX_API_KEY}`,
          "Content-Type": "application/json",
          "x-folder-id": YANDEX_FOLDER_ID
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Yandex GPT request failed after retries");
}

// Основная функция обновления файла
async function updateFile() {
  let data;
  try {
    data = await callYandexGPT(payload);
  } catch (e) {
    console.error("Ошибка запроса к Yandex GPT:", e.message);
    return;
  }

  const updatedText = data?.result?.[0]?.content || "";

  // Защита от пустого ответа
  if (!updatedText || updatedText.trim().length < 20) {
    console.log("AI ответ пустой. Файл не обновляется.");
    return;
  }

  // Проверка изменений
  if (oldContent === updatedText) {
    console.log("Изменений нет");
    return;
  }

  // Запись файла
  fs.writeFileSync(TARGET_FILE, updatedText, "utf8");
  console.log(`${TARGET_FILE} обновлён через Яндекс GPT`);

  // Commit изменений
  try {
    execSync("git config user.name 'AI Pipeline'");
    execSync("git config user.email 'ai@pipeline.local'");
    execSync(`git add ${TARGET_FILE}`);
    execSync(`git commit -m "Обновление SYSTEM_PIPELINE.md через Yandex GPT"`);
    execSync("git push");
    console.log("Коммит изменений выполнен");
  } catch (e) {
    console.error("Ошибка при коммите:", e.message);
  }
}

// Запуск
updateFile();
