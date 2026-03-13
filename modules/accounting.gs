// accounting.gs
var Accounting = (function() {

  function process(financeOutput) {
    logInfo("Accounting.process started.");

    var ks2 = { documentType: "КС-2", totalAmount: financeOutput.totalCost };
    var ks3 = { documentType: "КС-3", totalAmount: financeOutput.totalCost, vat: financeOutput.totalCost * 0.2 };
    var invoice = {
      documentType: "Счет",
      amount: financeOutput.totalCost * 1.2,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString('ru-RU')
    };
    var reconciliation = { documentType: "Акт сверки", finalBalance: financeOutput.totalCost * 1.2 };

    logInfo("Accounting.process completed.");
    return { ks2: ks2, ks3: ks3, invoice: invoice, reconciliationStatement: reconciliation };
  }

  return { process: process };

})();