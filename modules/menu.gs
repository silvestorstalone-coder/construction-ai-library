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
function menuEstimate() { runSubpodryadAI('estimate'); }
function menuMyEstimate() { runSubpodryadAI('myEstimate'); }
function menuTechnology() { runSubpodryadAI('technology'); }
function menuSchedule() { runSubpodryadAI('schedule'); }
function menuWorkers() { runSubpodryadAI('workers'); }
function menuEquipment() { runSubpodryadAI('equipment'); }
function menuMaterialsConsumption() { runSubpodryadAI('materialsConsumption'); }
function menuMaterialsRequest() { runSubpodryadAI('materialsRequest'); }
function menuFinance() { runSubpodryadAI('finance'); }
function menuCommerce() { runSubpodryadAI('commerce'); }
function menuKS2() { runSubpodryadAI('ks2'); }
function menuInvoice() { runSubpodryadAI('invoice'); }
function menuAct() { runSubpodryadAI('act'); }
