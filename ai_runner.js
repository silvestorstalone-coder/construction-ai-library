const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Получаем все .gs и .md файлы
const repoPath = process.cwd();
const gsFiles = fs.readdirSync(repoPath).filter(f => f.endsWith('.gs'));
const mdFiles = fs.readdirSync(repoPath).filter(f => f.endsWith('.md'));

// Пример функции анализа файла
async function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Отправка в GPT API
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "Ты — инженер Subpodryad AI. Проанализируй код и предложи исправления." },
      { role: "user", content: content }
    ],
    max_tokens: 2000
  }, {
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
  });

  return response.data.choices[0].message.content;
}

async function run() {
  for (const file of gsFiles.concat(mdFiles)) {
    const result = await analyzeFile(path.join(repoPath, file));
    console.log(`Analysis for ${file}:\n`, result);
  }
}

run();
