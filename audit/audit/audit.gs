// audit.gs
/**
 * =====================================================
 * AUDIT MODULE v1.1
 * Production — Подробный аудит и контроль качества
 * Все заголовки на русском
 * =====================================================
 */

var AuditModule = (function() {

 /**
 * Создает полный аудит с подробной информацией
 * @param {object} estimateResult - результат Estimate.process()
 * @param {object} technologyResult - результат Technology.process()
 */
 function createAudit(estimateResult,technologyResult) {
 
 if (!estimateResult || !technologyResult) {
 logWarning("AuditModule:Нет данных для аудита");
 return;
 }

 logInfo("Начало создания аудита...");

 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var auditSheet = ss.getSheetByName("Audit");
 
 if (!auditSheet) {
 auditSheet = ss.insertSheet("Audit");
 }
 auditSheet.clearContents();

 // ===========================
 // ЗАГОЛОВКИ
 // ===========================
 var headers = [
 "№ п/п",
 "Номер строки",
 "Название работы",
 "Нормализованное имя",
 "Ед. изм.",
 "Количество",
 "Цена (руб)",
 "Этап",
 "Подраздел",
 "Норма (чел-ч/ед)",
 "Рассчитанные часы",
 "Источник нормы",
 "Статус"
 ];

 var headerRange = auditSheet.getRange(1,1,1,headers.length);
 headerRange.setValues([headers]);
 headerRange.setFontWeight("bold");
 headerRange.setBackground("#4472C4");
 headerRange.setFontColor("white");
 headerRange.setHorizontalAlignment("CENTER");
 headerRange.setVerticalAlignment("CENTER");

 // ===========================
 // ДАННЫЕ
 // ===========================
 var auditData = [];
 var rowNum = 1;

 // Создаём словарь для быстрого поиска по RowIndex
 var techMap = {};
 if (technologyResult.workStructure && technologyResult.workStructure.length > 0) {
 technologyResult.workStructure.forEach(function(w) {
 techMap[w.rawRowIndex] = w;
 });
 }

 // Проходим по всем работам из Estimate
 estimateResult.worksFlat.forEach(function(work) {
 rowNum++;
 var rowIndex = work.rawRowIndex || 0;
 var techInfo = techMap[rowIndex] || {};
 
 // Определяем статус нормы
 var status = "❌ Не найдена";
 if (techInfo.normSource === "norms_dictionary") {
 status = "✅ Из словаря";
 } else if (techInfo.normSource === "ai_fallback") {
 status = "⚠️ AI fallback";
 }

 auditData.push([
 rowNum - 1,// Нумерация с 1
 rowIndex,
 work.name || "",
 work.normalizedName || "",
 work.unit || "",
 work.quantity || 0,
 (work.price || 0).toFixed(2),
 work.section || "",
 work.subsection || "",
 (techInfo.norm || 0).toFixed(4),
 (techInfo.hours || 0).toFixed(2),
 techInfo.normSource || "not_found",
 status
 ]);
 });

 // Записываем данные
 if (auditData.length > 0) {
 auditSheet.getRange(2,1,auditData.length,headers.length).setValues(auditData);
 }

 // ===========================
 // ФОРМАТИРОВАНИЕ
 // ===========================
 _formatAuditSheet(auditSheet,auditData.length,headers.length);

 // ===========================
 // СТАТИСТИКА
 // ===========================
 var statsRow = auditData.length + 3;
 _addStatistics(auditSheet,statsRow,estimateResult,technologyResult,techMap);

 logInfo(`✅ Аудит создан для ${auditData.length} работ`);
 }

 /**
 * Форматирование листа
 */
 function _formatAuditSheet(sheet,dataRows,colCount) {
 
 // Авто-размер колонок
 for (var i = 1; i <= colCount; i++) {
 sheet.autoResizeColumn(i);
 }

 // Чередующийся цвет строк (зебра)
 for (var row = 2; row <= dataRows + 1; row++) {
 var bgColor = (row % 2 === 0) ? "#F2F2F2" :"#FFFFFF";
 sheet.getRange(row,1,1,colCount).setBackground(bgColor);
 }

 // Центрирование цифр
 sheet.getRange(2,1,dataRows,3).setHorizontalAlignment("CENTER");
 sheet.getRange(2,5,dataRows,1).setHorizontalAlignment("CENTER");
 sheet.getRange(2,6,dataRows,3).setHorizontalAlignment("RIGHT");
 sheet.getRange(2,10,dataRows,3).setHorizontalAlignment("RIGHT");

 // Высота заголовка
 sheet.setRowHeight(1,30);
 }

 /**
 * Добавляет статистику в конец листа
 */
 function _addStatistics(sheet,startRow,estimateResult,technologyResult,techMap) {
 
 var statsData = [];
 
 // Разделитель
 statsData.push(["","","","","","","","","","","",""]);
 statsData.push(["СТАТИСТИКА АУДИТА","","","","","","","","","","",""]);
 statsData.push(["","","","","","","","","","","",""]);

 // Общие показатели
 statsData.push(["Показатель","Значение","","","","","","","","","",""]);
 
 var totalWorks = estimateResult.worksFlat.length;
 var worksWithNorm = 0;
 var worksWithoutNorm = 0;
 var totalHours = 0;
 var totalPrice = 0;

 estimateResult.worksFlat.forEach(function(work) {
 var techInfo = techMap[work.rawRowIndex];
 if (techInfo && techInfo.hours > 0) {
 worksWithNorm++;
 } else {
 worksWithoutNorm++;
 }
 totalHours += (techInfo ? techInfo.hours :0);
 totalPrice += (work.price || 0);
 });

 statsData.push(["Всего работ",totalWorks,"","","","","","","","","",""]);
 statsData.push(["Работ с нормой",worksWithNorm,"","","","","","","","","",""]);
 statsData.push(["Работ без нормы",worksWithoutNorm,"","","","","","","","","",""]);
 statsData.push(["Покрытие нормами (%)",(totalWorks > 0 ? 
 Math.round((worksWithNorm / totalWorks) * 100) :0),"","","","","","","","","",""]);
 
 statsData.push(["","","","","","","","","","","",""]);
 statsData.push(["Всего часов",totalHours.toFixed(2),"","","","","","","","","",""]);
 statsData.push(["Рабочих (расчёт)",technologyResult.workers,"","","","","","","","","",""]);
 statsData.push(["Общая стоимость работ",totalPrice.toFixed(2),"","","","","","","","","",""]);

 if (technologyResult.stats) {
 statsData.push(["","","","","","","","","","","",""]);
 statsData.push(["Источники норм","","","","","","","","","","",""]);
 statsData.push(["Из словаря",technologyResult.stats.normSources.norms_dictionary || 0,"","","","","","","","","",""]);
 statsData.push(["AI fallback",technologyResult.stats.normSources.ai_fallback || 0,"","","","","","","","","",""]);
 statsData.push(["Не найдено",technologyResult.stats.normSources.not_found || 0,"","","","","","","","","",""]);
 }

 // Записываем статистику
 var statsRange = sheet.getRange(startRow,1,statsData.length,12);
 statsRange.setValues(statsData);

 // Форматирование статистики
 var statHeaderRow = startRow + 2;
 sheet.getRange(statHeaderRow + 1,1,1,2).setFontWeight("bold").setBackground("#D9E2F3");
 sheet.getRange(statHeaderRow + 2,1,statsData.length - 4,2).setBackground("#F0F0F0");

 logInfo("✅ Статистика добавлена");
 }

 /**
 * Получить сводку аудита (для логирования)
 */
 function getAuditSummary(estimateResult,technologyResult) {
 var totalWorks = estimateResult.worksFlat.length;
 var totalHours = technologyResult.totalHours;
 var coverage = technologyResult.stats.coveragePercent;
 
 return {
 totalWorks:totalWorks,
 totalHours:totalHours,
 coverage:coverage,
 workers:technologyResult.workers,
 timestamp:new Date().toString()
 };
 }

 /**
 * Логирование
 */
 function logInfo(msg) {
 if (typeof Logger !== "undefined") Logger.log("[AUDIT] " + msg);
 else console.log("[AUDIT] " + msg);
 }

 function logWarning(msg) {
 if (typeof Logger !== "undefined") Logger.log("[AUDIT_WARN] " + msg);
 else console.warn("[AUDIT_WARN] " + msg);
 }

 // ===========================
 // PUBLIC API
 // ===========================
 return {
 createAudit:createAudit,
 getAuditSummary:getAuditSummary
 };

})();
