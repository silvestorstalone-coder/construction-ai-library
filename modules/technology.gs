var Technology = (function () {

  var normCache = {};
  var aiCallCount = 0; // Счётчик AI запросов
  var AI_LIMIT = 100; // Максимум AI запросов за один процесс

  function process(estimateOutput) {
    logInfo("=== Technology v3.2 STARTED ===");

    if (!estimateOutput || !estimateOutput.stages || estimateOutput.stages.length === 0) {
      logWarning("Technology: нет этапов.");
      return { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    var totalHours = 0;
    var totalWorksProcessed = 0;
    var worksWithNorm = 0;
    var worksWithoutNorm = 0;
    var workStructure = [];
    var normSources = { norms_dictionary: 0, ai_fallback: 0, not_found: 0 };

    estimateOutput.stages.forEach(function (stage) {
      if (!stage.subsections || stage.subsections.length === 0) return;

      stage.subsections.forEach(function (sub) {
        if (!sub.works || sub.works.length === 0) return;

        sub.works.forEach(function (work) {
          var workName = (work.normalizedName || work.name || "").trim();
          if (!workName) return;

          totalWorksProcessed++;

          var techData = getTechnologyForWork(workName);
          var hours = 0;
          var source = "not_found";

          if (techData && isValidNorm(techData.normHoursPerUnit)) {
            hours = techData.normHoursPerUnit * (work.quantity || 0);
            worksWithNorm++;
            source = techData._source || "unknown";
            normSources[source] = (normSources[source] || 0) + 1;
          } else {
            logWarning('Нет нормы для:"' + workName + '"');
            worksWithoutNorm++;
            normSources.not_found++;
          }

          totalHours += hours;

          workStructure.push({
            rawRowIndex: work.rawRowIndex || 0,
            stage: stage.name,
            subsection: sub.name,
            name: workName,
            unit: work.unit || "",
            quantity: work.quantity || 0,
            price: work.price || 0,
            norm: techData && isValidNorm(techData.normHoursPerUnit) ? techData.normHoursPerUnit : 0.5,
            hours: hours,
            normSource: source
          });
        });
      });
    });

    // Критическая защита
    if (totalWorksProcessed > 0 && totalHours === 0) {
      var coveragePercent = worksWithNorm > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

      var errorMsg =
        "🚨 Technology CRITICAL: totalHours === 0 при " +
        totalWorksProcessed + " работах.\n" +
        "С нормой:" + worksWithNorm +
        ", без нормы:" + worksWithoutNorm +
        ", покрытие:" + coveragePercent + "%\n" +
        "Источники норм:" + JSON.stringify(normSources) + "\n" +
        "AI запросов:" + aiCallCount + "\n" +
        "→ Причины:\n" +
        " 1. Словарь Norms.js неполный\n" +
        " 2. AI отключен / нет API ключа\n" +
        " 3. Нормализация сломала названия работ\n" +
        "→ Действие: пополните normsDB или проверьте структуру сметы";

      logError(errorMsg);
      throw new Error(errorMsg);
    }

    var workers = Math.max(1, Math.ceil(totalHours / 160));
    var coveragePercent = totalWorksProcessed > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

    logInfo(
      "=== Technology v3.2 COMPLETED ===\n" +
      "Работ обработано:" + totalWorksProcessed + "\n" +
      "Найдено норм:" + worksWithNorm + " (" + coveragePercent + "%)\n" +
      "Без норм:" + worksWithoutNorm + "\n" +
      "Источники:" + JSON.stringify(normSources) + "\n" +
      "Всего часов:" + totalHours.toFixed(2) + "\n" +
      "Бригад:" + workers + "\n" +
      "AI запросов:" + aiCallCount
    );

    return {
      totalHours: totalHours,
      workers: workers,
      workStructure: workStructure,
      stats: {
        totalWorksProcessed: totalWorksProcessed,
        worksWithNorm: worksWithNorm,
        worksWithoutNorm: worksWithoutNorm,
        coveragePercent: coveragePercent,
        normSources: normSources,
        aiCallsUsed: aiCallCount
      }
    };
  }

  // =====================
  // Получение нормы
  // =====================
  function getTechnologyForWork(workName) {
    if (!workName) return null;

    var cacheKey = workName.toLowerCase().trim();
    if (normCache[cacheKey]) return normCache[cacheKey];

    // 1. Norms dictionary
    var norm = null;
    try {
      if (typeof Norms !== "undefined" && Norms.getNorm) {
        norm = Norms.getNorm(workName);
      }
    } catch (e) {
      logWarning("Norms.getNorm error для '" + workName + "': " + e.message);
    }

    if (norm && isValidNorm(norm.laborHoursPerUnit)) {
      var result = {
        normHoursPerUnit: norm.laborHoursPerUnit,
        machinery: norm.machinery || null,
        _source: "norms_dictionary"
      };
      normCache[cacheKey] = result;
      return result;
    }

    // 2. AI fallback
    if (aiCallCount >= AI_LIMIT) return { normHoursPerUnit: 0.5, _source: "ai_fallback" }; // Среднее значение

    try {
      if (typeof aiModule !== "undefined" && aiModule.classifyRow) {
        var aiAnswer = aiModule.classifyRow(workName);
        aiCallCount++;

        if (aiAnswer && isValidNorm(aiAnswer.normHoursPerUnit)) {
          var aiResult = {
            normHoursPerUnit: aiAnswer.normHoursPerUnit,
            machinery: null,
            _source: "ai_fallback"
          };
          normCache[cacheKey] = aiResult;
          logInfo('AI ACCEPTED для "' + workName + '": ' + aiAnswer.normHoursPerUnit + ' чел-ч/ед');
          return aiResult;
        } else {
          logWarning('AI REJECTED для "' + workName + '". Response:' + JSON.stringify(aiAnswer));
        }
      }
    } catch (e) {
      logWarning('AI ERROR для "' + workName + '": ' + e.message);
    }

    return { normHoursPerUnit: 0.5, _source: "not_found" };
  }

  function isValidNorm(value) {
    if (value === null || value === undefined) return false;
    if (typeof value !== "number") return false;
    if (isNaN(value)) return false;
    if (!isFinite(value)) return false;
    if (value <= 0) return false;
    return true;
  }

  return { process: process };
})();