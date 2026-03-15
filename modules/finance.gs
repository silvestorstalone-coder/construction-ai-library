// AI Refactored: 2026-03-15T10:25:20.645Z

const Finance = (() => {
  const DEFAULT_RATES = {
    earth: 450,
    concrete: 670,
    road: 580,
    electric: 850,
    finishing: 950,
    other: 500
  };

  const MAX_HOURS_PER_UNIT = 100;
  const MIN_HOURS_PER_UNIT = 0.01;

  const process = async (estimateResult, technologyResult, config = {}) => {
    console.log('=== Finance v5.3 [FINAL] STARTED ===');

    if (!technologyResult || !technologyResult.workStructure) {
      throw new Error('Finance: Technology.workStructure отсутствует');
    }

    const hourlyRate = Config.get('hourly_rate') || 500;
    const taxMultiplier = Config.get('tax_multiplier') || 1.20;
    const overheadMultiplier = Config.get('overhead_multiplier') || 1.15;

    let totalLaborCost = 0;
    let totalMaterialsCost = 0;
    let totalMachineryCost = 0;

    const anomalyLog = [];
    const workTypeSummary = {};

    // Batch-кэширование: ускоряет повторные расчеты по одинаковым работам
    const batchCache = new Map();

    const detailedWorkCosts = technologyResult.workStructure.map(item => {
      const cacheKey = `${item.name}_${item.workType}_${item.unit}`;
      if (batchCache.has(cacheKey)) return batchCache.get(cacheKey);

      // 1. Ставка по workType
      const currentRate = (config.laborRates && config.laborRates[item.workType]) || DEFAULT_RATES[item.workType] || DEFAULT_RATES.other;

      // 2. Sanity Check hours
      let workHours = item.hours || 0;
      if (workHours < MIN_HOURS_PER_UNIT) {
        anomalyLog.push(`⚠️ Малые часы для "${item.name}": ${workHours}. Установлено MIN_HOURS_PER_UNIT`);
        workHours = MIN_HOURS_PER_UNIT;
      } else if (workHours > MAX_HOURS_PER_UNIT) {
        anomalyLog.push(`⚠️ Чрезмерные часы для "${item.name}": ${workHours}. Обрезано до MAX_HOURS_PER_UNIT`);
        workHours = MAX_HOURS_PER_UNIT;
      }

      const quantity = (item.quantity != null && item.quantity >= 0) ? item.quantity : 0;
      const price = (item.price != null && item.price >= 0) ? item.price : 0;

      if (item.quantity < 0 || item.price < 0) {
        anomalyLog.push(`⚠️ Отрицательная величина в "${item.name}" (qty: ${item.quantity}, price: ${item.price})`);
      }

      const laborCost = workHours * currentRate;
      const materialsCost = quantity * price;
      const machineryCost = item.machineryCost || 0;

      totalLaborCost += laborCost;
      totalMaterialsCost += materialsCost;
      totalMachineryCost += machineryCost;

      // Сводка по workType
      if (!workTypeSummary[item.workType]) workTypeSummary[item.workType] = { hours: 0, labor: 0, materials: 0, machinery: 0 };
      workTypeSummary[item.workType].hours += workHours;
      workTypeSummary[item.workType].labor += laborCost;
      workTypeSummary[item.workType].materials += materialsCost;
      workTypeSummary[item.workType].machinery += machineryCost;

      const detailedItem = {
        name: item.name,
        workType: item.workType,
        hours: workHours,
        rate: currentRate,
        laborCost,
        materialsCost,
        machineryCost,
        totalCost: laborCost + materialsCost + machineryCost
      };

      batchCache.set(cacheKey, detailedItem);
      return detailedItem;
    });

    // Агрегация
    const directCosts = totalLaborCost + totalMaterialsCost + totalMachineryCost;
    const finalBudget = directCosts * overheadMultiplier * taxMultiplier;
    const internalExpenses = finalBudget - directCosts;
    const estimateMargin = estimateResult.gp_margin_total || 0;
    const netProfitDelta = estimateMargin - internalExpenses;

    const summary = {
      labor: totalLaborCost,
      materials: totalMaterialsCost,
      machinery: totalMachineryCost,
      directCosts,
      estimateMargin,
      internalExpenses,
      netProfitDelta,
      grossProfit: estimateMargin,
      netProfit: netProfitDelta,
      internalMargin: internalExpenses,
      profitability: ((netProfitDelta / directCosts) * 100).toFixed(2) + '%',
      detailedWorkCosts,
      workTypeSummary,
      anomalies: anomalyLog
    };

    // CI-ready логирование
    console.log(`
      === Finance v5.3 [FINAL] COMPLETED ===
      Total labor: ${summary.labor.toFixed(2)}
      Total materials: ${summary.materials.toFixed(2)}
      Total machinery: ${summary.machinery.toFixed(2)}
      Direct costs: ${directCosts.toFixed(2)}
      Estimate margin: ${estimateMargin.toFixed(2)}
      Internal expenses: ${internalExpenses.toFixed(2)}
      Net profit delta: ${netProfitDelta.toFixed(2)} (${summary.profitability})
      Work types: ${Object.keys(workTypeSummary).join(', ')}
      Anomalies: ${anomalyLog.length}
    `);

    anomalyLog.forEach(msg => console.warn(msg));

    return summary;
  };

  return { process };
})();