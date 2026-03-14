# 🏗️ SYSTEM_PIPELINE.md: Архитектурный Эталон v2.2

> **Статус**: ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ (ДЛЯ AI_RUNNER.JS)
> **Дата**: 14 марта 2026
> **Правило**: ЗАПРЕЩЕНО удалять или сокращать логику пользователя.

---

## ⚖️ 1. ПРИОРИТЕТЫ И ИНТЕРФЕЙС
1. **User-First (Приоритет Пользователя)**: Если ячейка (цена, количество, ставка) заполнена вручную — ИИ ЗАПРЕЩЕНО её менять.
2. **Visual Feedback**: При записи авто-данных ИИ должен помечать ячейку цветом или добавлять примечание "AI: Calculated".
3. **Config Sync**: Базовые ставки профессий и налоги берутся из листа "Settings" или модуля `config.gs`.
4. **Декомпозиция (v2.0)**: Разделение сметы на Техядро (ГЭСН), Базу Саба (ПЗ) и Маржу Гены (НР, СП).

---

## 📐 2. ЛОГИКА И ФОРМУЛЫ ПО МОДУЛЯМ

### 📦 ESTIMATE (./modules/estimate.gs)
- **Regex-сканер**: Обязательный поиск кодов обоснования (ГЭСН, ФЕР, ТЕР).
- **Look-back logic**: Если название работы пустое, использовать значение из строки выше (для объединенных ячеек).
- **Слои**: Сохранение `gp_price` для последующего расчета прибыли генподрядчика.

### 📦 TECHNOLOGY (Трудозатраты)
- **Поиск**: Сопоставление названий из `estimateResult` с базой `NORMS_DATABASE.md`.
- **Приоритет ГЭСН (v2.0)**: Если есть код, норма берется строго по коду через `Norms.get(code)`.
- **Расчет**: `LaborHours = Quantity * NormTime`.
- **Резерв**: Если работа не найдена, использовать норму **0.5 чел-час** на ед. изм.
- **Оборудование**: Назначение техники на основе поля `equipment` из базы норм.

### 📦 FINANCE (Экономика v2.0)
- **Data Input**: Принимает `estimateResult` и `technologyResult`.
- **Global Settings**: ОБЯЗАТЕЛЬНО запрашивать ставки через `config.gs` или `Settings`:
  - `hourly_rate` (дефолт: 500)
  - `tax_multiplier` (дефолт: 1.20)
  - `overhead_multiplier` (дефолт: 1.15)
- **Расчетная логика**:
  1. **Labor**: `totalHours * hourly_rate`. Приоритет `customRates` из `technologyResult`.
  2. **Materials**: Использовать `work.quantity * work.price` из каждой строки.
  3. **Machinery**: Получение суммы из `technologyResult.machineryCost`.
- **Налоги и Прибыль**:
  - `DirectCosts = Labor + Materials + Machinery`
  - `WithOverheads = DirectCosts * overhead_multiplier`
  - `FinalTotal = WithOverheads * tax_multiplier`
- **Анализ Маржи (v2.0)**: Расчет Дельты `(Gen_Price - FinalTotal)` для формирования КП.
- **Output Structure**: Возвращать `{ laborCost, materialsCost, machineryCost, overheadValue, taxValue, totalFinal, margin }`.
- **Validation**: Если `totalFinal` равен 0 или NaN — выбрасывать ошибку в лог.

### 📦 SCHEDULE (Сроки)
- **Длительность (дни)**: `TotalLaborHours / (WorkersCount * 8)`.
- **Этапность**: Сроки агрегируются строго по этапам (Stages), указанным в смете.

---

## 🤖 3. ПРАВИЛА КОДА ДЛЯ ИИ-ИНЖЕНЕРА
- **Clean Code**: Использовать ES6+, стандарты GAS.
- **No Placeholders**: Запрещены заглушки. Только реальный расчет.
- **No Reduction**: Категорически запрещено удалять логику или сокращать документацию.
- **Logging**: Обязательный вызов `console.log` в начале и конце работы каждого модуля.
