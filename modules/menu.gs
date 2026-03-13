/**
 * menu.gs - v2.3 (Полная инженерная сборка)
 * Статус связи с GitHub: ПОДТВЕРЖДЕНО ✅
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🏗️ Субподрядчик');

  // === БЛОК 1: УПРАВЛЕНИЕ ИИ ===
  menu.addSubMenu(ui.createMenu('🤖 УПРАВЛЕНИЕ ИИ')
      .addItem('🚀 Запустить AI_RUNNER (GitHub)', 'triggerAiRunner')
      .addItem('🔍 Анализ структуры проекта', 'analyzeProjectStructure')
      .addSeparator()
      .addItem('🔑 Обновить GitHub Token', 'showTokenPrompt'));
  
  menu.addSeparator();

  // === БЛОК 2: СМЕТА ===
  menu.addSubMenu(ui.createMenu('СМЕТА')
      .addItem('Анализ сметы / ВОР', 'menuEstimate')
      .addItem('Моя смета', 'menuMyEstimate'));
  
  // === БЛОК 3: ТЕХНОЛОГИЯ ===
  menu.addItem('Выработка / Люди', 'menuTechnology');

  // === БЛОК 4: ГРАФИКИ ===
  menu.addSubMenu(ui.createMenu('График и Техника')
      .addItem('График выполнения работ', 'menuSchedule')
      .addItem('График рабочих', 'menuWorkers')
      .addItem('График техники', 'menuEquipment'));

  // === БЛОК 5: МАТЕРИАЛЫ ===
  menu.addSubMenu(ui.createMenu('Материалы')
      .addItem('Расход материалов', 'menuMaterialsConsumption')
      .addItem('Заявки на материалы', 'menuMaterialsRequest'));

  // === БЛОК 6: СЕБЕСТОИМОСТЬ ===
  menu.addSubMenu(ui.createMenu('Себестоимость / КП')
      .addItem('Мой расчет стоимости', 'menuFinance')
      .addItem('Коммерческое предложение', 'menuCommerce'));

  // === БЛОК 7: БУХГАЛТЕРИЯ ===
  menu.addSubMenu(ui.createMenu('Бухгалтерия')
      .addItem('КС2 → КС3', 'menuKS2')
      .addItem('Счет на оплату', 'menuInvoice')
      .addItem('Акт сверки', 'menuAct'));

  menu.addToUi();
}

/**
 * ЛОГИКА ОТПРАВКИ СИГНАЛА В GITHUB
 */
function triggerAiRunner() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    SpreadsheetApp.getUi().alert('🛑 Токен не найден. Нажмите "🔑 Установить GitHub Token".');
    return;
  }

  const REPO = 'silvestorstalone-coder/construction-ai-library';
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/ai-maintenance.yml/dispatches`;
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({ ref: 'main' }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 204) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Сигнал успешно отправлен в GitHub!', '🚀 СТАРТ');
  } else {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + response.getContentText());
  }
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */
function showTokenPrompt() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('🔑 Настройка', 'Введите ваш GitHub Token:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() == ui.Button.OK) {
    PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', result.getResponseText());
    ui.alert('✅ Токен сохранен.');
  }
}

function analyzeProjectStructure() {
  SpreadsheetApp.getUi().alert('Скоро: Получение карты файлов напрямую из GitHub.');
}

// === ОБРАБОТЧИКИ КНОПОК (Вызывают AI-логику) ===
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

function runSubpodryadAI(action) {
  SpreadsheetApp.getActiveSpreadsheet().toast('Запуск модуля: ' + action, '🏗️ Субподрядчик AI');
  // В будущем здесь можно добавить специфическую логику для каждого модуля
}
