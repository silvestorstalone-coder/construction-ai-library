# Subpodryad AI — Domain Models

## Overview
Модели предметной области описывают структуру данных на каждом этапе обработки: смета, технология, графики, финансы, КП, бухгалтерия и аудит.

---

## Core Models

### Project
Корневая сущность проекта.
```javascript
{
  id: String,                    // Уникальный идентификатор
  name: String,                   // Название проекта
  createdAt: Date,                // Дата создания
  updatedAt: Date,                // Дата обновления
  sourceSheet: String,            // Исходный лист
  status: 'draft' | 'processing' | 'completed' | 'error',
  estimate: EstimateModel,        // Данные сметы
  technology: TechnologyModel,    // Данные технологии
  schedule: ScheduleModel,        // Данные графика
  finance: FinanceModel,          // Данные финансов
  commerce: CommerceModel,        // Данные КП
  accounting: AccountingModel,    // Данные бухгалтерии
  audit: AuditModel               // Данные аудита
}
```

---

### EstimateModel
Данные по смете и структуре работ.
```javascript
{
  type: 'simple' | 'complex',     
  stages: [                        
    {
      name: String,                
      subsections: [                
        {
          name: String,             
          works: [WorkItem]         
        }
      ]
    }
  ],
  worksFlat: [WorkItem],           
  financialRows: [                  
    {
      rawRowIndex: Number,
      name: String,
      value: Number
    }
  ],
  unclassifiedRows: [               
    {
      rawRowIndex: Number,
      type: String,
      name: String
    }
  ],
  diagnostics: {                    
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
```

---

### WorkItem
Описывает отдельную работу/позицию в смете.
```javascript
{
  rawRowIndex: Number,
  section: String,                  
  subsection: String,               
  name: String,                     
  normalizedName: String,           
  unit: String,                     
  quantity: Number,                 
  price: Number,                    
  originalRow: Array,               
  confidence: String                
}
```

---

### TechnologyModel
Рассчитанные трудозатраты и структура работ.
```javascript
{
  totalHours: Number,
  workers: Number,
  workStructure: [
    {
      rawRowIndex: Number,
      stage: String,
      subsection: String,
      name: String,
      unit: String,
      quantity: Number,
      price: Number,
      norm: Number,
      hours: Number,
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
```

---

### ScheduleModel
Данные о графике выполнения работ.
```javascript
{
  durationDays: Number,
  workers: Number,
  machineryUsage: [
    {
      name: String,
      hoursPerDay: Number,
      totalDays: Number
    }
  ]
}
```

---

### FinanceModel
Финансовые расчёты по проекту.
```javascript
{
  laborCost: Number,
  materialsCost: Number,
  machineryCost: Number,
  overhead: Number,
  costPrice: Number,
  profit: Number,
  salesPrice: Number
}
```

---

### ProfitModel
Расширение FinanceModel для расчёта маржинальности.
```javascript
{
  totalCost: Number,
  markupPercentage: Number,
  profitAmount: Number,
  salesPrice: Number
}
```

---

### CommerceModel
Коммерческое предложение.
```javascript
{
  title: String,
  totalPrice: Number,
  profitAmount: Number,
  terms: String,
  validityDays: Number,
  date: String
}
```

---

### AccountingModel
Бухгалтерские документы.
```javascript
{
  ks2: { documentType: String, totalAmount: Number },
  ks3: { documentType: String, totalAmount: Number, vat: Number },
  invoice: { documentType: String, amount: Number, dueDate: String },
  reconciliationStatement: { documentType: String, finalBalance: Number }
}
```

---

### AuditModel
Детальный аудит проекта.
```javascript
{
  totalWorks: Number,
  worksWithNorm: Number,
  worksWithoutNorm: Number,
  coverage: Number,
  totalHours: Number,
  workers: Number,
  totalPrice: Number,
  normSources: { dictionary: Number, ai: Number, notFound: Number },
  timestamp: String
}
```
