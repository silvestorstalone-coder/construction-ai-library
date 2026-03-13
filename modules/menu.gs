/**
 * menu.gs - v2.1 (GitHub AI Docs Manager)
 * Дизайн: Субподрядчик (Сохранено)
 * Безопасность: PropertiesService
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏗️ Субподрядчик')
    // РАЗДЕЛ УПРАВЛЕНИЯ ИИ
    .addSubMenu(ui.createMenu('🤖 УПРАВЛЕНИЕ ИИ')
      .addItem('🔍 Анализ структуры (GitHub)', 'analyzeProjectStructure')
      .addItem('🚀 Запустить AI_RUNNER (Full Cycle)', 'triggerAiRunner')
      .addSeparator()
      .addItem('🔑 Установить GitHub Token', 'showTokenPrompt')
    )
    .addSeparator()
    // ТВОЯ ЛОГИКА
    .addSubMenu(ui.createMenu('СМЕТА')
      .addItem('Анализ сметы / ВОР', 'menuEstimate')
      .addItem('Моя смета', 'menuMyEstimate')
    )
    .addItem('Выработка / Люди', 'menuTechnology')
    .addSubMenu(ui.createMenu('График и Техника')
      .addItem('График выполнения работ', 'menuSchedule')
      .addItem('График рабочих', 'menuWorkers')
      .addItem('График техники', 'menuEquipment')
    )
    .addSubMenu(ui.createMenu('Себестоимость / КП')
      .addItem('Мой расчет стоимости', 'menuFinance')
      .addItem('Коммерческое предложение', 'menuCommerce')
    )
    .addToUi();
}

/**
 * БЕЗОПАСНОСТЬ: Установка токена в память проекта
 */
function showTokenPrompt() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('🔑 Настройка безопасности', 'Введите ваш GitHub Personal Access Token:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() == ui.Button.OK) {
    const token = result.getResponseText();
    PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
    ui.alert('✅ Токен сохранен в защищенное хранилище.');
  }
}

/**
 * ВЫЗОВ GITHUB ACTIONS
 */
function triggerAiRunner() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    SpreadsheetApp.getUi().alert('🛑 Токен не найден. Нажмите "🔑 Установить GitHub Token".');
    return;
  }

  const REPO = 'silvestorstalone-coder/construction-ai-library';
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/ai_maintenance.yml/dispatches`;
  
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

// --- ТВОИ ОРИГИНАЛЬНЫЕ ФУНКЦИИ (вызывают runSubpodryadAI) ---
function menuEstimate() { runSubpodryadAI('estimate'); }
function menuFinance() { runSubpodryadAI('finance'); }
// ... (добавь остальные аналогично)

function runSubpodryadAI(action) {
  SpreadsheetApp.getActiveSpreadsheet().toast('Запуск модуля: ' + action, '🤖 Субподрядчик AI');
  // Логика локального запуска...
}
