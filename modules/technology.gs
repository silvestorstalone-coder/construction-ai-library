//**
 * Technology.gs - v4.0 [FULL GESN CORE]
 * AI Refactored: 2026-03-14 (Full Restoration + GESN Support)
 */

const Technology = (() => {
  const normCache = {};
  let aiCallCount = 0;
  const AI_LIMIT = 100;

  function process(estimateOutput) {
    console.log('=== Technology v4.0 [FULL] STARTED ===');

    if (!estimateOutput || !estimateOutput.stages || estimateOutput.stages.length === 0) {
      console.warn('Technology: нет этапов.');
      return { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    let totalHours = 0;
    let totalWorksProcessed = 0;
    let worksWithNorm = 0;
    let worksWithoutNorm = 0;
    const workStructure = [];
    const normSources = { gesn_code: 0, norms_dictionary: 0, ai_fallback: 0, not_found: 0 };

    estimateOutput.stages.forEach((stage) => {
      // СОХРАНЕНО: Логика подразделов v3.2
      if (!stage.subsections || stage.subsections.length === 0) {
        // Fallback если структура плоская (v10.0 compatible)
        const flatWorks = stage.works || [];
        processWorks(flatWorks, stage.name, "Общий подраздел");
        return;
      }

      stage.subsections.forEach((sub) => {
        if (!sub.works || sub.works.length === 0) return;
        processWorks(sub.works, stage.name, sub.name);
      });
    });

    // Вспомогательная функция для обработки списка работ (сохраняет DRY)
    function processWorks(works, stageName, subName) {
      works.forEach((work) => {
        const workName = (work.normalizedName || work.name || '').trim();
        const workCode = work.code || null; // НОВОЕ: получаем код из Estimate v10.0
        
        if (!workName) return;
        totalWorksProcessed++;

        // НОВОЕ: Поиск с приоритетом кода
        const techData = getTechnologyForWork(workName, workCode);
        let hours = 0;
        let source = 'not_found';

        if (techData && isValidNorm(techData.normHoursPerUnit)) {
          let finalNorm = techData.normHoursPerUnit;
          
          // Sanity Check от Старшего инженера
          if (finalNorm > 100) {
            console.warn(`🚨 Sanity Check: Норма ${finalNorm} для "${workName}" слишком высока. Срезано до 100.`);
            finalNorm = 100;
          }

          hours = finalNorm * (work.quantity || 0);
          worksWithNorm++;
          source = techData._source || 'unknown';
          normSources[source] = (normSources[source] || 0) + 1;
        } else {
          console.warn(`Нет нормы для: "${workName}" (Код: ${workCode})`);
          worksWithoutNorm++;
          normSources.not_found++;
        }

        totalHours += hours;

        workStructure.push({
          rawRowIndex: work.rawRowIndex || 0,
          stage: stageName,
          subsection: subName,
          name: workName,
          code: workCode,
          unit: work.unit || '',
          quantity: work.quantity || 0,
          price: work.price || 0,
          norm: (techData && isValidNorm(techData.normHoursPerUnit)) ? techData.normHoursPerUnit : 0.5,
          hours: hours,
          normSource: source
        });
      });
    }

    // СОХРАНЕНО: Критическая защита v3.2
    if (totalWorksProcessed > 0 && totalHours === 0) {
      const coveragePercent = worksWithNorm > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;
      const errorMsg = `
        🚨 Technology CRITICAL: totalHours === 0 при ${totalWorksProcessed} работах.
        Источники: ${JSON.stringify(normSources)}
        Покрытие: ${coveragePercent}%
      `;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const workers = Math.max(1, Math.ceil(totalHours / 160));
    const coveragePercent = totalWorksProcessed > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

    // СОХРАНЕНО: Полное логирование v3.2
    console.log(`
      === Technology v4.0 COMPLETED ===
      Работ: ${totalWorksProcessed} | С нормой: ${worksWithNorm} (${coveragePercent}%)
      Источники: ${JSON.stringify(normSources)}
      Всего часов: ${totalHours.toFixed(2)} | Бригад: ${workers}
      Маржа Гены: ${estimateOutput.gp_margin_total || 0}
    `);

    return {
      totalHours: totalHours,
      workers: workers,
      workStructure: workStructure,
      gp_margin_total: estimateOutput.gp_margin_total || 0,
      stats: {
        totalWorksProcessed,
        worksWithNorm,
        worksWithoutNorm,
        coveragePercent,
        normSources,
        aiCallsUsed: aiCallCount
      }
    };
  }

  function getTechnologyForWork(workName, workCode) {
    if (!workName && !workCode) return null;

    const cacheKey = (workCode || workName).toLowerCase().trim();
    if (normCache[cacheKey]) return normCache[cacheKey];

    // ЭТАП 1: Поиск по коду ГЭСН (Самый точный)
    if (workCode && typeof Norms !== 'undefined' && Norms.getNormByCode) {
      const norm = Norms.getNormByCode(workCode);
      if (norm) {
        return normCache[cacheKey] = { normHoursPerUnit: norm.laborHoursPerUnit, _source: 'gesn_code' };
      }
    }

    // ЭТАП 2: Твой оригинальный поиск в словаре v3.2
    let norm = null;
    try {
      if (typeof Norms !== 'undefined' && Norms.getNorm) {
        norm = Norms.getNorm(workName);
      }
    } catch (e) { console.warn(`Norms error: ${e.message}`); }

    if (norm && isValidNorm(norm.laborHoursPerUnit)) {
      return normCache[cacheKey] = { 
        normHoursPerUnit: norm.laborHoursPerUnit, 
        _source: 'norms_dictionary' 
      };
    }

    // ЭТАП 3: AI fallback (Полевой аналитик)
    if (aiCallCount < AI_LIMIT && typeof aiModule !== 'undefined' && aiModule.classifyRow) {
      const aiAnswer = aiModule.classifyRow(workName);
      aiCallCount++;
      if (aiAnswer && isValidNorm(aiAnswer.normHoursPerUnit)) {
        return normCache[cacheKey] = { 
          normHoursPerUnit: aiAnswer.normHoursPerUnit, 
          _source: 'ai_fallback' 
        };
      }
    }

    return { normHoursPerUnit: 0.5, _source: 'not_found' };
  }

  function isValidNorm(value) {
    return value > 0 && typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  return { process };
})();
