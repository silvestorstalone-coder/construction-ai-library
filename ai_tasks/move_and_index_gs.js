const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, "modules");
const DOCS_DIR = path.join(ROOT, "docs");

if (!fs.existsSync(MODULES_DIR)) {
  fs.mkdirSync(MODULES_DIR, { recursive: true });
}

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function findGSFiles(dir) {
  let results = [];

  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {

      if (
        entry.name === ".git" ||
        entry.name === "node_modules" ||
        entry.name === "ai_tasks" ||
        entry.name === ".github" ||
        entry.name === "modules" ||
        entry.name === "docs"
      ) {
        continue;
      }

      results = results.concat(findGSFiles(fullPath));

    } else {

      if (entry.name.endsWith(".gs")) {
        results.push(fullPath);
      }

    }

  }

  return results;
}

function moveFiles(files) {

  for (const file of files) {

    const fileName = path.basename(file);
    const targetPath = path.join(MODULES_DIR, fileName);

    if (file !== targetPath) {

      if (fs.existsSync(targetPath)) {

        const base = path.basename(fileName, ".gs");
        const unique = `${base}_${Date.now()}.gs`;
        const newTarget = path.join(MODULES_DIR, unique);

        console.log(`⚠️ Duplicate module detected: ${fileName} → ${unique}`);

        fs.renameSync(file, newTarget);

      } else {

        fs.renameSync(file, targetPath);

      }

    }

  }

}

function extractFunctions(code) {

  const regex = /function\s+([a-zA-Z0-9_]+)/g;
  const results = [];

  let match;

  while ((match = regex.exec(code)) !== null) {
    results.push(match[1]);
  }

  return results;

}

function buildIndex() {

  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith(".gs"));

  let index = "# MODULE INDEX\n\n";

  for (const file of files) {

    const filePath = path.join(MODULES_DIR, file);
    const code = fs.readFileSync(filePath, "utf8");

    const functions = extractFunctions(code);

    const fnList = functions.slice(0, 15).join(", ");

    index += `## ${file}\n`;
    index += `Functions: ${fnList}\n\n`;

  }

  fs.writeFileSync(path.join(DOCS_DIR, "MODULE_INDEX.md"), index);

}

function main() {

  console.log("Scanning repository for .gs modules...");

  const files = findGSFiles(ROOT);

  console.log(`Found ${files.length} modules`);

  moveFiles(files);

  console.log("Modules moved successfully");

  buildIndex();

  console.log("MODULE_INDEX.md rebuilt");

}

main();
