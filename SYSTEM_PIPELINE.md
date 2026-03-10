# Subpodryad AI — System Pipeline

## Overview
System Pipeline описывает полный поток данных и последовательность обработки от входного листа Google Sheets до финальных отчетов и аудита.

---

## Input
- Исходный лист Google Sheets со сметой (`EstimateInput`)
- Структура: строки с работами, подразделами и финансовыми показателями
- Формат: массив массивов (`Array<Array>`)

---

## Pipeline Steps

### 1. Estimate Service (`estimate.gs`)
- **Вход**: исходный лист
- **Обработка**:
  - Детекция заголовков
  - Разделение на этапы и подразделы
  - Генерация WorkItem объектов
  - Выделение финансовых строк
  - Диагностика покрытия
- **Выход**: `EstimateModel`

### 2. Technology Service (`technology.gs`)
- **Вход**: `EstimateModel.worksFlat`
- **Обработка**:
  - Поиск норм в `norms.gs`
  - Вызов AI (aiModule.gs) для неопределённых позиций
  - Расчёт трудозатрат (часы × объём)
  - Источник нормы: `dictionary` / `ai` / `not_found`
  - Подсчёт общего числа рабочих
- **Выход**: `TechnologyModel`

### 3. Schedule Service (`schedule.gs`)
- **Вход**: `TechnologyModel`
- **Обработка**:
  - Расчёт длительности проекта в днях
  - Распределение работников и техники
- **Выход**: `ScheduleModel`

### 4. Finance Service (`finance.gs`)
- **Вход**: `TechnologyModel`, `ScheduleModel`
- **Обработка**:
  - Расчёт затрат на труд, материалы, технику
  - Накладные расходы (15%)
  - Себестоимость и первичная прибыль (20%)
- **Выход**: `FinanceModel`

### 5. Profit Service (`profit.gs`)
- **Вход**: `FinanceModel`
- **Обработка**:
  - Расчёт маржинальности и альтернативной прибыли
- **Выход**: `ProfitModel`

### 6. Commerce Service (`commerce.gs`)
- **Вход**: `FinanceModel` / `ProfitModel`
- **Обработка**:
  - Генерация коммерческого предложения
  - Определение условий оплаты и срока действия
- **Выход**: `CommerceModel`

### 7. Accounting Service (`accounting.gs`)
- **Вход**: `FinanceModel`
- **Обработка**:
  - Формирование бухгалтерских документов (КС-2, КС-3, счета)
  - Акт сверки
- **Выход**: `AccountingModel`

### 8. Audit Service (`audit.gs`)
- **Вход**: `EstimateModel`, `TechnologyModel`
- **Обработка**:
  - Контроль качества данных
  - Статистика по источникам норм
  - Сравнение расчёта с нормативами
- **Выход**: лист "Audit" + `AuditModel`

---

## Data Flow Diagram (Simplified)
EstimateModel → TechnologyService → ScheduleService
TechnologyModel → FinanceService → ProfitService → CommerceService
FinanceModel → AccountingService
---

## Critical Validation Points

| Step | Check | Threshold |
|------|-------|-----------|
| Estimate → Technology | worksFlat.length | >0 |
| Technology → Schedule | totalHours | >0 |
| Schedule → Finance | durationDays | >0 |
| Finance → Commerce | salesPrice | >0 |
| Audit | all data covered | 100% |

---

## Notes
- Audit может выполняться параллельно после Estimate и Technology
- Основная критическая точка: `main.gs` — ошибка блокирует весь pipeline
- Event Bus рекомендуется для уменьшения прямых вызовов между модулями
