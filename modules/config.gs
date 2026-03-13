/**
 * Конфигурация проекта Subpodryad AI
 * Настройки по умолчанию для модулей
 */
var Config = (function() {

  var defaultSettings = {
    defaultWorkers: 8,
    defaultOverhead: 0.15,
    defaultProfit: 0.10,
    defaultDailyOutputPerWorker: 8
  };

  function get(settingName) {
    if (defaultSettings.hasOwnProperty(settingName)) {
      return defaultSettings[settingName];
    } else {
      logWarning("Настройки с именем " + settingName + " не существует.");
      return null;
    }
  }

  function set(settingName, value) {
    defaultSettings[settingName] = value;
  }

  return {
    get: get,
    set: set
  };

})();