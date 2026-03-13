/**
 * Конфигурация проекта Subpodryad AI v2.0
 */
var Config = (function() {
  var defaultSettings = {
    hourly_rate: 500,          // Ставка в час
    tax_multiplier: 1.20,      // НДС 20%
    overhead_multiplier: 1.15, // Накладные 15%
    defaultWorkers: 8,
    defaultOverhead: 0.15,
    defaultProfit: 0.10,
    defaultDailyOutputPerWorker: 8
  };

  function get(settingName) {
    return defaultSettings.hasOwnProperty(settingName) ? defaultSettings[settingName] : 0;
  }

  function set(settingName, value) {
    defaultSettings[settingName] = value;
  }

  return { get: get, set: set };
})();
