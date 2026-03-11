// ai_tasks/analyze_repo.js
import fs from "fs";
import path from "path";

export function listFiles(dir, ext = []) {
  let results = [];
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(listFiles(full, ext));
    } else {
      if (ext.length === 0 || ext.includes(path.extname(f))) {
        results.push(full);
      }
    }
  });
  return results;
}

// Пример: собрать все .js и .gs файлы
export function analyzeRepo() {
  const files = listFiles("./", [".js", ".gs"]);
  return files.map(f => {
    const content = fs.readFileSync(f, "utf8");
    return {
      file: f,
      size: content.length,
      functions: (content.match(/function\s+\w+/g) || []).length
    };
  });
}
