// profit.gs
var Profit = (function() {

  function process(financeOutput) {
    logInfo("Profit.process started.");

    var markup = 0.15; // 15% маржа согласно эталону
    var salesPrice = financeOutput.totalCost * (1 + markup);
    var profitAmount = salesPrice - financeOutput.totalCost;

    logInfo("Profit.process completed. Sales price: " + salesPrice + ", Profit: " + profitAmount);

    return {
      totalCost: financeOutput.totalCost,
      markupPercentage: markup,
      profitAmount: profitAmount,
      salesPrice: salesPrice
    };
  }

  return { process: process };

})();