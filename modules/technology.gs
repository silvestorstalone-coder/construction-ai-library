// AI Refactored: 2026-03-13T19:53:26.705Z

const Technology = (() => {
  const normCache = {};
  let aiCallCount = 0; // Счётчик AI запросов
  const AI_LIMIT = 100; // Максимум AI запросов за один процесс

  function process(estimateOutput) {
    console.log('=== Technology v3.2 STARTED ===');

    if (!estimateOutput || !estimateOutput.stages || estimateOutput.stages.length === 0) {
      console.warn('Technology: нет этапов.');
      return { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    let totalHours = 0;
    let totalWorksProcessed = 0;
    let worksWithNorm = 0;
    let worksWithoutNorm = 0;
    const workStructure = [];
    const normSources = { norms_dictionary: 0, ai_fallback: 0, not_found: 0 };

    estimateOutput.stages.forEach((stage) => {
      if (!stage.subsections || stage.subsections.length === 0) return;

      stage.subsections.forEach((sub) => {
        if (!sub.works || sub.works.length === 0) return;

        sub.works.forEach((work) => {
          const workName = (work.normalizedName || work.name || '').trim();
          if (!workName) return;

          totalWorksProcessed++;

          const techData = getTechnologyForWork(workName);
          let hours = 0;
          let source = 'not_found';

          if (techData && isValidNorm(techData.normHoursPerUnit)) {
            hours = techData.normHoursPerUnit * (work.quantity || 0);
            worksWithNorm++;
            source = techData._source || 'unknown';
            normSources[source] = (normSources[source] || 0) + 1;
          } else {
            console.warn(`Нет нормы для: "${workName}"`);
            worksWithoutNorm++;
            normSources.not_found++;
          }

          totalHours += hours;

          workStructure.push({
            rawRowIndex: work.rawRowIndex || 0,
            stage: stage.name,
            subsection: sub.name,
            name: workName,
            unit: work.unit || '',
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
      const coveragePercent = worksWithNorm > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

      const errorMsg = `
        🚨 Technology CRITICAL: totalHours === 0 при ${totalWorksProcessed} работах.
        С нормой: ${worksWithNorm}, без нормы: ${worksWithoutNorm}, покрытие: ${coveragePercent}%
        Источники норм: ${JSON.stringify(normSources)}
        AI запросов: ${aiCallCount}
        → Причины:
        1. Словарь Norms.js неполный
        2. AI отключен / нет API ключа
        3. Нормализация сломала названия работ
        → Действие: пополните normsDB или проверьте структуру сметы
      `;

      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const workers = Math.max(1, Math.ceil(totalHours / 160));
    const coveragePercent = totalWorksProcessed > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

    console.log(`
      === Technology v3.2 COMPLETED ===
      Работ обработано: ${totalWorksProcessed}
      Найдено норм: ${worksWithNorm} (${coveragePercent}%)
      Без норм: ${worksWithoutNorm}
      Источники: ${JSON.stringify(normSources)}
      Всего часов: ${totalHours.toFixed(2)}
      Бригад: ${workers}
      AI запросов: ${aiCallCount}
    `);

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

    const cacheKey = workName.toLowerCase().trim();
    if (normCache[cacheKey]) return normCache[cacheKey];

    // 1. Norms dictionary
    let norm = null;
    try {
      if (typeof Norms !== 'undefined' && Norms.getNorm) {
        norm = Norms.getNorm(workName);
      }
    } catch (e) {
      console.warn(`Norms.getNorm error для '${workName}': ${e.message}`);
    }

    if (norm && isValidNorm(norm.laborHoursPerUnit)) {
      const result = {
        normHoursPerUnit: norm.laborHoursPerUnit,
        machinery: norm.machinery || null,
        _source: 'norms_dictionary'
      };
      normCache[cacheKey] = result;
      return result;
    }

    // 2. AI fallback
    if (aiCallCount >= AI_LIMIT) return { normHoursPerUnit: 0.5, _source: 'ai_fallback' }; // Среднее значение

    try {
      if (typeof aiModule !== 'undefined' && aiModule.classifyRow) {
        const aiAnswer = aiModule.classifyRow(workName);
        aiCallCount++;

        if (aiAnswer && isValidNorm(aiAnswer.normHoursPerUnit)) {
          const aiResult = {
            normHoursPerUnit: aiAnswer.normHoursPerUnit,
            machinery: null,
            _source: 'ai_fallback'
          };
          normCache[cacheKey] = aiResult;
          console.log(`AI ACCEPTED для "${workName}": ${aiAnswer.normHoursPerUnit} чел-ч/ед`);
          return aiResult;
        } else {
          console.warn(`AI REJECTED для "${workName}". Response: ${JSON.stringify(aiAnswer)}`);
        }
      }
    } catch (e) {
      console.warn(`AI ERROR для "${workName}": ${e.message}`);
    }

    return { normHoursPerUnit: 0.5, _source: 'not_found' };
  }

  function isValidNorm(value) {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'number') return false;
    if (isNaN(value)) return false;
    if (!isFinite(value)) return false;
    if (value <= 0) return false;
    return true;
  }

  return { process };
})();