# MODULE_INDEX.md
Последнее обновление: 3/12/2026, 9:43:30 PM
> Этот файл является ЭТАЛОНОМ связей для ИИ.

## 📦 accounting.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 aiModule.gs
- **Функции**: classifyRow, callYandexGPT, parseAIResponse, _validateNorm, _getPropertyAsFloat, _getPropertyAsInt, getStats, resetStats, logInfo, logWarning, logError, logDebug
- **Зависимости (связи)**: автономен

## 📦 audit.gs
- **Функции**: createAudit, _formatAuditSheet, _addStatistics, getAuditSummary, logInfo, logWarning
- **Зависимости (связи)**: Estimate ➔ Technology

## 📦 commerce.gs
- **Функции**: process
- **Зависимости (связи)**: Finance

## 📦 config.gs
- **Функции**: get, set
- **Зависимости (связи)**: автономен

## 📦 diagnostics.gs
- **Функции**: initLogger, log, logInfo, logWarning, logError
- **Зависимости (связи)**: автономен

## 📦 estimate.gs
- **Функции**: process, detectHeaderRow, detectColumns, parseRows, buildStagesFromWorks, parseNumber, normalizeUnit, getUnitStats, rowHasData, log
- **Зависимости (связи)**: автономен

## 📦 finance.gs
- **Функции**: process
- **Зависимости (связи)**: Estimate ➔ Technology ➔ Schedule

## 📦 main.gs
- **Функции**: runSubpodryadAI, _verifyModulesLoaded, _renderResults, logInfo, logWarning, logError
- **Зависимости (связи)**: Estimate ➔ Technology ➔ Finance ➔ Schedule ➔ Materials ➔ Commerce ➔ AuditModule

## 📦 menu.gs
- **Функции**: onOpen, menuEstimate, menuMyEstimate, menuTechnology, menuSchedule, menuWorkers, menuEquipment, menuMaterialsConsumption, menuMaterialsRequest, menuFinance, menuCommerce, menuKS2, menuInvoice, menuAct
- **Зависимости (связи)**: автономен

## 📦 norms.gs
- **Функции**: normalizeWorkName, getNorm, addNorm, _cloneNorm, logInfo
- **Зависимости (связи)**: автономен

## 📦 profit.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 schedule.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 technology.gs
- **Функции**: process, getTechnologyForWork, isValidNorm, logInfo, logWarning, logError
- **Зависимости (связи)**: автономен

## 📦 test.gs
- **Функции**: testAuditDiagnostics, simpleTestAudit, showAllSheets, testYandexGPTFixed
- **Зависимости (связи)**: Estimate ➔ Technology ➔ AuditModule

## 📦 utils.gs
- **Функции**: loadDataFromSheetRaw, convert2DArrayToObjects, normalizeColumnNames, normalizeUnits, normalizeSheetValues
- **Зависимости (связи)**: автономен
