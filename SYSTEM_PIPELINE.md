# Subpodryad AI — System Pipeline

## Overview
Pipeline системы Subpodryad AI строится по линейно-итеративной модели: данные из сметы проходят через все модули для расчёта трудозатрат, графиков, финансов и аудита.

---

## Pipeline Steps

```
[Вход: Google Sheet со сметой]
         ↓
1. ESTIMATE SERVICE (estimate.gs)
   - Детекция заголовков
   - Разделение на этапы и подразделы
   - Формирование WorkItem[]
   - Финансовые строки и диагностика
   ↓
   Выход: EstimateModel

         ↓
2. TECHNOLOGY SERVICE (technology.gs)
   - Определение нормы трудозатрат (словарь или AI)
   - Расчёт часов и численности рабочих
   - Источник нормы: dictionary / ai / not_found
   ↓
   Выход: TechnologyModel

         ↓
3. SCHEDULE SERVICE (schedule.gs)
   - Построение графика по этапам
   - Расчёт использования техники и длительности
   ↓
   Выход: ScheduleModel

         ↓
4. FINANCE SERVICE (finance.gs)
   - Расчёт затрат на труд, материалы и технику
   - Накладные расходы
   - Себестоимость и прибыль
   ↓
   Выход: FinanceModel

         ↓
5. PROFIT SERVICE (profit.gs)
   - Расчёт маржинальности
   - Альтернативный расчёт прибыли
   ↓
   Выход: ProfitModel

         ↓
6. COMMERCE SERVICE (commerce.gs)
   - Генерация коммерческого предложения
   - Условия оплаты и срок действия
   ↓
   Выход: CommerceModel

         ↓
7. ACCOUNTING SERVICE (accounting.gs)
   - Акт КС-2, справка КС-3, счет, акт сверки
   ↓
   Выход: AccountingModel

         ↓
8. AUDIT SERVICE (audit.gs)
   - Контроль качества каждой работы
   - Проверка норм и источников
   ↓
   Выход: AuditModel + лист "Audit"

[Выход: Листы "Results" и "Audit" в Google Sheet]
```

---

## Data Flow Between Services

- **EstimateModel → TechnologyService**: `worksFlat[]` и `worksFlat[].quantity`
- **TechnologyModel → ScheduleService**: `totalHours`, `workers`
- **TechnologyModel → FinanceService**: `workStructure[].hours`
- **ScheduleModel → FinanceService**: `durationDays`, `machineryUsage`
- **FinanceModel → CommerceService**: `salesPrice`, `profit`
- **ProfitModel → CommerceService**: альтернативные расчёты
- **Все данные → AccountingService**: формирование документов
