import fs from "fs";
import path from "path";

/**
 * AI SCANNER v1.0
 * Задача: Выявление структуры сметы и поиск "мусорных" строк
 */
const ROOT_DIR = process.cwd();
const MODULES_PATH = path.join(ROOT_DIR, "modules");

function scanForLogicErrors() {
    console.log("🔍 Запуск глубокого сканирования модулей...");
    
    const files = fs.readdirSync(MODULES_PATH).filter(f => f.endsWith('.gs'));
    let report = {
        missingDependencies: [],
        potentialDeadlocks: [],
        headerRisk: false
    };

    files.forEach(file => {
        const content = fs.readFileSync(path.join(MODULES_PATH, file), 'utf-8');
        
        // Поиск жестко заданных индексов строк (Риск для "Сложной сметы")
        if (content.includes("getRange(35") || content.includes("getRange(1, 1, 1, 16)")) {
            report.headerRisk = true;
        }
    });

    if (report.headerRisk) {
        console.warn("⚠️ ВНИМАНИЕ: Обнаружены жесткие ссылки на строки. Сложная смета (строка 35) может не обработаться!");
    }

    fs.writeFileSync('./logs/scan_report.json', JSON.stringify(report, null, 2));
    console.log("✅ Отчет сканирования сохранен в ./logs/scan_report.json");
}

scanForLogicErrors();
