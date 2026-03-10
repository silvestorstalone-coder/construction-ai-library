# Subpodryad AI Architecture

## System Overview
Subpodryad AI — модульная система управления строительным подрядом, построенная по принципу микромодулей (.gs файлы). Каждый модуль отвечает за отдельную бизнес-область.

## LEVEL 1 — Physical Modules
Список всех файлов:

1. config.gs — глобальные настройки
2. utils.gs — вспомогательные функции
3. diagnostics.gs — логирование
4. norms.gs — словарь норм трудозатрат
5. aiModule.gs — интеграция с Yandex GPT
6. estimate.gs — парсинг и анализ смет
7. technology.gs — расчёт трудозатрат
8. schedule.gs — построение графиков
9. finance.gs — финансовые расчёты
10. commerce.gs — коммерческие предложения
11. profit.gs — расчёт прибыли
12. accounting.gs — бухгалтерские документы
13. audit.gs — аудит и контроль качества
14. menu.gs — пользовательское меню
15. main.gs — оркестратор
16. test.gs — тестирование (опционально)

## LEVEL 2 — Logical Services
- **UI Service (menu.gs)** — меню, взаимодействие с пользователем
- **Diagnostics Service (diagnostics.gs)** — логирование, мониторинг
- **Estimate Service (estimate.gs)** — парсинг смет и детекция заголовков
- **Norms Engine (norms.gs)** — поиск норм трудозатрат
- **AI Classifier (aiModule.gs)** — классификация через Yandex GPT
- **Technology Service (technology.gs)** — расчёт трудозатрат и численности
- **Schedule Service (schedule.gs)** — построение графиков
- **Finance Service (finance.gs)** — расчёт себестоимости и накладных
- **Profit Service (profit.gs)** — расчёт маржинальности
- **Commerce Service (commerce.gs)** — формирование коммерческих предложений
- **Accounting Service (accounting.gs)** — КС-2, КС-3, счета
- **Audit Service (audit.gs)** — контроль качества

## Entry Point
- `main.gs` — оркестратор всех модулей
- `menu.gs` — интерфейс, связывает действия пользователя с main
