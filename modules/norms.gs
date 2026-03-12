// norms.gs
/**
 * =====================================================
 * NORMS.gs v2.1 — РАБОЧАЯ ВЕРСИЯ
 * Словарь норм трудозатрат
 * =====================================================
 */

var Norms = (function() {

 // Базовый словарь норм
 var normsDB = {
 "разработка грунта":{ unit:"m3",laborHoursPerUnit:0.8,machinery:"Экскаватор" },
 "уплотнение грунта":{ unit:"m3",laborHoursPerUnit:0.5,machinery:"Каток" },
 "планировка грунта":{ unit:"m2",laborHoursPerUnit:0.6,machinery:"Бульдозер" },
 "обратная засыпка":{ unit:"m3",laborHoursPerUnit:0.4,machinery:"Экскаватор" },
 "устройство щебеночного основания":{ unit:"m2",laborHoursPerUnit:0.25,machinery:"Виброплита" },
 "устройство песчаного основания":{ unit:"m2",laborHoursPerUnit:0.2,machinery:"Виброплита" },
 "укладка тротуарной плитки":{ unit:"m2",laborHoursPerUnit:0.6,machinery:"Виброплита" },
 "монтаж трубы":{ unit:"м.п.",laborHoursPerUnit:2.5,machinery:null },
 "монтаж трубопровода":{ unit:"м.п.",laborHoursPerUnit:2.5,machinery:null },
 "укладка трубопровода":{ unit:"м.п.",laborHoursPerUnit:2.5,machinery:null },
 "устройство бетонной подготовки":{ unit:"m3",laborHoursPerUnit:1.0,machinery:"Бетононасос" },
 "бетонирование":{ unit:"m3",laborHoursPerUnit:1.2,machinery:"Бетононасос" },
 "укладка бетона":{ unit:"m3",laborHoursPerUnit:1.2,machinery:"Бетононасос" },
 "армирование":{ unit:"т",laborHoursPerUnit:8.0,machinery:null },
 "монтаж арматуры":{ unit:"т",laborHoursPerUnit:8.0,machinery:null },
 "устройство опалубки":{ unit:"m2",laborHoursPerUnit:0.8,machinery:null },
 "монтаж опалубки":{ unit:"m2",laborHoursPerUnit:0.8,machinery:null },
 "гидроизоляция":{ unit:"m2",laborHoursPerUnit:0.3,machinery:null },
 "устройство гидроизоляции":{ unit:"m2",laborHoursPerUnit:0.3,machinery:null },
 "теплоизоляция":{ unit:"m2",laborHoursPerUnit:0.35,machinery:null },
 "устройство теплоизоляции":{ unit:"m2",laborHoursPerUnit:0.35,machinery:null },
 "кладка кирпичная":{ unit:"m3",laborHoursPerUnit:3.5,machinery:null },
 "кладка из блоков":{ unit:"m3",laborHoursPerUnit:2.0,machinery:null },
 "монтаж металлоконструкций":{ unit:"т",laborHoursPerUnit:6.0,machinery:"Кран" },
 "монтаж железобетонных конструкций":{ unit:"шт",laborHoursPerUnit:4.0,machinery:"Кран" },
 "монтаж плит перекрытия":{ unit:"шт",laborHoursPerUnit:1.5,machinery:"Кран" },
 "штукатурка":{ unit:"m2",laborHoursPerUnit:0.4,machinery:null },
 "штукатурные работы":{ unit:"m2",laborHoursPerUnit:0.4,machinery:null },
 "шпатлевка":{ unit:"m2",laborHoursPerUnit:0.2,machinery:null },
 "окраска":{ unit:"m2",laborHoursPerUnit:0.15,machinery:null },
 "малярные работы":{ unit:"m2",laborHoursPerUnit:0.15,machinery:null },
 "облицовка плиткой":{ unit:"m2",laborHoursPerUnit:0.7,machinery:null },
 "устройство полов":{ unit:"m2",laborHoursPerUnit:0.5,machinery:null },
 "устройство стяжки":{ unit:"m2",laborHoursPerUnit:0.3,machinery:null },
 "устройство наливного пола":{ unit:"m2",laborHoursPerUnit:0.25,machinery:null },
 "монтаж подвесного потолка":{ unit:"m2",laborHoursPerUnit:0.4,machinery:null },
 "устройство кровли":{ unit:"m2",laborHoursPerUnit:0.5,machinery:null },
 "кровельные работы":{ unit:"m2",laborHoursPerUnit:0.5,machinery:null },
 "монтаж водостока":{ unit:"м.п.",laborHoursPerUnit:0.6,machinery:null },
 "монтаж окон":{ unit:"шт",laborHoursPerUnit:2.0,machinery:null },
 "установка дверей":{ unit:"шт",laborHoursPerUnit:2.5,machinery:null },
 "монтаж вентиляции":{ unit:"м.п.",laborHoursPerUnit:1.5,machinery:null },
 "прокладка кабеля":{ unit:"м.п.",laborHoursPerUnit:0.3,machinery:null },
 "электромонтажные работы":{ unit:"точка",laborHoursPerUnit:1.0,machinery:null },
 "монтаж светильников":{ unit:"шт",laborHoursPerUnit:0.5,machinery:null },
 "сантехнические работы":{ unit:"точка",laborHoursPerUnit:2.0,machinery:null },
 "монтаж радиаторов":{ unit:"шт",laborHoursPerUnit:1.5,machinery:null },
 "демонтаж":{ unit:"m3",laborHoursPerUnit:0.6,machinery:null },
 "демонтажные работы":{ unit:"m3",laborHoursPerUnit:0.6,machinery:null },
 "разборка":{ unit:"m3",laborHoursPerUnit:0.6,machinery:null },
 "вывоз грунта":{ unit:"m3",laborHoursPerUnit:0.1,machinery:"Самосвал" },
 "перевозка грузов":{ unit:"т",laborHoursPerUnit:0.15,machinery:"Самосвал" },
 "перевозка грунта":{ unit:"m3",laborHoursPerUnit:0.1,machinery:"Самосвал" },
 "транспортировка":{ unit:"т",laborHoursPerUnit:0.15,machinery:"Самосвал" },
 "погрузка":{ unit:"m3",laborHoursPerUnit:0.1,machinery:"Экскаватор" },
 "разгрузка":{ unit:"m3",laborHoursPerUnit:0.1,machinery:null },
 "устройство ограждения":{ unit:"м.п.",laborHoursPerUnit:0.5,machinery:null },
 "установка забора":{ unit:"м.п.",laborHoursPerUnit:0.5,machinery:null },
 "монтаж лесов":{ unit:"m2",laborHoursPerUnit:0.3,machinery:null },
 "устройство дренажа":{ unit:"м.п.",laborHoursPerUnit:1.0,machinery:"Экскаватор" },
 "укрепление откосов":{ unit:"m2",laborHoursPerUnit:0.4,machinery:null },
 "устройство отмостки":{ unit:"m2",laborHoursPerUnit:0.5,machinery:null },
 "асфальтирование":{ unit:"m2",laborHoursPerUnit:0.15,machinery:"Асфальтоукладчик" },
 "укладка асфальтобетона":{ unit:"m2",laborHoursPerUnit:0.15,machinery:"Асфальтоукладчик" },
 "устройство бордюра":{ unit:"м.п.",laborHoursPerUnit:0.4,machinery:null },
 "установка бордюрного камня":{ unit:"м.п.",laborHoursPerUnit:0.4,machinery:null },
 "благоустройство":{ unit:"m2",laborHoursPerUnit:0.3,machinery:null },
 "озеленение":{ unit:"m2",laborHoursPerUnit:0.2,machinery:null },
 "посев газона":{ unit:"m2",laborHoursPerUnit:0.05,machinery:null },
 "посадка деревьев":{ unit:"шт",laborHoursPerUnit:1.0,machinery:null },
 "сварочные работы":{ unit:"м.п.",laborHoursPerUnit:1.5,machinery:null },
 "сварка":{ unit:"м.п.",laborHoursPerUnit:1.5,machinery:null },
 "огнезащита":{ unit:"m2",laborHoursPerUnit:0.2,machinery:null },
 "антикоррозийная обработка":{ unit:"m2",laborHoursPerUnit:0.15,machinery:null },
 "монтаж пожарной сигнализации":{ unit:"точка",laborHoursPerUnit:1.2,machinery:null },
 "монтаж видеонаблюдения":{ unit:"точка",laborHoursPerUnit:1.5,machinery:null },
 "бурение скважин":{ unit:"м.п.",laborHoursPerUnit:2.0,machinery:"Буровая установка" },
 "забивка свай":{ unit:"шт",laborHoursPerUnit:1.5,machinery:"Копер" },
 "устройство свайного поля":{ unit:"шт",laborHoursPerUnit:1.5,machinery:"Копер" },
 "монтаж ростверка":{ unit:"m3",laborHoursPerUnit:1.5,machinery:"Кран" }
 };

 /**
 * Нормализует название работы
 */
 function normalizeWorkName(name) {
 if (!name) return "";
 
 var s = String(name);
 s = s.toLowerCase();
 s = s.replace(/ё/g,"е");
 s = s.replace(/\b[ivxlcdm]+\s*(класс[а-я]*|категори[а-я]*|разряд[а-я]*|групп[а-я]*|тип[а-я]*)\b/gi,"");
 s = s.replace(/\b\d+[\s-]*(класс[а-я]*|категори[а-я]*|разряд[а-я]*|групп[а-я]*|тип[а-я]*)\b/gi,"");
 s = s.replace(/\b(до|от|свыше|более|менее|не более|не менее)\s*\d+[.]?\d*\s*[а-яa-z²³]*\b/gi,"");
 s = s.replace(/\b(грузоподъемност[а-я]*|диаметр[а-я]*|толщин[а-я]*|длин[а-я]*|ширин[а-я]*|высот[а-я]*|глубин[а-я]*|объем[а-я]*|массой|весом)\s*\d+[.]?\d*\s*[а-яa-z²³]*/gi,"");
 s = s.replace(/\d+[.]?\d*/g,"");
 s = s.replace(/[^а-яёa-z\s\-]/gi,"");
 s = s.replace(/\b[а-яa-z]\b/gi,"");
 s = s.replace(/[\s\-]+/g," ");
 s = s.trim();
 
 return s;
 }

 /**
 * Получает норму для работы (4-слойный поиск)
 */
 function getNorm(workType) {
 if (!workType || String(workType).trim() === "") return null;

 var inputNormalized = normalizeWorkName(workType);
 if (!inputNormalized) return null;

 var keys = Object.keys(normsDB);
 var normalizedKeys = [];
 
 for (var i = 0; i < keys.length; i++) {
 normalizedKeys.push({
 original:keys[i],
 normalized:normalizeWorkName(keys[i]),
 norm:normsDB[keys[i]]
 });
 }

 // СЛОЙ 1:Точное совпадение
 for (var i = 0; i < normalizedKeys.length; i++) {
 if (inputNormalized === normalizedKeys[i].normalized) {
 return _cloneNorm(normalizedKeys[i].norm);
 }
 }

 // СЛОЙ 2:includes
 var sortedByLength = normalizedKeys.slice().sort(function (a,b) {
 return b.normalized.length - a.normalized.length;
 });

 for (var i = 0; i < sortedByLength.length; i++) {
 var nk = sortedByLength[i].normalized;
 if (nk.length >= 3 && inputNormalized.indexOf(nk) !== -1) {
 return _cloneNorm(sortedByLength[i].norm);
 }
 }

 // СЛОЙ 3:regex
 for (var i = 0; i < normalizedKeys.length; i++) {
 var keyWords = normalizedKeys[i].normalized.split(/\s+/).filter(function (w) { return w.length >= 3; });
 if (keyWords.length === 0) continue;

 var allFound = true;
 for (var j = 0; j < keyWords.length; j++) {
 var escaped = keyWords[j].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 var re = new RegExp(escaped,"i");
 if (!re.test(inputNormalized)) {
 allFound = false;
 break;
 }
 }
 if (allFound) {
 return _cloneNorm(normalizedKeys[i].norm);
 }
 }

 // СЛОЙ 4:scoring
 var inputWords = inputNormalized.split(/\s+/).filter(function (w) { return w.length >= 3; });
 if (inputWords.length === 0) return null;

 var bestScore = 0;
 var bestMatch = null;
 var SCORE_THRESHOLD = 0.4;

 for (var i = 0; i < normalizedKeys.length; i++) {
 var keyWords = normalizedKeys[i].normalized.split(/\s+/).filter(function (w) { return w.length >= 3; });
 if (keyWords.length === 0) continue;

 var intersection = 0;
 for (var j = 0; j < keyWords.length; j++) {
 for (var k = 0; k < inputWords.length; k++) {
 if (inputWords[k].indexOf(keyWords[j]) !== -1 || keyWords[j].indexOf(inputWords[k]) !== -1) {
 intersection++;
 break;
 }
 }
 }

 var unionSize = Math.max(keyWords.length,inputWords.length);
 var score = intersection / unionSize;

 if (score > bestScore) {
 bestScore = score;
 bestMatch = normalizedKeys[i];
 }
 }

 if (bestMatch && bestScore >= SCORE_THRESHOLD) {
 return _cloneNorm(bestMatch.norm);
 }

 return null;
 }

 /**
 * Добавляет новую норму
 */
 function addNorm(workType,data) {
 if (!workType || !data) return;
 normsDB[workType] = data;
 }

 /**
 * Вспомогательные функции
 */
 function _cloneNorm(norm) {
 return {
 unit:norm.unit,
 laborHoursPerUnit:norm.laborHoursPerUnit,
 machinery:norm.machinery || null
 };
 }

 function logInfo(msg) {
 if (typeof Logger !== "undefined") Logger.log("[NORMS] " + msg);
 else console.log("[NORMS] " + msg);
 }

 // PUBLIC API
 return {
 getNorm:getNorm,
 addNorm:addNorm,
 normalizeWorkName:normalizeWorkName
 };

})();
