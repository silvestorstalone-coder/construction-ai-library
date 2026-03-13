/*
 * =====================================================
 * ESTIMATE MODULE v9.1 (Industrial - Fixed)
 * Сохранена вся оригинальная логика.
 * Добавлен адаптивный поиск шапки для "Сложных смет".
 * =====================================================
 */

var Estimate = (function () {

  var FINANCIAL_KEYWORDS = [
    "фот","фзп","зп","оплата","фонд оплаты",
    "наклад","нр","накл","нормативные расходы",
    "прибыл","сметная","цена","всего","итого",
    "стоимость","сумма","основная зарплата"
  ];

  var UNIT_ALIASES = {
    "м3":"м3","куб.м":"м3","м³":"м3",
    "м2":"м2","кв.м":"м2","м²":"м2",
    "м.п.":"м.п.","пог.м":"м.п.","погонный метр":"м.п.",
    "т":"т","тонна":"т","тн":"т",
    "кг":"кг","килограмм":"кг",
    "шт":"шт","штука":"шт","штук":"шт",
    "точка":"шт","комплект":"шт","комп":"шт",
    "л":"л","литр":"л",
    "м":"м.п."
  };

  function process(sheet, options) {
    if (!sheet) throw new Error("Estimate.process: sheet не передан");
    options = options || {};
    logInfo("[Estimate v9.1] START");

    const raw = sheet.getDataRange().getValues();
    if (!raw || raw.length === 0) throw new Error("Estimate: пустой лист");

    // --- ИЗМЕНЕНО: Адаптивный поиск вместо жесткого i < 50 ---
    const headerIndex = detectHeaderRow(raw);
    const body = raw.slice(headerIndex + 1).filter(rowHasData);

    if (body.length === 0) throw new Error("Estimate: после заголовка нет данных");

    const columnMap = detectColumns(body);

    logInfo("[Estimate v9.1] Header row: " + (headerIndex + 1));
    logInfo("[Estimate v9.1] Data rows: " + body.length);
    logInfo("[Estimate v9.1] Column map: " + JSON.stringify(columnMap));

    const parsed = parseRows(body, headerIndex, columnMap);
    const stages = buildStagesFromWorks(parsed.works);

    if (parsed.works.length === 0) {
      throw new Error("Estimate CRITICAL: не найдено ни одной работы. Проверьте колонку Количество!");
    }

    const coveragePercent = Math.round((parsed.works.length / body.length) * 100);

    return {
      type: "complex",
      stages: stages,
      totalWorksList: parsed.works,
      totalWorks: parsed.works.length,
      worksFlat: parsed.works,
      financialRows: parsed.financialRows,
      unclassifiedRows: parsed.unclassifiedRows,
      diagnostics: {
        totalDataRows: body.length,
        worksCount: parsed.works.length,
        financialRowsCount: parsed.financialRows.length,
        unclassifiedCount: parsed.unclassifiedRows.length,
        coveragePercent: coveragePercent,
        unitDistribution: getUnitStats(parsed.works)
      },
      metadata: {
        headerRowIndex: headerIndex,
        worksCount: parsed.works.length,
        financialRowsCount: parsed.financialRows.length,
        unclassifiedRowsCount: parsed.unclassifiedRows.length
      }
    };
  }

  // --- ИСПРАВЛЕНО: Теперь ищет "Наименование" по всей строке ---
  function detectHeaderRow(values) {
    const anchors = ["наименование", "ед.изм", "количество", "кол-во", "обоснование"];
    for (let i = 0; i < Math.min(values.length, 100); i++) {
      const rowStr = values[i].join("|").toLowerCase();
      // Если нашли ключевые слова — это шапка, на какой бы строке она ни была
      if (anchors.filter(a => rowStr.includes(a)).length >= 2) {
        logInfo("[Estimate] Header detected at row " + (i + 1));
        return i;
      }
    }
    // Если ничего не нашли, применяем твою оригинальную логику (стат. метод)
    for (let i = 0; i < Math.min(values.length, 50); i++) {
      const row = values[i];
      let nonEmpty = 0;
      let textCells = 0;
      row.forEach(cell => {
        if (cell !== "" && cell !== null) {
          nonEmpty++;
          if (isNaN(parseNumber(cell))) textCells++;
        }
      });
      if (nonEmpty >= 4 && textCells >= 3) return i;
    }
    return 0;
  }

  // --- ДАЛЕЕ ВЕСЬ КОД ОСТАВЛЕН БЕЗ ИЗМЕНЕНИЙ (ТВОЙ ОРИГИНАЛ) ---

  function detectColumns(rows) {
    if (!rows || rows.length === 0) return { name:0, quantity:null, price:null, unit:null };
    const sampleSize = Math.min(rows.length, 50);
    const colCount = rows[0].length;
    const stats = [];
    for (let c = 0; c < colCount; c++) {
      let numericCount = 0; let textLongCount = 0; let shortTextCount = 0;
      const shortTextUniqueValues = new Set();
      let numericSum = 0;
      for (let r = 0; r < sampleSize; r++) {
        const val = rows[r][c];
        if (val === "" || val === null) continue;
        const num = parseNumber(val);
        if (!isNaN(num) && num !== 0) { numericCount++; numericSum += num; }
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
    let bestUnitCol = null; let minRatio = Infinity; let maxShort = -1;
    stats.forEach(s => {
      if (s.index === nameCol || s.index === quantityCol || s.index === priceCol) return;
      if (s.shortTextCount > 5) {
        if (s.shortTextUniqueRatio < minRatio || (s.shortTextUniqueRatio === minRatio && s.shortTextCount > maxShort)) {
          minRatio = s.shortTextUniqueRatio; maxShort = s.shortTextCount; bestUnitCol = s.index;
        }
      }
    });
    return { name: nameCol, quantity: quantityCol, price: priceCol, unit: bestUnitCol };
  }

  function parseRows(body, headerRowIndex, columnMap) {
    const works = []; const financialRows = []; const unclassifiedRows = [];
    let currentSection = "Общий этап"; let currentSubsection = "Без подраздела";
    body.forEach((row, i) => {
      const rawRowIndex = headerRowIndex + 1 + i;
      const name = String(row[columnMap.name] || "").trim();
      if (!name) { unclassifiedRows.push({ rawRowIndex, type:"empty_name_cell", originalRow:row }); return; }
      const lower = name.toLowerCase();
      const quantity = columnMap.quantity !== null ? parseNumber(row[columnMap.quantity]) : NaN;
      const price = columnMap.price !== null ? parseNumber(row[columnMap.price]) : NaN;
      if (FINANCIAL_KEYWORDS.some(kw => lower.includes(kw))) {
        financialRows.push({ rawRowIndex, name, value:isNaN(price)?0:price, originalRow:row }); return;
      }
      if (lower.startsWith("раздел") || lower.startsWith("глава")) {
        currentSection = name; currentSubsection = "Без подраздела"; return;
      }
      if (!isNaN(quantity) && quantity > 0) {
        const rawUnit = columnMap.unit !== null ? String(row[columnMap.unit] || "").trim() : "";
        const normalizedUnit = normalizeUnit(rawUnit);
        const normalizedName = (typeof Norms !== "undefined" && Norms.normalizeWorkName) ? Norms.normalizeWorkName(name) : name.toLowerCase();
        works.push({ rawRowIndex, section:currentSection, subsection:currentSubsection, name, normalizedName, unit:normalizedUnit, quantity, price:isNaN(price)?0:price, originalRow:row, confidence:"from_estimate" });
        return;
      }
      unclassifiedRows.push({ rawRowIndex, type:"unclassified", name, originalRow:row });
    });
    return { works, financialRows, unclassifiedRows };
  }

  function buildStagesFromWorks(works) {
    const map = {};
    works.forEach(w => {
      const stage = w.section || "Общий этап"; const sub = w.subsection || "Без подраздела";
      if (!map[stage]) map[stage] = { name:stage, subsections:{} };
      if (!map[stage].subsections[sub]) map[stage].subsections[sub] = { name:sub, works:[] };
      map[stage].subsections[sub].works.push(w);
    });
    return Object.values(map).map(s => ({ name:s.name, subsections:Object.values(s.subsections) }));
  }

  function parseNumber(val) {
    if (