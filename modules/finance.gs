// AI Refactored: 2026-03-13T18:15:14.102Z

const Finance = (() => {
  const process = (estimateResult, technologyResult) => {
    console.log('Finance.process started.');

    if (!technologyResult) {
      throw new Error('Finance: нет данных Technology');
    }

    const totalHours = technologyResult.totalHours;

    // БАЗОВЫЕ НАСТРОЙКИ
    const hourlyRate = 500; // руб/час — вынести потом в Settings
    const overheadMultiplier = 1.15; // накладные

    // 1️⃣ ТРУД
    const laborCost = totalHours * hourlyRate;

    // 2️⃣ МАТЕРИАЛЫ
    let materialsCost = 0;
    if (estimateResult && estimateResult.totalWorksList) {
      for (let i = 0; i < estimateResult.totalWorksList.length; i++) {
        const work = estimateResult.totalWorksList[i];
        materialsCost += work.quantity * work.price;
      }
    } else {
      throw new Error('Finance: нет данных Estimate');
    }

    // 3️⃣ ТЕХНИКА
    const machineryCost = technologyResult.machineryCost || 0;

    const directCosts = laborCost + materialsCost + machineryCost;

    // 4️⃣ НАКЛАДНЫЕ
    const overheadValue = directCosts * overheadMultiplier;

    // 5️⃣ СЕБЕСТОИМОСТЬ
    const costPrice = directCosts + overheadValue;

    const result = {
      laborCost,
      materialsCost,
      machineryCost,
      overheadValue,
      costPrice
    };

    console.log(`Finance завершён. Себестоимость: ${costPrice}`);
    return result;
  };

  return { process };
})();