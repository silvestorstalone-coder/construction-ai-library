# MODULE_INDEX.md
Последнее обновление: 3/13/2026, 6:58:06 PM
> Этот файл является ЭТАЛОНОМ связей для ИИ.

## 📦 accounting.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 aiModule.gs
- **Функции**: classifyRow, callYandexGPT, parseAIResponse, _validateNorm, _getPropertyAsFloat, _getPropertyAsInt, getStats, resetStats, logInfo
- **Зависимости (связи)**: автономен

## 📦 audit.gs
- **Функции**: createAudit, _formatAuditSheet, _addStatistics, getAuditSummary
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
- **Функции**: process, detectHeaderRow, detectColumns, parseRows, buildStagesFromWorks, parseNumber
- **Зависимости (связи)**: автономен

## 📦 finance.gs
- **Функции**: нет
- **Зависимости (связи)**: Estimate ➔ Technology

## 📦 main.gs
- **Функции**: runSubpodryadAI, _verifyModulesLoaded, _renderResults
- **Зависимости (связи)**: Estimate ➔ Technology ➔ Finance ➔ Schedule ➔ Materials ➔ Commerce ➔ AuditModule

## 📦 menu.gs
- **Функции**: onOpen, triggerAiRunner, showTokenPrompt, analyzeProjectStructure, menuEstimate, menuMyEstimate, menuTechnology, menuSchedule, menuWorkers, menuEquipment, menuMaterialsConsumption, menuMaterialsRequest, menuFinance, menuCommerce, menuKS2, menuInvoice, menuAct, runSubpodryadAI
- **Зависимости (связи)**: автономен

## 📦 norms.gs
- **Функции**: normalizeWorkName
- **Зависимости (связи)**: автономен

## 📦 profit.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 schedule.gs
- **Функции**: process
- **Зависимости (связи)**: автономен

## 📦 technology.gs
- **Функции**: process, getTechnologyForWork, isValidNorm
- **Зависимости (связи)**: автономен

## 📦 test.gs
- **Функции**: testAuditDiagnostics, simpleTestAudit, showAllSheets, testYandexGPTFixed
- **Зависимости (связи)**: Estimate ➔ Technology ➔ AuditModule

## 📦 utils.gs
- **Функции**: loadDataFromSheetRaw, convert2DArrayToObjects, normalizeColumnNames, normalizeUnits, normalizeSheetValues
- **Зависимости (связи)**: автономен
