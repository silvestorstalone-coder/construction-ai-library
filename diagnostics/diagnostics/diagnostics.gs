// diagnostics.gs

/**
 * Модуль логирования для Subpodryad AI
 * Создает лист LOG и записывает INFO, WARNING, ERROR
 */
var Diagnostics = (function() {

  var logSheetName = "LOG";

  function initLogger() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(logSheetName);
    if (!sheet) {
      sheet = ss.insertSheet(logSheetName);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, 3).setValues([["Время", "Уровень", "Сообщение"]]);
  }

  function log(level, message) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(logSheetName);
    if (!sheet) {
      sheet = ss.insertSheet(logSheetName);
      sheet.getRange(1, 1, 1, 3).setValues([["Время", "Уровень", "Сообщение"]]);
    }
    var time = new Date();
    sheet.appendRow([time, level, message]);
    Logger.log(level + ": " + message);
  }

  function logInfo(message) {
    log("INFO", message);
  }

  function logWarning(message) {
    log("WARNING", message);
  }

  function logError(message) {
    log("ERROR", message);
  }

  return {
    initLogger: initLogger,
    log: log,
    logInfo: logInfo,
    logWarning: logWarning,
    logError: logError
  };

})();

// Глобальные функции для main.gs
var initLogger = Diagnostics.initLogger;
var logInfo = Diagnostics.logInfo;
var logWarning = Diagnostics.logWarning;
var logError = Diagnostics.logError;
