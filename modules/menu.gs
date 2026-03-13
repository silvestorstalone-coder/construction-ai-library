// menu.gs
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Субподрядчик')
    // Главный пункт "СМЕТА" с подменю
    .addSubMenu(ui.createMenu('СМЕТА')
      .addItem('Анализ сметы / ВОР', 'menuEstimate')
      .addItem('Моя смета', 'menuMyEstimate')
    )
    // Выработка / Люди
    .addItem('Выработка / Люди', 'menuTechnology')
    // График и Техника
    .addSubMenu(ui.createMenu('График и Техника')
      .addItem('График выполнения работ', 'menuSchedule')
      .addItem('График рабочих', 'menuWorkers')
      .addItem('График техники', 'menuEquipment')
    )
    // Материалы
    .addSubMenu(ui.createMenu('Материалы')
      .addItem('Расход материалов', 'menuMaterialsConsumption')
      .addItem('Заявки на материалы', 'menuMaterialsRequest')
    )
    // Себестоимость / КП
    .addSubMenu(ui.createMenu('Себестоимость / КП')
      .addItem('Мой расчет стоимости', 'menuFinance')
      .addItem('Коммерческое предложение', 'menuCommerce')
    )
    // Бухгалтерия
    .addSubMenu(ui.createMenu('Бухгалтерия')
      .addItem('КС2 → КС3', 'menuKS2')
      .addItem('Счет на оплату', 'menuInvoice')
      .addItem('Акт сверки', 'menuAct')
    )
    .addToUi();
}

// === Пункты меню вызывают runSubpodryadAI с action ===
function menuEstimate() { 
  logInfo("Начало расчета сметы");
  runSubpodryadAI('estimate'); 
  logInfo("Завершение расчета сметы");
}
function menuMyEstimate() { 
  logInfo("Начало расчета моей сметы");
  runSubpodryadAI('myEstimate'); 
  logInfo("Завершение расчета моей сметы");
}
function menuTechnology() { 
  logInfo("Начало расчета трудозатрат");
  runSubpodryadAI('technology'); 
  logInfo("Завершение расчета трудозатрат");
}
function menuSchedule() { 
  logInfo("Начало расчета графика");
  runSubpodryadAI('schedule'); 
  logInfo("Завершение расчета графика");
}
function menuWorkers() { 
  logInfo("Начало расчета графика рабочих");
  runSubpodryadAI('workers'); 
  logInfo("Завершение расчета графика рабочих");
}
function menuEquipment() { 
  logInfo("Начало расчета графика техники");
  runSubpodryadAI('equipment'); 
  logInfo("Завершение расчета графика техники");
}
function menuMaterialsConsumption() { 
  logInfo("Начало расчета расхода материалов");
  runSubpodryadAI('materialsConsumption'); 
  logInfo("Завершение расчета расхода материалов");
}
function menuMaterialsRequest() { 
  logInfo("Начало расчета заявок на материалы");
  runSubpodryadAI('materialsRequest'); 
  logInfo("Завершение расчета заявок на материалы");
}
function menuFinance() { 
  logInfo("Начало расчета себестоимости");
  runSubpodryadAI('finance'); 
  logInfo("Завершение расчета себестоимости");
}
function menuCommerce() { 
  logInfo("Начало формирования коммерческого предложения");
  runSubpodryadAI('commerce'); 
  logInfo("Завершение формирования коммерческого предложения");
}
function menuKS2() { 
  logInfo("Начало обработки КС2");
  runSubpodryadAI('ks2'); 
  logInfo("Завершение обработки КС2");
}
function menuInvoice() { 
  logInfo("Начало формирования счета на оплату");
  runSubpodryadAI('invoice'); 
  logInfo("Завершение формирования счета на оплату");
}
function menuAct() { 
  logInfo("Начало формирования акта сверки");
  runSubpodryadAI('act'); 
  logInfo("Завершение формирования акта сверки");
}