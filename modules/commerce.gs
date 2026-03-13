// commerce.gs
var Commerce = (function() {

  function process(financeResult) {
    logInfo("Commerce.process started.");

    if (!financeResult) {
      throw new Error("Commerce: нет данных Finance");
    }

    var cp = {
      title: "Коммерческое предложение",
      totalPrice: financeResult.totalCost * 1.2, // Пример расчета с учетом наценки
      profitAmount: financeResult.totalCost * 0.2, // Пример расчета прибыли
      terms: "50% предоплата, 50% по факту",
      validityDays: 30,
      date: new Date().toLocaleDateString('ru-RU')
    };

    logInfo("Commerce завершён. Цена: " + cp.totalPrice);
    return cp;
  }

  return { process: process };

})();