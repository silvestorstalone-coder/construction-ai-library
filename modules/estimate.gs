/*
=====================================================
ESTIMATE MODULE v12 INDUSTRIAL STABLE
v9.1 + v10 + AI CLASSIFIER + SMART UNIT + v5.6-Units
=====================================================
*/

var Estimate = (function () {

var FINANCIAL_KEYWORDS = [
"фот","фзп","зп","оплата","фонд оплаты",
"наклад","нр","накл","нормативные расходы",
"прибыл","сметная","цена","всего","итого",
"стоимость","сумма","основная зарплата"
];

var GP_MARGIN_KEYWORDS = [
"сметная прибыль","нр","сп","накладные",
"ндс","лимитированные"
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

/*
=====================================================
WORK CLASSIFIER
=====================================================
*/

var WORK_CLASSIFIER = {

earth:[
"грунт","котлован","транше","разработка"
],

concrete:[
"бетон","армирование","опалубк"
],

road:[
"асфальт","щебень","дорожн"
],

electric:[
"кабель","щит","провод","освещен"
],

finishing:[
"штукатур","окраск","шпаклевк","облицовк"
]

};

function classifyWork(name){

var lower = name.toLowerCase();

for (var type in WORK_CLASSIFIER){

var patterns = WORK_CLASSIFIER[type];

for (var i=0;i<patterns.length;i++){

if (lower.indexOf(patterns[i]) !== -1)
return type;

}

}

return "other";

}

/*
=====================================================
SMART UNIT
=====================================================
*/

function detectUnitFallback(name){

var lower = name.toLowerCase();

if (lower.indexOf("кабель")!==-1) return "м.п.";
if (lower.indexOf("труба")!==-1) return "м.п.";

if (lower.indexOf("бетон")!==-1) return "м3";
if (lower.indexOf("грунт")!==-1) return "м3";

if (lower.indexOf("плитка")!==-1) return "м2";
if (lower.indexOf("штукатур")!==-1) return "м2";

return "шт";

}

/*
=====================================================
MAIN
=====================================================
*/

function process(sheet){

if (!sheet)
throw new Error("Estimate.process: sheet не передан");

var raw = sheet.getDataRange().getValues();

if (!raw || raw.length===0)
throw new Error("Estimate: пустой лист");

var headerIndex = detectHeaderRow(raw);

var body = raw.slice(headerIndex+1).filter(rowHasData);

if (body.length===0)
throw new Error("Estimate: после заголовка нет данных");

var columnMap = detectColumns(body);

var parsed = parseRows(body,headerIndex,columnMap);

var stages = buildStages(parsed.works);

// ФИКС: Формирование метаданных и диагностики для main.gs
return {

type:"complex",

stages:stages,

totalWorksList:parsed.works,
totalWorks:parsed.works.length,

worksFlat:parsed.works,

gp_margin_total:parsed.gp_margin_total,

financialRows:parsed.financialRows,
unclassifiedRows:parsed.unclassifiedRows,

metadata: {
  financialRowsCount: parsed.financialRows.length,
  unclassifiedRowsCount: parsed.unclassifiedRows.length
},

diagnostics: {
  coveragePercent: parsed.works.length > 0 ? ((parsed.works.length / (parsed.works.length + parsed.unclassifiedRows.length)) * 100).toFixed(1) : 0,
  unitDistribution: {}
}

};

}

/*
=====================================================
ROW PARSER
=====================================================
*/

function parseRows(body,headerRowIndex,columnMap){

var works=[];
var financialRows=[];
var unclassifiedRows=[];

var gp_margin_total=0;

var currentSection="Общий этап";
var currentSubsection="Без подраздела";

var lastValidName="";

body.forEach(function(row,i){

var rawRowIndex = headerRowIndex+1+i;

var name = String(row[columnMap.name]||"").trim();

var quantity=parseNumber(row[columnMap.quantity]);
var price=parseNumber(row[columnMap.price]);

if(name==="" && !isNaN(quantity) && quantity>0)
name=lastValidName;
else if(name!=="")
lastValidName=name;

if(!name){

unclassifiedRows.push({
rawRowIndex:rawRowIndex,
type:"empty_name_cell",
originalRow:row
});

return;

}

var lower=name.toLowerCase();

if(
FINANCIAL_KEYWORDS.some(function(k){return lower.indexOf(k)!==-1}) ||
GP_MARGIN_KEYWORDS.some(function(k){return lower.indexOf(k)!==-1})
){

if(!isNaN(price))
gp_margin_total+=price;

financialRows.push({
rawRowIndex:rawRowIndex,
name:name,
value:isNaN(price)?0:price
});

return;

}

if(lower.indexOf("раздел")===0 || lower.indexOf("глава")===0){

currentSection=name;
currentSubsection="Без подраздела";

return;

}

if(!isNaN(quantity) && quantity>0){

var rawUnit = String(row[columnMap.unit]||"");

// --- START: v5.6-Units MULTIPLIER LOGIC ---
var multiplierMatch = rawUnit.match(/(\d+)/);
if (multiplierMatch) {
    var mVal = parseInt(multiplierMatch[1]);
    if ([1, 10, 100, 1000].indexOf(mVal) !== -1) {
        quantity = quantity * mVal;
    }
}
// --- END: v5.6-Units MULTIPLIER LOGIC ---

var normalizedUnit = normalizeUnit(rawUnit);

if(!normalizedUnit)
normalizedUnit = detectUnitFallback(name);

var normalizedName =
(typeof Norms!=="undefined" && Norms.normalizeWorkName)
? Norms.normalizeWorkName(name)
: name.toLowerCase();

var codeMatch =
name.match(/[А-ЯA-Zа-яa-z]*\s?\d+-\d+-\d+-\d+/);

works.push({

rawRowIndex:rawRowIndex,

section:currentSection,
subsection:currentSubsection,

name:name,
normalizedName:normalizedName,

code:codeMatch ? codeMatch[0] : null,

unit:normalizedUnit,

quantity:quantity,

price:isNaN(price)?0:price,

workType:classifyWork(name),

confidence:"from_estimate"

});

return;

}

unclassifiedRows.push({

rawRowIndex:rawRowIndex,
type:"unclassified",
name:name

});

});

return{
works:works,
financialRows:financialRows,
unclassifiedRows:unclassifiedRows,
gp_margin_total:gp_margin_total
};

}

/*
=====================================================
STAGES
=====================================================
*/

function buildStages(works){

var map={};

works.forEach(function(w){

var stage=w.section || "Общий этап";
var sub=w.subsection || "Без подраздела";

if(!map[stage])
map[stage]={name:stage,subsections:{}};

if(!map[stage].subsections[sub])
map[stage].subsections[sub]={name:sub,works:[]};

map[stage].subsections[sub].works.push(w);

});

return Object.values(map).map(function(s){

return{

name:s.name,
subsections:Object.values(s.subsections)

};

});

}

/*
=====================================================
UTILS
=====================================================
*/

function parseNumber(val){

if(val===null || val==="")
return NaN;

var cleaned = String(val)
.replace(/\s/g,"")
.replace(/,/g,".");

var num = Number(cleaned);

return isNaN(num)?NaN:num;

}

function normalizeUnit(unit){

if(!unit) return "";

var u = String(unit).toLowerCase().trim();

return UNIT_ALIASES[u] || "";

}

/*
=====================================================
HEADER DETECTION
=====================================================
*/

function detectHeaderRow(values){

for(var i=0;i<Math.min(values.length,50);i++){

var row=values[i];

var nonEmpty=0;
var textCells=0;

row.forEach(function(cell){

if(cell!=="" && cell!==null){

nonEmpty++;

if(isNaN(parseNumber(cell)))
textCells++;

}

});

if(nonEmpty>=4 && textCells>=3)
return i;

}

return 0;

}

/*
=====================================================
COLUMN DETECTION (FULL v9 ALGORITHM)
=====================================================
*/

function detectColumns(rows){

if(!rows || rows.length===0)
return {name:0,quantity:null,price:null,unit:null};

var sampleSize = Math.min(rows.length,50);
var colCount = rows[0].length;

var stats=[];

for(var c=0;c<colCount;c++){

var numericCount=0;
var textLongCount=0;
var shortTextCount=0;

var shortTextUniqueValues=new Set();
var numericSum=0;

for(var r=0;r<sampleSize;r++){

var val=rows[r][c];

if(val===""||val===null) continue;

var num=parseNumber(val);

if(!isNaN(num) && num!==0){

numericCount++;
numericSum+=num;

}else{

var str=String(val).trim();

if(str.length>20) textLongCount++;

if(str.length>0 && str.length<=15){

shortTextCount++;
shortTextUniqueValues.add(str.toLowerCase());

}

}

}

stats.push({

index:c,
numericCount:numericCount,
textLongCount:textLongCount,
shortTextCount:shortTextCount,

shortTextUniqueRatio:
shortTextCount>0
? shortTextUniqueValues.size/shortTextCount
:0,

avgNumber:
numericCount>0
? numericSum/numericCount
:0

});

}

var nameCol =
stats.slice().sort(function(a,b){
return b.textLongCount-a.textLongCount;
})[0].index;

var numericCols =
stats.filter(function(s){return s.numericCount>5})
.sort(function(a,b){
return b.numericCount-a.numericCount;
});

var quantityCol = numericCols[0] ? numericCols[0].index : null;
var priceCol = numericCols[1] ? numericCols[1].index : null;

var bestUnitCol=null;
var minRatio=Infinity;
var maxShort=-1;

stats.forEach(function(s){

if(
s.index===nameCol ||
s.index===quantityCol ||
s.index===priceCol
) return;

if(s.shortTextCount>5){

if(
s.shortTextUniqueRatio<minRatio ||
(
s.shortTextUniqueRatio===minRatio &&
s.shortTextCount>maxShort
)
){

minRatio=s.shortTextUniqueRatio;
maxShort=s.shortTextCount;
bestUnitCol=s.index;

}

}

});

return{
name:nameCol,
quantity:quantityCol,
price:priceCol,
unit:bestUnitCol
};

}

function rowHasData(row){

var nonEmpty=0;

row.forEach(function(cell){

if(cell!=="" && cell!==null)
nonEmpty++;

});

return nonEmpty>=2;

}

return {process:process};

})();
