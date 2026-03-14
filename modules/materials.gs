// AI Refactored: 2026-03-14T18:30:53.198Z

const Materials = (() => {
  async function process(technologyResult) {
    console.log('=== Materials v1.0 [Resource Extraction] STARTED ===');

    if (!technologyResult || !technologyResult.workStructure) return null;

    const materialsOrder = [];
    const machineryOrder = [];

    for (const work of technologyResult.workStructure) {
      // Запрашиваем ресурсы у "Полевого аналитика" на основе ГЭСН
      const resources = await fetchResourcesFromAI(work.name, work.code, work.quantity, work.unit);

      if (resources?.materials) {
        for (const mat of resources.materials) {
          materialsOrder.push({
            parentWork: work.name,
            materialName: mat.name,
            quantity: mat.totalQuantity,
            unit: mat.unit,
            norm: mat.normPerUnit
          });
        }
      }

      if (resources?.machinery) {
        machineryOrder.push({
          workName: work.name,
          machineType: resources.machinery,
          hours: work.hours // Привязка к часам из Technology
        });
      }
    }

    return { materialsOrder, machineryOrder };
  }

  async function fetchResourcesFromAI(workName, workCode, quantity, unit) {
    if (typeof aiModule === 'undefined') return null;

    // Промпт для Яндекса: Жесткое требование ГЭСН
    const prompt = `Как эксперт-сметчик, укажи основные материалы и технику по ГЭСН для: 
    "${workName}" (Код: ${workCode || 'не указан'}). 
    Объем: ${quantity} ${unit}. 
    Выдай строго в формате JSON: 
    {"materials": [{"name": "название", "normPerUnit": число, "unit": "ед.изм", "totalQuantity": число}], "machinery": "тип техники"}`;

    try {
      const response = await aiModule.classifyRawText(prompt); // Используем наш aiModule
      return JSON.parse(response);
    } catch (e) {
      console.error(`Ошибка получения ресурсов для ${workName}: ${e.message}`);
      return null;
    }
  }

  return { process };
})();