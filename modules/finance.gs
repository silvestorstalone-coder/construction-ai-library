// AI Refactored: 2026-03-13T19:19:24.070Z

const Finance = (() => {
  const process = (estimateResult, technologyResult) => {
    console.log('Finance.process started.');

    if (!technologyResult) {
      throw new Error('Finance: нет данных Technology');
    }

    const totalHours = technologyResult.totalHours;

    // БАЗОВЫЕ НАСТРОЙКИ
    const { hourly_rate = 500, overhead_multiplier = 1.15, tax_multiplier = 1.20 } = Config.get();

    // 1️⃣ ТРУД
    const laborCost = totalHours * hourly_rate;

    // 2️⃣ МАТЕРИАЛЫ
    let materialsCost = 0;
    if (estimateResult && estimateResult.totalWorksList) {
      for (const work of estimateResult.totalWorksList) {
        materialsCost += work.quantity * work.price;
      }
    } else {
      throw new Error('Finance: нет данных Estimate');
    }

    // 3️⃣ ТЕХНИКА
    const machineryCost = technologyResult.machineryCost || 0;

    const directCosts = laborCost + materialsCost + machineryCost;

    // 4️⃣ НАКЛАДНЫЕ
    const overheadValue = directCosts * overhead_multiplier;

    // 6️⃣ ИТОГОВАЯ СУММА С УЧЕТОМ НАЛОГОВ
    const finalTotal = directCosts * overhead_multiplier * tax_multiplier;

    const result = {
      laborCost,
      materialsCost,
      machineryCost,
      overheadValue,
      taxValue: finalTotal - directCosts * overhead_multiplier,
      totalFinal: finalTotal,
      margin: finalTotal - directCosts
    };

    console.log(`Finance завершён. Итоговая сумма: ${finalTotal}`);
    return result;
  };

  return { process };
})();