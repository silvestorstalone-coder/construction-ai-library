// ai_tasks/update_docs.js
import fs from "fs";
import { callYandexGPT } from "../ai_runner.js";

export async function updateSystemDocs() {
  const files = ["docs/SYSTEM_PIPELINE.md", "docs/SYSTEM_ARCHITECTURE.md", "docs/MODULE_INDEX.md"];
  for (const file of files) {
    const payload = {
      modelUri: process.env.YANDEX_FOLDER_ID ? `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite` : "",
      completionOptions: { temperature: 0.2, maxTokens: 1000 },
      messages: [{ role: "user", text: `Обнови файл ${file} с актуальной структурой AI pipeline` }]
    };
    try {
      const data = await callYandexGPT(payload);
      const text = data?.result?.[0]?.content || "";
      if (text && text.length > 20) {
        fs.writeFileSync(file, text, "utf8");
        console.log(`${file} обновлён`);
      }
    } catch (e) {
      console.error(`Ошибка обновления ${file}: ${e.message}`);
    }
  }
}
