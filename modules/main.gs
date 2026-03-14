/**
 * =====================================================
 * MAIN MODULE v4.2 [AI-Integrated & Full Restoration]
 * Production — Полная интеграция всех слоев без урезаний
 * =====================================================
 */

function runSubpodryadAI(action) {
 const ui = SpreadsheetApp.getUi();
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

 logInfo("═══════════════════════════════════════════");
 logInfo(`🚀 START:Subpodryad AI v4.2 - Action:${action}`);
 logInfo(`📄 Sheet:${sheet.getName()}`);
 logInfo("═══════════════════════════════════════════");

 try {
 // ===========================
 // PRE-FLIGHT CHECKS
 // ===========================
 _verifyModulesLoaded();

 let estimateResult,technologyOutput,scheduleOutput,financeResult,supplyData;

 // ===========================
 // 1️⃣ ESTIMATE (v10.0)
 // ===========================
 if (action === 'estimate' || action === 'myEstimate') {
 logInfo("📊 Step 1:Estimate...");
 
 var options = {
 mode:action === 'estimate' ? 'complex' :'simple',
 useAI:true
 };

 try {
 estimateResult = Estimate.process(sheet,options);
 
 logInfo(`✅ Estimate completed:`);
 logInfo(` - Works found:${estimateResult.totalWorks}`);
 logInfo(` - Stages:${estimateResult.stages.length}`);
 logInfo(` - Financial rows:${estimateResult.metadata.financialRowsCount}`);
 logInfo(` - Unclassified:${estimateResult.metadata.unclassifiedRowsCount}`);
 
 // 🟠 ТВОЯ ДИАГНОСТИКА СОХРАНЕНА
 if (estimateResult.diagnostics) {
 logInfo(` - Coverage:${estimateResult.diagnostics.coveragePercent}%`);
 logInfo(` - Unit distribution:${JSON.stringify(estimateResult.diagnostics.unitDistribution)}`);
 
 if (estimateResult.diagnostics.coveragePercent < 30) {
 logWarning("⚠️ Low coverage - check estimate structure!");
 }
 }
 
 } catch (e) {
 logError(`❌ Estimate failed:${e.message}`);
 throw new Error(`Estimate Error:${e.message}`);
 }
 } else {
 logInfo("📝 WARNING:No estimate action,skipping Estimate module");
 }

 // ===========================
 // 2️⃣ TECHNOLOGY (v4.0)
 // ===========================
 if (estimateResult && estimateResult.stages.length > 0) {
 logInfo("⚙️ Step 2:Technology...");
 
 try {
 technologyOutput = Technology.process(estimateResult);
 
 logInfo(`✅ Technology completed:`);
 logInfo(` - Total hours:${technologyOutput.totalHours.toFixed(2)}`);
 logInfo(` - Workers:${technologyOutput.workers}`);
 logInfo(` - Works with norm:${technologyOutput.stats.worksWithNorm}/${technologyOutput.stats.totalWorksProcessed}`);
 logInfo(` - Coverage:${technologyOutput.stats.coveragePercent}%`);
 logInfo(` - Norm sources:${JSON.stringify(technologyOutput.stats.normSources)}`);
 logInfo(` - AI calls used:${technologyOutput.stats.aiCallsUsed}`);
 
 if (technologyOutput.totalHours === 0) {
 throw new Error("❌ CRITICAL:totalHours is 0 - all works without norms!");
 }
 
 } catch (e) {
 logError(`❌ Technology failed:${e.message}`);
 throw e;
 }
 } else {
 logWarning("⚠️ Technology skipped:no estimate data");
 technologyOutput = { totalHours:0,workers:1,workStructure:[],stats:{} };
 }

 // ===========================
 // 3️⃣ SCHEDULE (v4.1 - Календарь)
 // ===========================
 if (technologyOutput && technologyOutput.totalHours > 0) {
 logInfo("📅 Step 3:Schedule...");
 
 try {
 if (typeof Schedule !== 'undefined' && Schedule.process) {
 scheduleOutput = Schedule.process(technologyOutput);
 logInfo(`✅ Schedule completed:${scheduleOutput.projectTotalDays} days`);
 } else {
 logWarning("⚠️ Schedule module not available (stub)");
 scheduleOutput = {
 projectTotalDays:Math.ceil(technologyOutput.totalHours / (8 * technologyOutput.workers)),
 workersCount:technologyOutput.workers
 };
 }
 } catch (e) {
 logError(`❌ Schedule error:${e.message}`);
 }
 }

 // ===========================
 // 4️⃣ MATERIALS (v1.0 - РЕСУРСЫ + НЮАНСЫ)
 // ===========================
 logInfo("🛠️ Step 4:Materials & Logistics...");
 try {
 if (typeof Materials !== 'undefined' && Materials.process) {
 // Новая логика:извлекаем по ГЭСН с проверкой нюансов (бетононасос и др.)
 supplyData = Materials.process(technologyOutput);
 logInfo(`✅ Materials calculated:${supplyData.materialsOrder.length} positions`);
 } else {
 logWarning("⚠️ Materials module not available");
 }
 } catch (e) {
 logWarning(`⚠️ Materials error (non-critical):${e.message}`);
 }

 // ===========================
 // 5️⃣ FINANCE (v4.0 - DELTA)
 // ===========================
 logInfo("💰 Step 5:Finance...");
 try {
 if (typeof Finance === 'undefined' || !Finance.process) {
 throw new Error("Finance module not loaded");
 }
 
 // Передаем все 3 параметра для расчета Дельты
 financeResult = Finance.process(estimateResult,technologyOutput,scheduleOutput);
 
 logInfo(`✅ Finance completed:`);
 logInfo(` - Labor cost:${financeResult.laborCost || 0}`);
 logInfo(` - Materials cost:${financeResult.materialsCost || 0}`);
 logInfo(` - GP Margin:${financeResult.gpMarginFromEstimate || 0}`);
 logInfo(` - Net Delta:${financeResult.netProfitDelta || 0}`);
 
 } catch (e) {
 logError(`❌ Finance failed:${e.message}`);
 throw new Error(`Finance Error:${e.message}`);
 }

 // ===========================
 // 6️⃣ COMMERCE
 // ===========================
 if (financeResult) {
 logInfo("📋 Step 6:Commerce...");
 try {
 if (typeof Commerce !== 'undefined' && Commerce.process) {
 Commerce.process(financeResult);
 logInfo(`✅ Commercial offer generated`);
 }
 } catch (e) {
 logWarning(`⚠️ Commerce error:${e.message}`);
 }
 }

 // ===========================
 // RESULTS OUTPUT (ТВОЙ ОРИГИНАЛЬНЫЙ БЛОК + НОВЫЙ OUTPUT)
 // ===========================
 if (typeof Output !== 'undefined' && Output.render) {
  Output.render({
    estimateData:estimateResult,
    techData:technologyOutput,
    supplyData:supplyData,
    financeData:financeResult,
    scheduleData:scheduleOutput
  });
 }
 
 _renderResults(action,estimateResult,technologyOutput,financeResult);

 logInfo("═══════════════════════════════════════════");
 logInfo(`✅ SUCCESS:${action} completed`);
 logInfo("═══════════════════════════════════════════");

 // Твой оригинальный Alert
 var successMsg = `✅ Action "${action}" completed successfully.\n\n` +
 `Works:${estimateResult ? estimateResult.totalWorks :0}\n` +
 `Total hours:${technologyOutput ? technologyOutput.totalHours.toFixed(1) :0}\n` +
 `Net Delta:${financeResult ? financeResult.netProfitDelta.toFixed(0) :0} руб\n` +
 `Total Price:${financeResult ? financeResult.totalFinal.toFixed(0) :0} руб`;
 
 ui.alert(successMsg);

 } catch (e) {
 logError("═══════════════════════════════════════════");
 logError(`❌ FATAL ERROR:${e.message}`);
 logError("═══════════════════════════════════════════");
 ui.alert(`❌ Error:${e.message}`);
 }
}

// ТВОИ HELPER FUNCTIONS СОХРАНЕНЫ ПОЛНОСТЬЮ
function _verifyModulesLoaded() {
 var requiredModules = ['Estimate','Technology','Finance','Materials','Schedule','Output'];
 for (var i = 0; i < requiredModules.length; i++) {
 if (eval('typeof ' + requiredModules[i]) === 'undefined') {
 var message = `❌ CRITICAL:Module ${requiredModules[i]} not loaded.`;
 logError(message);
 throw new Error(message);
 }
 }
 logInfo("✅ All critical modules loaded");
}

function _renderResults(action,estimateResult,technologyOutput,financeResult) {
 logInfo("📤 Rendering results to 'Results' sheet...");
 try {
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var resultsSheet = ss.getSheetByName("Results") || ss.insertSheet("Results");
 resultsSheet.clearContents();
 var row = 1;
 resultsSheet.getRange(row,1,1,2).setValues([["Metric","Value"]]);
 row++;
 var data = [
 ["Works count",estimateResult ? estimateResult.totalWorks :0],
 ["Total hours",technologyOutput ? technologyOutput.totalHours.toFixed(2) :0],
 ["Net Delta",financeResult ? financeResult.netProfitDelta.toFixed(0) :0],
 ["Total Price",financeResult ? financeResult.totalFinal.toFixed(0) :0]
 ];
 resultsSheet.getRange(row,1,data.length,2).setValues(data);
 logInfo("✅ Results sheet updated");
 } catch (e) { logWarning(`⚠️ Results rendering skipped:${e.message}`); }
}

// ЛОГГЕРЫ СОХРАНЕНЫ
function logInfo(msg) { Logger.log('[INFO] ' + msg); }
function logWarning(msg) { Logger.log('[WARN] ' + msg); }
function logError(msg) { Logger.log('[ERROR] ' + msg); }
