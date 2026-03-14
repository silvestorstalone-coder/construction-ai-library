// AI Refactored: 2026-03-14T12:27:03.396Z

const Finance = (() => {
  const process = (estimateResult, technologyResult) => {
    console.log('=== Finance v4.0 [Margin Control] STARTED ===');

    if (!technologyResult) {
      throw new Error('Finance: нет данных Technology');
    }

    const totalHours = technologyResult.totalHours;

    // БАЗОВЫЕ НАСТРОЙКИ (Берем из Config)
    const { hourly_rate, tax_multiplier, overhead_multiplier } = Config.get('hourly_rate', 'tax_multiplier', 'overhead_multiplier');
    const hourlyRate = hourly_rate || 500;
    const overheadMultiplier = overhead_multiplier || 1.15;
    const taxMultiplier = tax_multiplier || 1.20;

    // 1️⃣ ТРУД (Себестоимость)
    const laborCost = totalHours * hourlyRate;

    // 2️⃣ МАТЕРИАЛЫ И ТЕХНИКА (Себестоимость)
    let directMaterialsCost = 0;
    if (estimateResult && estimateResult.totalWorksList) {
      // Здесь считаем только "грязную" цену материалов
      for (const work of estimateResult.totalWorksList) {
        directMaterialsCost += (work.quantity || 0) * (work.price || 0);
      }
    } else {
      throw new Error('Finance: нет данных Estimate');
    }

    const machineryCost = technologyResult.machineryCost || 0;

    // 3️⃣ ИТОГО ПРЯМЫЕ ЗАТРАТЫ (Наша реальная база)
    const ourDirectCosts = laborCost + directMaterialsCost + machineryCost;

    // 4️⃣ МАРЖА ГЕНПОДРЯДЧИКА (Из сметы заказчика)
    // Это те деньги (НР, СП, НДС), которые УЖЕ заложены в смету
    const gpMarginFromEstimate = technologyResult.gp_margin_total || 0;

    // 5️⃣ НАКЛАДНЫЕ И НАЛОГИ (Наши внутренние)
    const totalWithOverhead = ourDirectCosts * overheadMultiplier;
    const finalTotalWithTaxes = totalWithOverhead * taxMultiplier;

    // 6️⃣ РАСЧЕТ ДЕЛЬТЫ (Критический показатель)
    // Дельта = (Заложенная в смете маржа) - (Наши налоги и накладные)
    const internalExpenses = finalTotalWithTaxes - ourDirectCosts;
    const netProfitDelta = gpMarginFromEstimate - internalExpenses;

    if (isNaN(finalTotalWithTaxes)) {
      throw new Error('Finance: критическая ошибка расчета (NaN)');
    }

    const result = {
      laborCost,
      materialsCost: directMaterialsCost,
      machineryCost,
      ourDirectCosts,
      gpMarginFromEstimate, // Деньги от заказчика на "накладные"
      internalExpenses,     // Наши реальные траты на "накладные"
      netProfitDelta,       // ЧИСТАЯ ВЫГОДА (Если > 0, мы заработали сверх плана)
      totalFinal: finalTotalWithTaxes,
      taxValue: finalTotalWithTaxes - totalWithOverhead
    };

    console.log(`
      === Finance v4.0 COMPLETED ===
      Прямые затраты: ${ourDirectCosts.toFixed(2)}
      Маржа из сметы: ${gpMarginFromEstimate.toFixed(2)}
      Наши расходы (НР+Налоги): ${internalExpenses.toFixed(2)}
      ------------------------------
      ИТОГОВАЯ ДЕЛЬТА: ${netProfitDelta.toFixed(2)}
      ${netProfitDelta >= 0 ? '✅ Проект прибыльный' : '🚨 ВНИМАНИЕ: Расходы превышают маржу сметы!'}
    `);

    return result;
  };

  return { process };
})();