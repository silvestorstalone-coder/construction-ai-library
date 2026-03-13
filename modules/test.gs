// test.gs

function testAuditDiagnostics() {
  logInfo("═══════════════════════════════════════════");
  logInfo("🔍 AUDIT DIAGNOSTICS STARTED");
  logInfo("═══════════════════════════════════════════");

  // 1. Проверяем Estimate
  logInfo("✓ Step 1: Checking Estimate module...");
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var estimate = Estimate.process(sheet, { mode: 'simple' });
    logInfo(`✅ Estimate OK. Works: ${estimate.totalWorks}`);
  } catch (e) {
    logError(`❌ Estimate failed: ${e.message}`);
    return;
  }

  // 2. Проверяем Technology
  logInfo("✓ Step 2: Checking Technology module...");
  try {
    var tech = Technology.process(estimate);
    logInfo(`✅ Technology OK. Hours: ${tech.totalHours}`);
  } catch (e) {
    logError(`❌ Technology failed: ${e.message}`);
    return;
  }

  // 3. Проверяем AuditModule
  logInfo("✓ Step 3: Checking AuditModule...");
  if (typeof AuditModule === 'undefined') {
    logError("❌ AuditModule is NOT defined!");
    return;
  } else {
    logInfo("✅ AuditModule is defined");
  }

  // 4. Пытаемся создать аудит
  logInfo("✓ Step 4: Creating audit sheet...");
  try {
    AuditModule.createAudit(estimate, tech);
    logInfo("✅ Audit sheet CREATED successfully!");
  } catch (e) {
    logError(`❌ Audit creation failed: ${e.message}`);
    return;
  }

  // 5. Проверяем обновление
  logInfo("✓ Step 5: Verifying audit sheet...");
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var auditSheet = ss.getSheetByName("Audit");
    if (auditSheet) {
      logInfo(`✅ 'Audit' sheet EXISTS`);
      logInfo(`✅ Rows: ${auditSheet.getMaxRows()}, Columns: ${auditSheet.getMaxColumns()}`);
    } else {
      logError("❌ 'Audit' sheet NOT FOUND!");
    }
  } catch (e) {
    logError(`❌ Verification error: ${e.message}`);
  }

  logInfo("═══════════════════════════════════════════");
  logInfo("✅ TEST COMPLETE");
  logInfo("═══════════════════════════════════════════");
}

function simpleTestAudit() {
  logInfo("🧪 Starting simple audit test...");

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var estimate = Estimate.process(sheet, { mode: 'simple' });
    var tech = Technology.process(estimate);

    if (typeof AuditModule === 'undefined') {
      logError("❌ AuditModule not found");
      return;
    }

    AuditModule.createAudit(estimate, tech);
    logInfo("✅ Audit created - check 'Audit' sheet");
  } catch (e) {
    logError("❌ Error: " + e.message);
  }
}

function showAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  logInfo("═════════════════════════════════════════");
  logInfo("ALL SHEETS:");
  logInfo("═════════════════════════════════════════");

  sheets.forEach(function (sheet, i) {
    logInfo(`${i + 1}. "${sheet.getName()}"`);
  });

  logInfo("═════════════════════════════════════════");
}

function testYandexGPTFixed() {
  logInfo("═══════════════════════════════════════════");
  logInfo("🧪 Testing Yandex GPT v3.1");
  logInfo("═══════════════════════════════════════════");

  var testText = "разработка грунта экскаватором";
  logInfo(`Testing: "${testText}"`);

  var result = aiModule.classifyRow(testText);

  if (result) {
    logInfo(`✅ SUCCESS`);
    logInfo(`Stage: ${result.stage}`);
    logInfo(`Norm: ${result.normHoursPerUnit} чел-ч/ед`);
    logInfo(`Source: ${result.source}`);
  } else {
    logInfo(`❌ FAILED`);
  }

  var stats = aiModule.getStats();
  logInfo(`Stats: ${JSON.stringify(stats)}`);
  logInfo("═══════════════════════════════════════════");
}