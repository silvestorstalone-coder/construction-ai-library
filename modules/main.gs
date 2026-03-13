/**
 * =====================================================
 * MAIN MODULE v3.1
 * Production — Исправлены ошибки совместимости
 * =====================================================
 */

function runSubpodryadAI(action) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  logInfo("═══════════════════════════════════════════");
  logInfo(`🚀 START:Subpodryad AI - Action:${action}`);
  logInfo(`📄 Sheet:${sheet.getName()}`);
  logInfo("═══════════════════════════════════════════");

  try {
    // ===========================
    // PRE-FLIGHT CHECKS
    // ===========================
    _verifyModulesLoaded();

    let estimateResult, technologyOutput, scheduleOutput, financeResult;

    // ===========================
    // 1️⃣ ESTIMATE
    // ===========================
    if (action === 'estimate' || action === 'myEstimate') {
      logInfo("📊 Step 1:Estimate...");

      var options = {
        mode: action === 'estimate' ? 'complex' : 'simple',
        useAI: true
      };

      try {
        estimateResult = Estimate.process(sheet, options);

        logInfo(`✅ Estimate completed:`);
        logInfo(` - Works found:${estimateResult.totalWorks}`);
        logInfo(` - Stages:${estimateResult.stages.length}`);
        logInfo(` - Financial rows:${estimateResult.metadata.financialRowsCount}`);
        logInfo(` - Unclassified:${estimateResult.metadata.unclassifiedRowsCount}`);

        // 🟠 Диагностика из v9.1
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
      // Если action не 'estimate'|'myEstimate',проверяем есть ли estimateResult нужен
      logInfo("📝 WARNING:No estimate action,skipping Estimate module");
    }

    // ===========================
    // 2️⃣ TECHNOLOGY
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

        // 🔴 Критическая защита — проверяем перед передачей вниз
        if (technologyOutput.totalHours === 0) {
          throw new Error("❌ CRITICAL:totalHours is 0 - all works without norms!");
        }
      } catch (e) {
        logError(`❌ Technology failed:${e.message}`);
        throw e;
      }
    } else {
      logWarning("⚠️ Technology skipped:no estimate data");
      technologyOutput = { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    // ===========================
    // 🔍 AUDIT (НОВОЕ!)
    // ===========================
    if (estimateResult && technologyOutput && typeof AuditModule !== 'undefined') {
      logInfo("🔍 Step 2.5:Audit...");

      try {
        AuditModule.createAudit(estimateResult, technologyOutput);
        var auditSummary = AuditModule.getAuditSummary(estimateResult, technologyOutput);
        logInfo(`✅ Audit created:`);
        logInfo(` - Works:${auditSummary.totalWorks}`);
        logInfo(` - Hours:${auditSummary.totalHours.toFixed(2)}`);
        logInfo(` - Coverage:${auditSummary.coverage}%`);
        logInfo(` - Timestamp:${auditSummary.timestamp}`);
      } catch (e) {
        logWarning(`⚠️ Audit skipped:${e.message}`);
      }
    }

    // ===========================
    // 3️⃣ SCHEDULE
    // ===========================
    if (technologyOutput && technologyOutput.totalHours > 0) {
      logInfo("📅 Step 3:Schedule...");

      try {
        if (typeof Schedule !== 'undefined' && Schedule.process) {
          scheduleOutput = Schedule.process(technologyOutput);
          logInfo(`✅ Schedule completed:${scheduleOutput.durationDays} days`);
        } else {
          logWarning("⚠️ Schedule module not available (stub)");
          scheduleOutput = {
            durationDays: Math.ceil(technologyOutput.totalHours / (8 * technologyOutput.workers)),
            workers: technologyOutput.workers,
            machineryUsage: []
          };
        }
      } catch (e) {
        logError(`❌ Schedule error:${e.message}`);
        scheduleOutput = {
          durationDays: 0,
          workers: technologyOutput.workers,
          machineryUsage: []
        };
      }
    } else {
      logWarning("⚠️ Schedule skipped:no labor data");
      scheduleOutput = {
        durationDays: 0,
        workers: 1,
        machineryUsage: []
      };
    }

    // ===========================
    // 4️⃣ MATERIALS
    // ===========================
    if (scheduleOutput.durationDays > 0) {
      logInfo("🛠️ Step 4:Materials...");

      try {
        if (typeof Materials !== 'undefined' && Materials.processConsumption) {
          // 🟠 ИСПРАВЛЕНИЕ:передаём параметры
          Materials.processConsumption(scheduleOutput, estimateResult);
          logInfo("✅ Materials consumption calculated");

          if (Materials.processRequests) {
            Materials.processRequests(scheduleOutput);
            logInfo("✅ Material requests generated");
          }
        } else {
          logWarning("⚠️ Materials module not available");
        }
      } catch (e) {
        logWarning(`⚠️ Materials error (non-critical):${e.message}`);
      }
    } else {
      logWarning("⚠️ Materials skipped:no schedule");
    }

    // ===========================
    // 5️⃣ FINANCE
    // ===========================
    logInfo("💰 Step 5:Finance...");

    try {
      if (typeof Finance === 'undefined' || !Finance.process) {
        throw new Error("Finance module not loaded");
      }

      // 🔴 ИСПРАВЛЕНИЕ:передаём 3 параметра (добавили scheduleOutput)
      financeResult = Finance.process(estimateResult, technologyOutput, scheduleOutput);

      logInfo(`✅ Finance completed:`);
      logInfo(` - Labor cost:${financeResult.laborCost || 0}`);
      logInfo(` - Materials cost:${financeResult.materialsCost || 0}`);
      logInfo(` - Overhead:${financeResult.overhead || 0}`);
      logInfo(` - Cost price:${financeResult.costPrice || 0}`);
      logInfo(` - Sales price:${financeResult.salesPrice || 0}`);
    } catch (e) {
      logError(`❌ Finance failed:${e.message}`);
      throw new Error(`Finance Error:${e.message}`);
    }

    // ===========================
    // 6️⃣ COMMERCE
    // ===========================
    if (financeResult && financeResult.salesPrice > 0) {
      logInfo("📋 Step 6:Commerce...");

      try {
        if (typeof Commerce !== 'undefined' && Commerce.process) {
          const commerceResult = Commerce.process(financeResult);
          logInfo(`✅ Commercial offer generated. Total:${commerceResult.totalPrice || financeResult.salesPrice}`);
        } else {
          logWarning("⚠️ Commerce module not available");
        }
      } catch (e) {
        logWarning(`⚠️ Commerce error (non-critical):${e.message}`);
      }
    } else {
      logWarning("⚠️ Commerce skipped:no finance data");
    }

    // ===========================
    // RESULTS OUTPUT
    // ===========================
    _renderResults(action, estimateResult, technologyOutput, financeResult);

    logInfo("═══════════════════════════════════════════");
    logInfo(`✅ SUCCESS:${action} completed`);
    logInfo("═══════════════════════════════════════════");

    // UI Alert с более информативным сообщением
    var successMsg = `✅ Action "${action}" completed successfully.\n\n` +
      `Works:${estimateResult ? estimateResult.totalWorks : 0}\n` +
      `Total hours:${technologyOutput ? technologyOutput.totalHours.toFixed(1) : 0}\n` +
      `Sales price:${financeResult ? financeResult.salesPrice.toFixed(0) : 0} руб`;

    ui.alert(successMsg);
  } catch (e) {
    logError("═══════════════════════════════════════════");
    logError(`❌ FATAL ERROR:${e.message}`);
    logError("═══════════════════════════════════════════");

    ui.alert(`❌ Error:${e.message}`);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Проверка загрузки всех критических модулей
 */
function _verifyModulesLoaded() {
  var requiredModules = ['Estimate', 'Technology', 'Finance'];

  for (var i = 0; i < requiredModules.length; i++) {
    if (typeof window !== 'undefined' ?
      window[requiredModules[i]] === undefined :
      eval('typeof ' + requiredModules[i]) === 'undefined') {

      var message = `❌ CRITICAL:Module ${requiredModules[i]} not loaded. ` +
        `Check load order in Apps Script project.`;
      logError(message);
      throw new Error(message);
    }
  }

  logInfo("✅ All critical modules loaded");
}

/**
 * Вывод результатов в UI и лист
 */
function _renderResults(action, estimateResult, technologyOutput, financeResult) {
  logInfo