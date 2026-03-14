/**
 * =====================================================
 * ESTIMATE MODULE v10.0 [PLAN v2.0 - Слоёный пирог]
 * База: v9.1 (Industrial - Fixed)
 * Добавлено: Look-back, Regex ГЭСН, gp_margin.
 * =====================================================
 */

var Estimate = (function () {

  var FINANCIAL_KEYWORDS = [
    "фот","фзп","зп","оплата","фонд оплаты",
    "наклад","нр","накл","нормативные расходы",
    "прибыл","сметная","цена","всего","итого",
    "стоимость","сумма","основная зарплата"
  ];

  // Ключевые слова для выделения маржи Генподрядчика (v2.2)
  var GP_MARGIN_KEYWORDS = ["сметная прибыль", "нр", "сп", "накладные", "ндс", "лимитированные"];

  var UNIT_ALIASES = {
    "м3":"м3","куб.м":"м3","м³":"м3",
    "м2":"м2","кв.м":"м2","м²":"м2",
    "м.п.":"м.п.","пог.м":"м.п.","т":"т","кг":"кг","шт":"шт"
  };

  function process(sheet, options) {
    if (!sheet) throw new Error("Estimate.process: sheet не передан");
    
    const raw = sheet.getDataRange().getValues();
    if (!raw || raw.length === 0) throw new Error("Estimate: пустой лист");

    const headerIndex = detectHeaderRow(raw);
    const body = raw.slice(headerIndex + 1).filter(rowHasData);

    if (body.length === 0) throw new Error("Estimate: после заголовка нет данных");

    const columnMap = detectColumns(body);

    // Вызываем обновленный парсер с поддержкой Плана v2.0
    const parsed = parseRows(body, headerIndex, columnMap);
    const stages = buildStagesFromWorks(parsed.works);

    if (parsed.works.length === 0) {
      throw new Error("Estimate CRITICAL: не найдено работ. Проверьте Количество!");
    }

    return {
      type: "complex_v2",
      stages: stages,
      totalWorksList: parsed.works,
      gp_margin_total: parsed.gp_margin_total, // Новое поле v2.0
      diagnostics: {
        totalDataRows: body.length,
        worksCount: parsed.works.length,
        coveragePercent: Math.round((parsed.works.length / body.length) * 100)
      }
    };
  }

  function detectHeaderRow(values) {
    const anchors = ["наименование", "ед.изм", "количество", "кол-во", "обоснование"];
    for (let i = 0; i < Math.min(values.length, 100); i++) {
      const rowStr = values[i].join("|").toLowerCase();
      if (anchors.filter(a => rowStr.includes(a)).length >= 2) return i;
    }
    return 0;
  }

  // ТВОЯ ОРИГИНАЛЬНАЯ ЛОГИКА СТАТ-АНАЛИЗА (v9.1) - СОХРАНЕНА ПОЛНОСТЬЮ
  function detectColumns(rows) {
    if (!rows || rows.length === 0) return { name:0, quantity:null, price:null, unit:null };
    const sampleSize = Math.min(rows.length, 50);
    const colCount = rows[0].length;
    const stats = [];
    for (let c = 0; c < colCount; c++) {
      let numericCount = 0; let textLongCount = 0; let shortTextCount = 0;
      const shortTextUniqueValues = new Set();
      for (let r = 0; r < sampleSize; r++) {
        const val = rows[r][c];
        if (val === "" || val === null) continue;
        const num = parseNumber(val);
        if (!isNaN(num) && num !== 0) { numericCount++; }
        else {
          const str = String(val).trim();
          if (str.length > 20) textLongCount++;
          if (str.length > 0 && str.length <= 15) { shortTextCount++; shortTextUniqueValues.add(str.toLowerCase()); }
        }
      }
      stats.push({ index: c, numericCount, textLongCount, shortTextCount, shortTextUniqueRatio: shortTextCount > 0 ? shortTextUniqueValues.size / shortTextCount : 0 });
    }
    const nameCol = [...stats].sort((a,b) => b.textLongCount - a.textLongCount)[0]?.index || 0;
    const numericColsCandidates = stats.filter(s => s.numericCount > 5).sort((a,b) => b.numericCount - a.numericCount);
    const quantityCol = numericColsCandidates[0]?.index ?? null;
    const priceCol = numericColsCandidates[1]?.index ?? null;
    let bestUnitCol = null; let minRatio = Infinity;
    stats.forEach(s => {
      if (s.index === nameCol || s.index === quantityCol || s.index === priceCol) return;
      if (s.shortTextCount > 5 && s.shortTextUniqueRatio < minRatio) {
          minRatio = s.shortTextUniqueRatio; bestUnitCol = s.index;
      }
    });
    return { name: nameCol, quantity: quantityCol, price: priceCol, unit: bestUnitCol };
  }

  function parseRows(body, headerRowIndex, columnMap) {
    const works = [];
    let gp_margin_total = 0;
    let currentSection = "Общий этап";
    let lastValidName = ""; // Для Look-back logic

    body.forEach((row, i) => {
      const rawRowIndex = headerRowIndex + 1 + i;
      let name = String(row[columnMap.name] || "").trim();
      const lower = name.toLowerCase();
      const quantity = parseNumber(row[columnMap.quantity]);
      const price = parseNumber(row[columnMap.price]);

      // 1. Look-back logic (v2.2): если ячейка пуста, но есть цифры - берем имя сверху
      if (name === "" && !isNaN(quantity) && quantity > 0) {
        name = lastValidName;
      } else if (name !== "") {
        lastValidName = name;
      }

      if (!name) return;

      // 2. Слой Гены (Маржа/Налоги)
      if (GP_MARGIN_KEYWORDS.some(kw => lower.includes(kw))) {
        if (!isNaN(price)) gp_margin_total += price;
        return;
      }

      if (lower.startsWith("раздел") || lower.startsWith("глава")) {
        currentSection = name; return;
      }

      // 3. Слой Ядра (Техническая работа)
      if (!isNaN(quantity) && quantity > 0) {
        const codeMatch = name.match(/[а-яА-Я]+\s?\d+-\d+-\d+-\d+/); // Regex ГЭСН
        
        works.push({
          rawRowIndex,
          section: currentSection,
          name: name,
          code: codeMatch ? codeMatch[0] : null,
          unit: normalizeUnit(String(row[columnMap.unit] || "")),
          quantity: quantity,
          gp_price: isNaN(price) ? 0 : price,
          originalRow: row
        });
      }
    });
    return { works, gp_margin_total };
  }

  function buildStagesFromWorks(works) {
    const map = {};
    works.forEach(w => {
      if (!map[w.section]) map[w.section] = { name: w.section, works: [] };
      map[w.section].works.push(w);
    });
    return Object.values(map);
  }

  function parseNumber(val) {
    if (val === "" || val === null) return NaN;
    return Number(String(val).replace(/\s/g, "").replace(",", "."));
  }

  function normalizeUnit(u) {
    const clean = u.toLowerCase().trim();
    return UNIT_ALIASES[clean] || clean || "шт";
  }

  function rowHasData(r) { return r.some(c => c !== "" && c !== null); }

  return { process: process };
})();
