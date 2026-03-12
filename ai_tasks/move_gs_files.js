import fs from "fs";
import path from "path";

const ROOT = "./";       // корень репозитория
const TARGET = "./modules";

if (!fs.existsSync(TARGET)) fs.mkdirSync(TARGET);

function moveGSFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory() && fullPath !== TARGET) {
      moveGSFiles(fullPath);
    } else if (e.isFile() && e.name.endsWith(".gs")) {
      const dest = path.join(TARGET, e.name);
      fs.renameSync(fullPath, dest); // перемещаем, а не копируем
      console.log(`Moved ${fullPath} → ${dest}`);
    }
  }
}

moveGSFiles(ROOT);
