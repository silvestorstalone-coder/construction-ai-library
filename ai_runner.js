/**
 * ai_runner.js
 * Подключение к Яндекс GPT для проверки и обновления модулей
 * Расположение: корень репозитория
 */

import fs from 'fs';
import { Octokit } from "@octokit/rest";
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// GitHub
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const REPO_OWNER = "silvestorstalone-coder";
const REPO_NAME = "construction-ai-library";
const BRANCH = "main";

// Яндекс GPT
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;
const YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

// Получение списка .gs модулей
function getGSModules() {
  const files = fs.readdirSync('./');
  return files.filter(f => f.endsWith('.gs'));
}

// Чтение SYSTEM_PIPELINE.md
function getPipeline() {
  return fs.readFileSync('SYSTEM_PIPELINE.md', 'utf8');
}

// Запрос к Яндекс GPT
async function queryYandexGPT(prompt) {
  const response = await fetch(YANDEX_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Api-Key ${YANDEX_API_KEY}`,
      'Content-Type': 'application/json',
      'x-folder-id': YANDEX_FOLDER_ID
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.2
    })
  });

  const data = await response.json();
  return data?.result?.[0]?.content || "";
}

// Обновление SYSTEM_PIPELINE.md
async function updatePipeline() {
  const modules = getGSModules();
  const pipelineText = getPipeline();

  const prompt = `
У меня есть следующие модули JS/Apps Script: ${modules.join(', ')}.
Вот текущий SYSTEM_PIPELINE.md:
${pipelineText}

Обнови SYSTEM_PIPELINE.md, чтобы были отражены все модули, их последовательность и выходные модели.
Сохрани формат Markdown.
`;

  const updatedText = await queryYandexGPT(prompt);
  fs.writeFileSync('SYSTEM_PIPELINE.md', updatedText, 'utf8');
  console.log('SYSTEM_PIPELINE.md обновлён через Яндекс GPT');
}

// Коммит изменений через GitHub
async function commitChanges() {
  const fileContent = fs.readFileSync('SYSTEM_PIPELINE.md', 'utf8');
  const base64Content = Buffer.from(fileContent).toString('base64');

  const { data: fileData } = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: 'SYSTEM_PIPELINE.md',
    ref: BRANCH
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: 'SYSTEM_PIPELINE.md',
    message: 'Обновление SYSTEM_PIPELINE.md через ИИ',
    content: base64Content,
    sha: fileData.sha,
    branch: BRANCH
  });

  console.log('Коммит изменений выполнен');
}

// Основной запуск
async function main() {
  await updatePipeline();
  await commitChanges();
}

main().catch(err => console.error(err));