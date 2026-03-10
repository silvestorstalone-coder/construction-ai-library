// finance.gs
var Finance = (function() {

  function process(estimateResult, technologyResult, scheduleResult) {
    logInfo("Finance.process started.");

    if (!technologyResult) {
      throw new Error("Finance: нет данных Technology");
    }

    var totalHours = technologyResult.totalHours || 0;

    // БАЗОВЫЕ НАСТРОЙКИ
    var hourlyRate = 500;         // руб/час — вынести потом в Settings
    var overheadPercent = 15;     // накладные %
    var profitPercent = 20;       // прибыль %

    // 1️⃣ ТРУД
    var laborCost = totalHours * hourlyRate;

    // 2️⃣ МАТЕРИАЛЫ (пока 0 если нет расчёта)
    var materialsCost = 0;

    // 3️⃣ ТЕХНИКА (пока 0)
    var machineryCost = 0;

    var directCost = laborCost + materialsCost + machineryCost;

    // 4️⃣ НАКЛАДНЫЕ
    var overhead = directCost * overheadPercent / 100;

    // 5️⃣ СЕБЕСТОИМОСТЬ
    var costPrice = directCost + overhead;

    // 6️⃣ ПРИБЫЛЬ
    var profit = costPrice * profitPercent / 100;

    // 7️⃣ ЦЕНА ПРОДАЖИ
    var salesPrice = costPrice + profit;

    var result = {
      laborCost: laborCost,
      materialsCost: materialsCost,
      machineryCost: machineryCost,
      overhead: overhead,
      costPrice: costPrice,
      profit: profit,
      salesPrice: salesPrice
    };

    logInfo("Finance завершён. Себестоимость: " + costPrice);
    return result;
  }

  return { process: process };

})();
