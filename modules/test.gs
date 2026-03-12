// test.gs
/**
 * =====================================================
 * ТЕСТИРОВАНИЕ AUDIT — ДОБАВИТЬ В КОНЕЦ main.gs
 * =====================================================
 */

function testAuditDiagnostics() {
 console.log("═══════════════════════════════════════════");
 console.log("🔍 AUDIT DIAGNOSTICS STARTED");
 console.log("═══════════════════════════════════════════");
 
 // 1. Проверяем Estimate
 console.log("✓ Step 1:Checking Estimate module...");
 try {
 var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 var estimate = Estimate.process(sheet,{ mode:'simple' });
 console.log(`✅ Estimate OK. Works:${estimate.totalWorks}`);
 } catch (e) {
 console.error(`❌ Estimate failed:${e.message}`);
 return;
 }
 
 // 2. Проверяем Technology
 console.log("✓ Step 2:Checking Technology module...");
 try {
 var tech = Technology.process(estimate);
 console.log(`✅ Technology OK. Hours:${tech.totalHours}`);
 } catch (e) {
 console.error(`❌ Technology failed:${e.message}`);
 return;
 }
 
 // 3. Проверяем AuditModule
 console.log("✓ Step 3:Checking AuditModule...");
 if (typeof AuditModule === 'undefined') {
 console.error("❌ AuditModule is NOT defined!");
 return;
 } else {
 console.log("✅ AuditModule is defined");
 }
 
 // 4. Пытаемся создать аудит
 console.log("✓ Step 4:Creating audit sheet...");
 try {
 AuditModule.createAudit(estimate,tech);
 console.log("✅ Audit sheet CREATED successfully!");
 } catch (e) {
 console.error(`❌ Audit creation failed:${e.message}`);
 return;
 }
 
 // 5. Проверяем обновление
 console.log("✓ Step 5:Verifying audit sheet...");
 try {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var auditSheet = ss.getSheetByName("Audit");
 if (auditSheet) {
 console.log(`✅ 'Audit' sheet EXISTS`);
 console.log(`✅ Rows:${auditSheet.getMaxRows()},Columns:${auditSheet.getMaxColumns()}`);
 } else {
 console.error("❌ 'Audit' sheet NOT FOUND!");
 }
 } catch (e) {
 console.error(`❌ Verification error:${e.message}`);
 }
 
 console.log("═══════════════════════════════════════════");
 console.log("✅ TEST COMPLETE");
 console.log("═══════════════════════════════════════════");
}

function simpleTestAudit() {
 console.log("🧪 Starting simple audit test...");
 
 try {
 var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 var estimate = Estimate.process(sheet,{ mode:'simple' });
 var tech = Technology.process(estimate);
 
 if (typeof AuditModule === 'undefined') {
 console.error("❌ AuditModule not found");
 return;
 }
 
 AuditModule.createAudit(estimate,tech);
 console.log("✅ Audit created - check 'Audit' sheet");
 
 } catch (e) {
 console.error("❌ Error:" + e.message);
 }
}

function showAllSheets() {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheets = ss.getSheets();
 
 console.log("═════════════════════════════════════════");
 console.log("ALL SHEETS:");
 console.log("═════════════════════════════════════════");
 
 sheets.forEach(function(sheet,i) {
 console.log(`${i + 1}. "${sheet.getName()}"`);
 });
 
 console.log("═════════════════════════════════════════");
}

function testYandexGPTFixed() {
 console.log("═══════════════════════════════════════════");
 console.log("🧪 Testing Yandex GPT v3.1");
 console.log("═══════════════════════════════════════════");
 
 var testText = "разработка грунта экскаватором";
 console.log(`Testing:"${testText}"`);
 
 var result = aiModule.classifyRow(testText);
 
 if (result) {
 console.log(`✅ SUCCESS`);
 console.log(`Stage:${result.stage}`);
 console.log(`Norm:${result.normHoursPerUnit} чел-ч/ед`);
 console.log(`Source:${result.source}`);
 } else {
 console.log(`❌ FAILED`);
 }
 
 var stats = aiModule.getStats();
 console.log(`Stats:${JSON.stringify(stats)}`);
 console.log("═══════════════════════════════════════════");
}
