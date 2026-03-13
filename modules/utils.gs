/**
 * Вспомогательные функции для Subpodryad AI
 * Загрузка данных, нормализация, преобразование
 */
var Utils = (function() {

  /**
   * Загружает весь лист в 2D массив
   */
  function loadDataFromSheetRaw(sheet) {
    return sheet.getDataRange().getValues();
  }

  /**
   * Преобразует 2D массив в массив объектов (первый ряд - заголовки)
   */
  function convert2DArrayToObjects(values) {
    if (!values || values.length <= 1) return [];

    var headers = [];
    for (var j = 0; j < values[0].length; j++) {
      headers.push(String(values[0][j]).trim());
    }

    var data = [];
    for (var i = 1; i < values.length; i++) {
      var rowObject = {};
      for (var j = 0; j < headers.length; j++) {
        rowObject[headers[j]] = values[i][j];
      }
      data.push(rowObject);
    }

    return data;
  }

  /**
   * Нормализация имен столбцов
   */
  function normalizeColumnNames(data) {
    var columnMap = {
      "труд": "Трудозатраты",
      "labour": "Трудозатраты",
      "материалы": "Материалы",
      "materials": "Материалы",
      "стоимость": "Стоимость",
      "cost": "Стоимость",
      "объем": "Объем",
      "quantity": "Объем",
      "ед. изм.": "Ед. изм."
    };

    for (var i = 0; i < data.length; i++) {
      for (var key in data[i]) {
        if (columnMap.hasOwnProperty(key.toLowerCase())) {
          data[i][columnMap[key.toLowerCase()]] = data[i][key];
          if (key !== columnMap[key.toLowerCase()]) delete data[i][key];
        }
      }
    }

    return data;
  }

  /**
   * Нормализация единиц измерения
   */
  function normalizeUnits(value) {
    if (!value) return "";
    var unitMap = {
      "м2": "м²",
      "м.п.": "м.п.",
      "шт": "шт.",
      "кг": "кг."
    };
    var val = String(value).toLowerCase();
    return unitMap[val] || value;
  }

  return {
    loadDataFromSheetRaw: loadDataFromSheetRaw,
    convert2DArrayToObjects: convert2DArrayToObjects,
    normalizeColumnNames: normalizeColumnNames,
    normalizeUnits: normalizeUnits
  };

})();

/**
 * ГАРАНТИЯ ДАННЫХ ДЛЯ ESTIMATE
 * Не меняет существующие функции — только страхует их результат.
 */
function normalizeSheetValues(values) {
  if (!values || values.length === 0) {
    logWarning("normalizeSheetValues: пустые данные листа — ошибка");
    throw new Error("Пустые данные листа");
  }

  return values.map(row =>
    Array.isArray(row)
      ? row
      : Object.values(row || {})
  );
}