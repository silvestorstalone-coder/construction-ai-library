/**
 * =====================================================
 * MAIN MODULE v4.4 [AI-Integrated & Full Restoration]
 * Production — Полная интеграция всех слоев с Finance v5.5
 * =====================================================
 */

async function runSubpodryadAI(action) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  logInfo("═══════════════════════════════════════════");
  logInfo(`🚀 START: Subpodryad AI v4.4 - Action: ${action}`);
  logInfo(`📄 Sheet: ${sheet.getName()}`);
  logInfo("═══════════════════════════════════════════");

  try {
    // ===========================
    // PRE-FLIGHT CHECKS
    // ===========================
    _verifyModulesLoaded();

    let estimateResult, technologyOutput, scheduleOutput, financeResult, supplyData;

    // ===========================
    // 1️⃣ ESTIMATE (v10.0)
    // ===========================
    if (action === 'estimate' || action === 'myEstimate') {
      logInfo("📊 Step 1: Estimate...");
      const options = {
        mode: action === 'estimate' ? 'complex' : 'simple',
        useAI: true
      };

      try {
        estimateResult = Estimate.process(sheet, options);

        logInfo(`✅ Estimate completed:`);
        logInfo(` - Works found: ${estimateResult.totalWorks}`);
        logInfo(` - Stages: ${estimateResult.stages.length}`);
        logInfo(` - Financial rows: ${estimateResult.metadata.financialRowsCount}`);
        logInfo(` - Unclassified: ${estimateResult.metadata.unclassifiedRowsCount}`);

        if (estimateResult.diagnostics) {
          logInfo(` - Coverage: ${estimateResult.diagnostics.coveragePercent}%`);
          logInfo(` - Unit distribution: ${JSON.stringify(estimateResult.diagnostics.unitDistribution)}`);
          if (estimateResult.diagnostics.coveragePercent < 30) {
            logWarning("⚠️ Low coverage - check estimate structure!");
          }
        }

      } catch (e) {
        logError(`❌ Estimate failed: ${e.message}`);
        throw new Error(`Estimate Error: ${e.message}`);
      }

    } else {
      logInfo("📝 WARNING: No estimate action, skipping Estimate module");
    }

    // ===========================
    // 2️⃣ TECHNOLOGY (v4.3)
    // ===========================
    if (estimateResult && estimateResult.stages.length > 0) {
      logInfo("⚙️ Step 2: Technology...");

      try {
        technologyOutput = Technology.process(estimateResult);

        logInfo(`✅ Technology completed:`);
        logInfo(` - Total hours: ${technologyOutput.totalHours.toFixed(2)}`);
        logInfo(` - Workers: ${technologyOutput.workers}`);
        logInfo(` - Works with norm: ${technologyOutput.stats.worksWithNorm}/${technologyOutput.stats.totalWorksProcessed}`);
        logInfo(` - Coverage: ${technologyOutput.stats.coveragePercent}%`);
        logInfo(` - Norm sources: ${JSON.stringify(technologyOutput.stats.normSources)}`);
        logInfo(` - AI calls used: ${technologyOutput.stats.aiCallsUsed}`);

        if (technologyOutput.totalHours === 0) {
          throw new Error("❌ CRITICAL: totalHours is 0 - all works without norms!");
        }

      } catch (e) {
        logError(`❌ Technology failed: ${e.message}`);
        throw e;
      }

    } else {
      logWarning("⚠️ Technology skipped: no estimate data");
      technologyOutput = { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    // ===========================
    // 3️⃣ SCHEDULE (v4.1)
    // ===========================
    if (technologyOutput && technologyOutput.totalHours > 0) {
      logInfo("📅 Step 3: Schedule...");

      try {
        if (typeof Schedule !== 'undefined' && Schedule.process) {
          scheduleOutput = Schedule.process(technologyOutput);
          logInfo(`✅ Schedule completed: ${scheduleOutput.projectTotalDays} days`);
        } else {
          logWarning("⚠️ Schedule module not available (stub)");
          scheduleOutput = {
            projectTotalDays: Math.ceil(technologyOutput.totalHours / (8 * technologyOutput.workers)),
            workersCount: technologyOutput.workers
          };
        }
      } catch (e) {
        logError(`❌ Schedule error: ${e.message}`);
      }
    }

    // ===========================
    // 4️⃣ MATERIALS (v5.3 AI INTEGRATED)
    // ===========================
    logInfo("🛠️ Step 4: Materials & Logistics...");
    try {
      if (typeof Materials !== 'undefined' && Materials.process) {
        supplyData = await Materials.process(technologyOutput);
        if (supplyData && supplyData.materialsOrder) {
          logInfo(`✅ Materials calculated: ${supplyData.materialsOrder.length} positions`);
        } else {
          logWarning("⚠️ Materials returned null or empty");
        }
      } else {
        logWarning("⚠️ Materials module not available");
      }
    } catch (e) {
      logWarning(`⚠️ Materials error (non-critical): ${e.message}`);
    }

    // ===========================
    // 5️⃣ FINANCE (v5.5 DELTA + MATERIALS)
    // ===========================
    logInfo("💰 Step 5: Finance...");
    try {
      if (typeof Finance === 'undefined' || !Finance.process) {
        throw new Error("Finance module not loaded");
      }

      const financeConfig = {
        overhead_multiplier: 1.15,
        tax_multiplier: 1.20,
        laborRates: {},           // пустой — возьмет DEFAULT_RATES
        includeMaterials: true    // включаем расчет материалов/логистики
      };

      financeResult = Finance.process(estimateResult, technologyOutput, financeConfig, supplyData);

      logInfo(`✅ Finance completed:`);
      logInfo(` - Labor cost: ${financeResult.laborCost || 0}`);
      logInfo(` - Materials cost: ${financeResult.materialsCost || 0}`);
      logInfo(` - GP Margin: ${financeResult.estimateMargin || 0}`);
      logInfo(` - Net Delta: ${financeResult.netProfitDelta || 0}`);

    } catch (e) {
      logError(`❌ Finance failed: ${e.message}`);
      throw new Error(`Finance Error: ${e.message}`);
    }

    // ===========================
    // 6️⃣ COMMERCE
    // ===========================
    if (financeResult) {
      logInfo("📋 Step 6: Commerce...");
      try {
        if (typeof Commerce !== 'undefined' && Commerce.process) {
          Commerce.process(financeResult);
          logInfo(`✅ Commercial offer generated`);
        }
      } catch (e) {
        logWarning(`⚠️ Commerce error: ${e.message}`);
      }
    }

    // ===========================
    // ВЫВОД РЕЗУЛЬТАТОВ (локализованный)
    // ===========================
    if (typeof Output !== 'undefined' && Output.render) {
      Output.render({
        estimateData: estimateResult,
        techData: technologyOutput,
        supplyData: supplyData,
        financeData: financeResult,
        scheduleData: scheduleOutput
      });
    }

    _renderResults(action, estimateResult, technologyOutput, financeResult);

    logInfo("═══════════════════════════════════════════");
    logInfo(`✅ УСПЕХ: Операция "${action}" завершена`);
    logInfo("═══════════════════════════════════════════");

    const статусПроекта = financeResult && financeResult.netProfitDelta >= 0 ? "✅ ПРИБЫЛЬНЫЙ" : "🚨 УБЫТОЧНЫЙ";

    const successMsg = `📊 Отчет Subpodryad AI\n` +
      `───────────────────────\n` +
      `Статус: ${статусПроекта}\n\n` +
      `🔹 Найдено работ: ${estimateResult ? estimateResult.totalWorks : 0} шт.\n` +
      `🔹 Трудозатраты: ${technologyOutput ? technologyOutput.totalHours.toFixed(1) : 0} чел/час\n` +
      `🔹 Срок (приблизительно): ${scheduleOutput ? scheduleOutput.projectTotalDays : 0} дн.\n\n` +
      `💰 ЧИСТАЯ ПРИБЫЛЬ: ${financeResult ? financeResult.чистаяПрибыль.toFixed(0) : 0} руб.\n` +
      `📈 Рентабельность: ${financeResult ? financeResult.profitability : '0%'}\n` +
      `───────────────────────\n` +
      `Общая сумма контракта: ${financeResult ? financeResult.totalFinal.toFixed(0) : 0} руб.`;

    ui.alert(successMsg);

  } catch (e) {
    logError("═══════════════════════════════════════════");
    logError(`❌ FATAL ERROR: ${e.message}`);
    logError("═══════════════════════════════════════════");
    ui.alert(`❌ Error: ${e.message}`);
  }
}

// ===========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===========================
function _verifyModulesLoaded() {
  const requiredModules = ['Estimate', 'Technology', 'Finance', 'Materials', 'Schedule', 'Output'];
  for (let i = 0; i < requiredModules.length; i++) {
    if (eval('typeof ' + requiredModules[i]) === 'undefined') {
      const message = `❌ CRITICAL: Module ${requiredModules[i]} not loaded.`;
      logError(message);
      throw new Error(message);
    }
  }
  logInfo("✅ All critical modules loaded");
}

function _renderResults(action, estimateResult, technologyOutput, financeResult) {
  logInfo("📤 Rendering results to 'Results' sheet...");
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName("Results") || ss.insertSheet("Results");
    resultsSheet.clearContents();
    let row = 1;
    resultsSheet.getRange(row, 1, 1, 2).setValues([["Метрика", "Значение"]]);
    row++;
    const data = [
      ["Найдено работ", estimateResult ? estimateResult.totalWorks : 0],
      ["Трудозатраты", technologyOutput ? technologyOutput.totalHours.toFixed(2) : 0],
      ["Чистая прибыль", financeResult ? financeResult.чистаяПрибыль.toFixed(0) : 0],
      ["Рентабельность", financeResult ? financeResult.profitability : '0%'],
      ["Общая сумма контракта", financeResult ? financeResult.totalFinal.toFixed(0) : 0]
    ];
    resultsSheet.getRange(row, 1, data.length, 2).setValues(data);
    logInfo("✅ Results sheet updated");
  } catch (e) {
    logWarning(`⚠️ Results rendering skipped: ${e.message}`);
  }
}

function logInfo(msg) { Logger.log('[INFO] ' + msg); }
function logWarning(msg) { Logger.log('[WARN] ' + msg); }
function logError(msg) { Logger.log('[ERROR] ' + msg); }
