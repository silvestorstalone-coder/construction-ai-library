
# Subpodryad AI — Domain Model

## Overview
Domain Model описывает предметную область системы Subpodryad AI, ключевые сущности, их свойства и взаимосвязи. Это помогает понять структуру данных и потоки информации между модулями.

---

## Core Entities

### Project
Корневая сущность проекта строительства.

```javascript
{
  id: String,                    // Уникальный идентификатор проекта
  name: String,                   // Название проекта
  createdAt: Date,                // Дата создания
  updatedAt: Date,                // Дата последнего обновления
  sourceSheet: String,            // Исходный лист Google Sheets
  status: 'draft' | 'processing' | 'completed' | 'error',
  estimate: EstimateModel,        // Сметные данные
  technology: TechnologyModel,    // Технологические данные
  schedule: ScheduleModel,        // Данные графика работ
  finance: FinanceModel,          // Финансовые данные
  commerce: CommerceModel,        // Коммерческое предложение
  accounting: AccountingModel,    // Бухгалтерская информация
  audit: AuditModel               // Аудит и контроль качества
}


⸻

EstimateModel

Содержит структурированную смету проекта.

{
  type: 'simple' | 'complex',     // Тип сметы
  stages: [                        // Этапы работ
    {
      name: String,                // Название этапа
      subsections: [                // Подразделы
        {
          name: String,             // Название подраздела
          works: [WorkItem]         // Список работ
        }
      ]
    }
  ],
  worksFlat: [WorkItem],           // Плоский список всех работ
  financialRows: [                  // Финансовые строки (итоги, ФОТ)
    {
      rawRowIndex: Number,
      name: String,
      value: Number
    }
  ],
  unclassifiedRows: [               // Нераспознанные строки
    {
      rawRowIndex: Number,
      type: String,
      name: String
    }
  ],
  diagnostics: {                    // Диагностика
    totalDataRows: Number,
    worksCount: Number,
    financialRowsCount: Number,
    unclassifiedCount: Number,
    coveragePercent: Number,
    unitDistribution: Object
  },
  metadata: {
    headerRowIndex: Number,
    worksCount: Number,
    financialRowsCount: Number,
    unclassifiedRowsCount: Number
  }
}


⸻

WorkItem

Элемент сметы — отдельная работа.

{
  rawRowIndex: Number,             // Исходный номер строки
  section: String,                 // Этап проекта
  subsection: String,              // Подраздел
  name: String,                    // Оригинальное название
  normalizedName: String,          // Нормализованное название
  unit: String,                    // Единица измерения
  quantity: Number,                // Объём
  price: Number,                   // Цена (из сметы)
  originalRow: Array,              // Исходная строка в таблице
  confidence: String               // Достоверность распознавания
}


⸻

TechnologyModel

Данные по трудозатратам и численности.

{
  totalHours: Number,               // Всего человеко-часов
  workers: Number,                  // Число работников
  workStructure: [                   // Детализация по работам
    {
      rawRowIndex: Number,
      stage: String,
      subsection: String,
      name: String,
      unit: String,
      quantity: Number,
      price: Number,
      norm: Number,                  // Норма (чел-ч/ед)
      hours: Number,                 // Рассчитанные часы
      normSource: 'norms_dictionary' | 'ai_fallback' | 'not_found'
    }
  ],
  stats: {
    totalWorksProcessed: Number,
    worksWithNorm: Number,
    worksWithoutNorm: Number,
    coveragePercent: Number,
    normSources: {
      norms_dictionary: Number,
      ai_fallback: Number,
      not_found: Number
    },
    aiCallsUsed: Number
  }
}


⸻

ScheduleModel

Информация по графику работ и технике.

{
  durationDays: Number,             // Длительность проекта в днях
  workers: Number,                  // Число рабочих
  machineryUsage: [                  // Использование техники
    {
      name: String,                  // Название техники
      hoursPerDay: Number,           // Часов в день
      totalDays: Number              // Всего дней
    }
  ]
}


⸻

FinanceModel

Финансовые показатели проекта.

{
  laborCost: Number,                 // Затраты на труд
  materialsCost: Number,             // Затраты на материалы
  machineryCost: Number,             // Затраты на технику
  overhead: Number,                  // Накладные расходы
  costPrice: Number,                 // Себестоимость
  profit: Number,                    // Прибыль
  salesPrice: Number                 // Цена продажи
}


⸻

ProfitModel

Расширение FinanceModel с дополнительной маржинальностью.

{
  totalCost: Number,
  markupPercentage: Number,
  profitAmount: Number,
  salesPrice: Number
}


⸻

CommerceModel

Коммерческое предложение.

{
  title: String,
  totalPrice: Number,
  profitAmount: Number,
  terms: String,
  validityDays: Number,
  date: String
}


⸻

AccountingModel

Бухгалтерские документы проекта.

{
  ks2: { documentType: String, totalAmount: Number },
  ks3: { documentType: String, totalAmount: Number, vat: Number },
  invoice: { documentType: String, amount: Number, dueDate: String },
  reconciliationStatement: { documentType: String, finalBalance: Number }
}


⸻

AuditModel

Результаты контроля качества и аудит.

{
  totalWorks: Number,
  worksWithNorm: Number,
  worksWithoutNorm: Number,
  coverage: Number,
  totalHours: Number,
  workers: Number,
  totalPrice: Number,
  normSources: {
    dictionary: Number,
    ai: Number,
    notFound: Number
  },
  timestamp: String
}


⸻

Notes
	•	Все модели взаимосвязаны через Project.
	•	Каждая сущность соответствует конкретному модулю в системе Subpodryad AI.
	•	Audit и Accounting модели могут формировать отдельные листы в Google Sheets для аналитики и проверки.

