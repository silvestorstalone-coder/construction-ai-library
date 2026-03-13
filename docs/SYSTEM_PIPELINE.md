# 🏗️ SYSTEM_PIPELINE.md: Архитектурный Эталон v2.0

> **Статус**: ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ (ДЛЯ AI_RUNNER.JS)
> **Дата**: 13 марта 2026

---

## ⚖️ 1. ПРИОРИТЕТЫ И ИНТЕРФЕЙС
1. **User-First (Приоритет Пользователя)**: Если ячейка (цена, количество, ставка) заполнена вручную — ИИ ЗАПРЕЩЕНО её менять.
2. **Visual Feedback**: При записи авто-данных ИИ должен помечать ячейку цветом или добавлять примечание "AI: Calculated".
3. **Config Sync**: Базовые ставки профессий и налоги берутся из листа "Settings" или модуля `config.gs`.

---

## 📐 2. ЛОГИКА И ФОРМУЛЫ ПО МОДУЛЯМ

### 📦 TECHNOLOGY (Трудозатраты)
- **Поиск**: Сопоставление названий из `estimateResult` с базой `NORMS_DATABASE.md`.
- **Расчет**: `LaborHours = Quantity * NormTime`.
- **Резерв**: Если работа не найдена, использовать норму **0.5 чел-час** на ед. изм.
- **Оборудование**: Назначение техники на основе поля `equipment` из базы норм.

### 📦 FINANCE (Экономика v2.0)
- **Data Input**: Принимает `estimateResult` и `technologyResult`.
- **Global Settings**: ОБЯЗАТЕЛЬНО запрашивать ставки через `config.gs` или `Settings`:
  - `hourly_rate` (дефолт: 500)
  - `tax_multiplier` (НДС/Налоги, дефолт: 1.20)
  - `overhead_multiplier` (Накладные, дефолт: 1.15)
- **Расчетная логика**:
  1. **Labor**: `totalHours * hourly_rate`. Добавить проверку: если в `technologyResult` есть `customRates`, приоритет им.
  2. **Materials**: Использовать `work.quantity * work.price` из каждой строки `totalWorksList`.
  3. **Machinery**: Прямое получение суммы из `technologyResult.machineryCost`.
- **Налоги и Прибыль**:
  - `DirectCosts = Labor + Materials + Machinery`
  - `WithOverheads = DirectCosts * overhead_multiplier`
  - `FinalTotal = WithOverheads * tax_multiplier`
- **Output Structure**: Возвращать объект с детализацией: 
  `{ laborCost, materialsCost, machineryCost, overheadValue, taxValue, totalFinal, margin }`.
- **Validation**: Если `totalFinal` равен 0 или NaN — выбрасывать ошибку в лог.


### 📦 SCHEDULE (Сроки)
- **Длительность (дни)**: `TotalLaborHours / (WorkersCount * 8)`.
- **Этапность**: Сроки агрегируются строго по этапам (Stages), указанным в смете.

---

## 🤖 3. ПРАВИЛА КОДА ДЛЯ ИИ-ИНЖЕНЕРА
- **Clean Code**: Использовать ES6+, стандарты Google Apps Script.
- **No Placeholders**: Запрещены заглушки типа `let x = 0`. Только реальный расчет.
- **Связи**: Строгое соблюдение цепочки передачи данных: `Estimate -> Technology -> Finance -> Schedule`.
- **Logging**: Обязательный вызов `console.log` в начале и конце работы каждого модуля.
