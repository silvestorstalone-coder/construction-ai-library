var Finance = (function() {

  function process(estimateResult, technologyResult) {
    logInfo("Finance.process started.");

    if (!technologyResult) {
      throw new Error("Finance: нет данных Technology");
    }

    var totalHours = technologyResult.totalHours;

    // БАЗОВЫЕ НАСТРОЙКИ
    var hourlyRate = 500;         // руб/час — вынести потом в Settings
    var overheadPercent = 15;     // накладные %

    // 1️⃣ ТРУД
    var laborCost = totalHours * hourlyRate;

    // 2️⃣ МАТЕРИАЛЫ
    var materialsCost = 0;
    if (estimateResult && estimateResult.totalWorksList) {
      for (var i = 0; i < estimateResult.totalWorksList.length; i++) {
        var work = estimateResult.totalWorksList[i];
        materialsCost += work.quantity * work.price;
      }
    } else {
      throw new Error("Finance: нет данных Estimate");
    }

    // 3️⃣ ТЕХНИКА
    var machineryCost = technologyResult.machineryCost || 0;

    var directCost = laborCost + materialsCost + machineryCost;

    // 4️⃣ НАКЛАДНЫЕ
    var overhead = directCost * overheadPercent / 100;

    // 5️⃣ СЕБЕСТОИМОСТЬ
    var costPrice = directCost + overhead;

    var result = {
      laborCost: laborCost,
      materialsCost: materialsCost,
      machineryCost: machineryCost,
      overhead: overhead,
      costPrice: costPrice
    };

    logInfo("Finance завершён. Себестоимость: " + costPrice);
    return result;
  }

  return { process: process };

})();