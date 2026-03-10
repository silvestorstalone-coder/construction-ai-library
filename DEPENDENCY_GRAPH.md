# Subpodryad AI — Dependency Graph

## Overview
Граф зависимостей показывает, какие модули вызывают друг друга, и каким образом данные перемещаются по системе. Это критично для понимания цепочек обработки и контроля критических точек.

---

## Graph Representation

```
main.gs (Orchestrator)
├── menu.gs (UI Service)
├── diagnostics.gs (Logging & Monitoring)
├── estimate.gs (Estimate Service)
│   ├── utils.gs
│   └── norms.gs
├── technology.gs (Technology Service)
│   ├── norms.gs
│   └── aiModule.gs
├── schedule.gs (Schedule Service)
├── finance.gs (Finance Service)
├── commerce.gs (Commerce Service)
├── profit.gs (Profit Service)
├── accounting.gs (Accounting Service)
├── audit.gs (Audit Service)
└── config.gs (Global Configurations)
```

---

## Dependency Details

1. **main.gs**
   - Центральный узел управления.
   - Вызывает все остальные сервисы.
   - Принимает выбор пользователя через menu.gs.

2. **menu.gs**
   - UI Service.
   - Не имеет зависимостей.
   - Вызывает main.process() при действиях пользователя.

3. **diagnostics.gs**
   - Logging & Monitoring.
   - Используется estimate, technology, aiModule для фиксации ошибок и предупреждений.

4. **estimate.gs**
   - Зависит от utils.gs и norms.gs.
   - Генерирует структурированные WorkItem объекты.
   - Передает данные в technology.gs и далее в finance.gs.

5. **technology.gs**
   - Зависит от norms.gs и aiModule.gs.
   - Рассчитывает часы, определяет источник нормы (dictionary/AI).
   - Выдает TechnologyModel для schedule и finance.

6. **schedule.gs**
   - Зависит от technology.gs.
   - Строит графики работ и рассчитывает ресурсы.

7. **finance.gs**
   - Зависит от technology.gs, schedule.gs.
   - Расчет затрат на труд, материалы, технику, накладные и себестоимость.

8. **profit.gs**
   - Зависит от finance.gs.
   - Дополнительные расчеты маржинальности.

9. **commerce.gs**
   - Зависит от finance.gs.
   - Генерация коммерческих предложений на основе рассчитанных финансов.

10. **accounting.gs**
    - Зависит от finance.gs.
    - Формирует бухгалтерские документы (КС-2, КС-3, счета).

11. **audit.gs**
    - Зависит от estimate.gs и technology.gs.
    - Контроль качества, аудит и статистика источников норм.

12. **aiModule.gs**
    - Используется technology.gs для классификации работ.
    - Вызывает Yandex GPT и diagnostics для логирования.

13. **norms.gs**
    - Словарь нормативных трудозатрат.
    - Используется estimate.gs и technology.gs.

14. **config.gs**
    - Глобальные настройки.
    - Используется всеми сервисами для параметров и констант.

---

## Notes
- Цепочка зависимостей строго линейная для ключевых бизнес-сервисов: `estimate → technology → schedule → finance → profit/commerce → accounting`.
- audit.gs может выполняться параллельно после estimate и technology для контроля качества.
- Главная критическая точка: main.gs. Ошибка в main приводит к остановке всей цепочки.
- Рекомендуется использовать Event Bus для снижения прямых вызовов и уменьшения связности.
