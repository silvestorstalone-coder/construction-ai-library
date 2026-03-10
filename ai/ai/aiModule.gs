// ai_module.gs
/**
 * =====================================================
 * AI MODULE v3.1 — YANDEX GPT FIX
 * FOLDER_ID ЖЁСТКО ПРОПИСАНА И ПРАВИЛЬНА
 * =====================================================
 */

var aiModule = (function() {

 // =====================================================
 // КОНФИГУРАЦИЯ
 // =====================================================
 
 // 🔑 FOLDER_ID ЖЁСТКО ПРОПИСАНА ЗДЕСЬ
 var FOLDER_ID = "b1gen3tc156h87n7p4cs";

 
 var CONFIG = {
 FOLDER_ID:FOLDER_ID,// Жёсткая переменная
 DEFAULT_MODEL:"yandexgpt-lite",
 ENDPOINT:"https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
 DEFAULT_TEMPERATURE:0.3,
 DEFAULT_MAX_TOKENS:500
 };

 var STATS = {
 apiCallsTotal:0,
 apiCallsSuccess:0,
 apiCallsError:0,
 aiCallsUsed:0
 };

 // =====================================================
 // MAIN — classifyRow
 // =====================================================

 function classifyRow(text) {
 
 if (!text || String(text).trim() === "") {
 logWarning("Empty input text");
 return null;
 }

 // Получение API ключа
 var apiKey = null;
 try {
 apiKey = PropertiesService.getScriptProperties().getProperty("YANDEX_API_KEY");
 } catch (e) {
 logError("Failed to get YANDEX_API_KEY:" + e.message);
 return null;
 }

 if (!apiKey || apiKey.trim() === "") {
 logWarning("YANDEX_API_KEY not configured in Script Properties");
 return null;
 }

 // Получение модели
 var model = "yandexgpt-lite";
 try {
 var modelFromProps = PropertiesService.getScriptProperties().getProperty("YANDEX_MODEL");
 if (modelFromProps && modelFromProps.trim() !== "") {
 model = modelFromProps;
 }
 } catch (e) {
 // Используем default
 }

 logInfo(`Classifying text:"${text.substring(0,60)}..."|Model:${model}`);

 try {
 var response = callYandexGPT(text,apiKey,model);
 STATS.apiCallsTotal++;

 if (!response) {
 STATS.apiCallsError++;
 return null;
 }

 STATS.apiCallsSuccess++;
 STATS.aiCallsUsed++;

 var parsed = parseAIResponse(response);
 if (!parsed) {
 STATS.apiCallsError++;
 return null;
 }

 logInfo(`Successfully classified. Norm:${parsed.normHoursPerUnit} чел-ч/ед`);

 return {
 stage:parsed.stage || null,
 normHoursPerUnit:parsed.normHoursPerUnit || 0,
 rawResponse:response,
 source:"ai_fallback"
 };

 } catch (e) {
 STATS.apiCallsError++;
 logError(`Exception:${e.message}`);
 return null;
 }
 }

 // =====================================================
 // YANDEX GPT API CALL
 // =====================================================

 function callYandexGPT(text,apiKey,model) {
 
 // 🔑 КРИТИЧНЫЙ МОМЕНТ — Формирование modelUri
 var modelUri = "gpt://" + CONFIG.FOLDER_ID + "/" + model;
 
 logInfo(`FOLDER_ID:${CONFIG.FOLDER_ID}`);
 logInfo(`Model:${model}`);
 logInfo(`✅ ModelUri:${modelUri}`);

 // Получение параметров
 var temperature = _getPropertyAsFloat("YANDEX_TEMPERATURE",CONFIG.DEFAULT_TEMPERATURE);
 var maxTokens = _getPropertyAsInt("YANDEX_MAX_TOKENS",CONFIG.DEFAULT_MAX_TOKENS);

 logInfo(`Temperature:${temperature},MaxTokens:${maxTokens}`);

 // Формирование payload
 var payload = {
 modelUri:modelUri,// ← ЭТО САМОЕ ВАЖНОЕ!
 completionOptions:{
 stream:false,
 temperature:temperature,
 maxTokens:maxTokens
 },
 messages:[
 {
 role:"system",
 text:"Ты эксперт по классификации строительных работ. Отвечай ТОЛЬКО в формате:Этап:<название>,НормаЧасов:<число>. Число должно быть положительным (чел-часы на единицу). Если не уверен,верни НормаЧасов:0."
 },
 {
 role:"user",
 text:"Классифицируй строительную работу:\n" + text
 }
 ]
 };

 logDebug("Payload:" + JSON.stringify(payload));

 // HTTP запрос
 var options = {
 method:"post",
 contentType:"application/json",
 headers:{
 "Authorization":"Api-Key " + apiKey,
 "User-Agent":"Subpodryad-AI/3.1"
 },
 payload:JSON.stringify(payload),
 muteHttpExceptions:true
 };

 logInfo(`Sending request to ${CONFIG.ENDPOINT}`);

 var response = null;
 try {
 response = UrlFetchApp.fetch(CONFIG.ENDPOINT,options);
 } catch (e) {
 logError(`UrlFetchApp.fetch() failed:${e.message}`);
 return null;
 }

 if (!response) {
 logError("No response received");
 return null;
 }

 var httpCode = response.getResponseCode();
 logInfo(`HTTP Code:${httpCode}`);

 if (httpCode !== 200) {
 var errorBody = response.getContentText();
 logError(`HTTP ${httpCode} Error:${errorBody}`);
 
 try {
 var errorJson = JSON.parse(errorBody);
 if (errorJson.error && errorJson.error.message) {
 logError(`Error message:${errorJson.error.message}`);
 }
 } catch (e) {
 // Не JSON
 }
 
 return null;
 }

 var responseText = response.getContentText();
 
 if (!responseText || responseText.trim() === "") {
 logError("Empty response body");
 return null;
 }

 logDebug(`Response length:${responseText.length}`);

 return responseText;
 }

 // =====================================================
 // PARSE RESPONSE
 // =====================================================

 function parseAIResponse(responseText) {
 
 try {
 var json = JSON.parse(responseText);
 
 if (!json || !json.result) {
 logWarning("No 'result' in response");
 return null;
 }

 var result = json.result;
 
 if (!result.alternatives || result.alternatives.length === 0) {
 logWarning("No 'alternatives' in result");
 return null;
 }

 var aiText = result.alternatives[0].message.text;
 
 logDebug(`AI text:"${aiText}"`);

 // Парсинг ответа
 var stageMatch = aiText.match(/Этап:\s*(.+?),/i);
 var normMatch = aiText.match(/НормаЧасов:\s*([0-9]+[.]?[0-9]*)/i);

 var stage = stageMatch ? stageMatch[1].trim() :null;
 var rawNorm = normMatch ? parseFloat(normMatch[1]) :NaN;

 var normHoursPerUnit = _validateNorm(rawNorm);

 if (normHoursPerUnit === null) {
 logWarning(`Norm validation failed. Raw:${rawNorm}`);
 return null;
 }

 logInfo(`Parsed:Stage:"${stage}",Norm:${normHoursPerUnit}`);

 return {
 stage:stage,
 normHoursPerUnit:normHoursPerUnit
 };

 } catch (e) {
 logError(`JSON parse error:${e.message}`);
 return null;
 }
 }

 // =====================================================
 // VALIDATION
 // =====================================================

 function _validateNorm(value) {
 if (value === null || value === undefined) return null;
 if (typeof value !== "number") return null;
 if (isNaN(value)) return null;
 if (!isFinite(value)) return null;
 if (value <= 0) return null;
 if (value > 100) {
 logWarning(`Norm too high:${value}`);
 return null;
 }
 return value;
 }

 function _getPropertyAsFloat(key,defaultValue) {
 try {
 var val = PropertiesService.getScriptProperties().getProperty(key);
 return val ? parseFloat(val) :defaultValue;
 } catch (e) {
 return defaultValue;
 }
 }

 function _getPropertyAsInt(key,defaultValue) {
 try {
 var val = PropertiesService.getScriptProperties().getProperty(key);
 return val ? parseInt(val,10) :defaultValue;
 } catch (e) {
 return defaultValue;
 }
 }

 // =====================================================
 // STATISTICS
 // =====================================================

 function getStats() {
 return {
 apiCallsTotal:STATS.apiCallsTotal,
 apiCallsSuccess:STATS.apiCallsSuccess,
 apiCallsError:STATS.apiCallsError,
 aiCallsUsed:STATS.aiCallsUsed,
 successRate:STATS.apiCallsTotal > 0 ? 
 Math.round((STATS.apiCallsSuccess / STATS.apiCallsTotal) * 100) :0
 };
 }

 function resetStats() {
 STATS.apiCallsTotal = 0;
 STATS.apiCallsSuccess = 0;
 STATS.apiCallsError = 0;
 STATS.aiCallsUsed = 0;
 logInfo("Statistics reset");
 }

 // =====================================================
 // LOGGING
 // =====================================================

 function logInfo(msg) {
 if (typeof Logger !== "undefined") Logger.log("[AI] " + msg);
 else console.log("[AI] " + msg);
 }

 function logWarning(msg) {
 if (typeof Logger !== "undefined") Logger.log("[AI_WARN] " + msg);
 else console.warn("[AI_WARN] " + msg);
 }

 function logError(msg) {
 if (typeof Logger !== "undefined") Logger.log("[AI_ERROR] " + msg);
 else console.error("[AI_ERROR] " + msg);
 }

 function logDebug(msg) {
 // Раскомментируйте для подробного дебага
 // if (typeof Logger !== "undefined") Logger.log("[AI_DEBUG] " + msg);
 }

 // =====================================================
 // PUBLIC API
 // =====================================================

 return {
 classifyRow:classifyRow,
 getStats:getStats,
 resetStats:resetStats
 };

})();
