# Subpodryad AI — System Pipeline

## Overview
System Pipeline описывает полный поток данных и последовательность обработки от входного листа Google Sheets до финальных отчетов и аудита. Модули взаимодействуют друг с другом и передают ключевые данные.

---

## Input
- Исходный лист Google Sheets со сметой (`EstimateInput`)
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
- **Выход**: `EstimateModel`

### 2. Technology Service (`technology.gs`)
- **Вход**: `EstimateModel.worksFlat`
- **Обработка**:
  - Поиск норм трудозатрат (`norms.gs`)
  - Вызов AI для неопределённых позиций
  - Расчёт часов и численности рабочих
- **Выход**: `TechnologyModel`

### 3. Schedule Service (`schedule.gs`)
- **Вход**: `TechnologyModel`
- **Обработка**:
  - Расчёт длительности проекта
  - Распределение работников и техники
- **Выход**: `ScheduleModel`

### 4. Finance Service (`finance.gs`)
- **Вход**: `TechnologyModel`, `ScheduleModel`
- **Обработка**:
  - Расчёт затрат на труд, материалы и технику
  - Накладные расходы
  - Себестоимость и прибыль
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