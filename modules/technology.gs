// AI Refactored

const Technology = (() => {
  const normCache = {};
  const fuzzyCache = {};
  let aiCallCount = 0;
  const AI_LIMIT = 100;

  async function process(estimateOutput) {
    console.log('=== Technology v4.3 SUPER FINAL STARTED ===');

    const projectContext = estimateOutput.projectContext || { previousWorks: [] };
    if (!estimateOutput.projectContext) console.warn('projectContext отсутствует — fuzzyMatch будет отключен');

    if (!estimateOutput || !estimateOutput.stages || estimateOutput.stages.length === 0) {
      console.warn('Technology: нет этапов.');
      return { totalHours: 0, workers: 1, workStructure: [], stats: {} };
    }

    let totalHours = 0;
    let totalWorksProcessed = 0;
    let worksWithNorm = 0;
    let worksWithoutNorm = 0;
    const workStructure = [];
    const normSources = { gesn_code: 0, norms_dictionary: 0, ai_fallback: 0, smart_fallback: 0, fuzzy_match: 0, not_found: 0 };

    estimateOutput.stages.forEach((stage) => {
      if (!stage.subsections || stage.subsections.length === 0) {
        const flatWorks = stage.works || [];
        processWorks(flatWorks, stage.name, 'Общий подраздел');
        return;
      }
      stage.subsections.forEach((sub) => {
        if (!sub.works || sub.works.length === 0) return;
        processWorks(sub.works, stage.name, sub.name);
      });
    });

    function processWorks(works, stageName, subName) {
      works.forEach((work) => {
        const workName = (work.normalizedName || work.name || '').trim();
        const workCode = work.code || null;
        const workType = work.workType || 'other';

        if (!workName) return;
        totalWorksProcessed++;

        const techData = getTechnologyForWork(workName, workCode, workType, projectContext);
        let hours = 0;
        let finalNorm = techData.normHoursPerUnit;
        let source = techData._source || 'not_found';

        // ✅ Sanity Check верхний и нижний порог
        if (finalNorm > 100) {
          console.warn(`🚨 Sanity Check: Норма ${finalNorm} для "${workName}" слишком высока. Срезано до 100.`);
          finalNorm = 100;
        }
        if (finalNorm < 0.01) finalNorm = 0.01;

        hours = finalNorm * (work.quantity || 0);
        if (source !== 'not_found') worksWithNorm++;
        else worksWithoutNorm++;

        normSources[source] = (normSources[source] || 0) + 1;
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
          norm: finalNorm,
          hours: hours,
          normSource: source
        });
      });
    }

    const workers = Math.max(1, Math.ceil(totalHours / 160));
    const coveragePercent = totalWorksProcessed > 0 ? Math.round((worksWithNorm / totalWorksProcessed) * 100) : 0;

    if (totalWorksProcessed > 0 && totalHours === 0) {
      const errorMsg = `
        🚨 Technology CRITICAL: totalHours === 0 при ${totalWorksProcessed} работах.
        Источники: ${JSON.stringify(normSources)}
        Покрытие: ${coveragePercent}%
      `;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`
      === Technology v4.3 COMPLETED ===
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

  function getTechnologyForWork(workName, workCode, workType = 'other', projectContext = { previousWorks: [] }) {
    if (!workName && !workCode) return { normHoursPerUnit: 0.5, _source: 'not_found' };

    const cacheKey = (workCode || workName).toLowerCase().trim();
    if (normCache[cacheKey]) return normCache[cacheKey];

    // 🔹 Этап 1: поиск по коду ГЭСН
    if (workCode && typeof Norms !== 'undefined' && Norms.getNormByCode) {
      const norm = Norms.getNormByCode(workCode);
      if (norm) return normCache[cacheKey] = { normHoursPerUnit: norm.laborHoursPerUnit, _source: 'gesn_code' };
    }

    // 🔹 Этап 2: словарь Norms
    let norm = null;
    try {
      if (typeof Norms !== 'undefined' && Norms.getNorm) norm = Norms.getNorm(workName);
    } catch (e) { console.warn(`Norms error: ${e.message}`); }
    if (norm && isValidNorm(norm.laborHoursPerUnit)) {
      return normCache[cacheKey] = { normHoursPerUnit: norm.laborHoursPerUnit, _source: 'norms_dictionary' };
    }

    // 🔹 Этап 3: AI fallback
    if (aiCallCount < AI_LIMIT && typeof aiModule !== 'undefined' && aiModule.classifyRow) {
      const aiAnswer = aiModule.classifyRow(workName);
      aiCallCount++;
      if (aiAnswer && isValidNorm(aiAnswer.normHoursPerUnit)) {
        return normCache[cacheKey] = { normHoursPerUnit: aiAnswer.normHoursPerUnit, _source: 'ai_fallback' };
      }
    }

    // 🔹 Этап 4: Fuzzy Match (оптимизировано)
    if (projectContext.previousWorks.length > 0) {
      if (!fuzzyCache[cacheKey]) {
        const match = projectContext.previousWorks.find(prev =>
          prev.name && workName.slice(0, 4).toLowerCase() === prev.name.slice(0, 4).toLowerCase() &&
          fuzzyMatch(workName, prev.name)
        );
        if (match && match.normHoursPerUnit) {
          fuzzyCache[cacheKey] = { normHoursPerUnit: match.normHoursPerUnit, _source: 'fuzzy_match' };
        } else {
          fuzzyCache[cacheKey] = null;
        }
      }
      if (fuzzyCache[cacheKey]) return normCache[cacheKey] = fuzzyCache[cacheKey];
    }

    // 🔹 Этап 5: Smart fallback по типу работы
    const defaultNorms = Config.get('defaultNorms') || {
      earth: 0.05,
      concrete: 1.2,
      finishing: 2.5,
      other: 0.5
    };
    const fallbackValue = defaultNorms[workType] || 0.5;
    return normCache[cacheKey] = { normHoursPerUnit: fallbackValue, _source: 'smart_fallback' };
  }

  function isValidNorm(value) {
    return value > 0 && typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  // 🔹 Простая реализация Левенштейна для fuzzyMatch
  function fuzzyMatch(a, b) {
    if (!a || !b) return false;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1);
      }
    }
    const distance = dp[m][n];
    const ratio = 1 - distance / Math.max(m, n);
    return ratio >= 0.75;
  }

  return { process };
})();