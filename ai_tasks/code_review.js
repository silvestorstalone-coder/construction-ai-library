// ai_tasks/code_review.js
import fs from "fs";
import { callYandexGPT } from "../ai_runner.js";

export async function reviewCommits() {
  const files = fs.readdirSync("./modules").filter(f => f.endsWith(".gs"));
  let report = "";

  for (const f of files) {
    const content = fs.readFileSync(`./modules/${f}`, "utf8");
    const payload = {
      modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
      completionOptions: { temperature: 0.2, maxTokens: 500 },
      messages: [{ role: "user", text: `Проанализируй файл ${f} на потенциальные ошибки и напиши краткий отчет` }]
    };
    try {
      const data = await callYandexGPT(payload);
      const review = data?.result?.[0]?.content || "No review generated";
      report += `\n\n=== ${f} ===\n${review}`;
    } catch (e) {
      report += `\n\n=== ${f} ===\nError: ${e.message}`;
    }
  }

  fs.writeFileSync("docs/AI_REVIEW.md", report, "utf8");
  console.log("AI_REVIEW.md обновлён");
}
