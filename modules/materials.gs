/**
 * Materials.gs - v1.0 [REAL RESOURCE LOGIC]
 */

const Materials = (() => {
  
  function process(technologyResult) {
    console.log('=== Materials v1.0 [Resource Extraction] STARTED ===');
    
    if (!technologyResult || !technologyResult.workStructure) return null;

    const materialsOrder = [];
    const machineryOrder = [];

    technologyResult.workStructure.forEach(work => {
      // Запрашиваем ресурсы у "Полевого аналитика" на основе ГЭСН
      const resources = fetchResourcesFromAI(work.name, work.code, work.quantity, work.unit);
      
      if (resources && resources.materials) {
        resources.materials.forEach(mat => {
          materialsOrder.push({
            parentWork: work.name,
            materialName: mat.name,
            quantity: mat.totalQuantity,
            unit: mat.unit,
            norm: mat.normPerUnit
          });
        });
      }

      if (resources && resources.machinery) {
        machineryOrder.push({
          workName: work.name,
          machineType: resources.machinery,
          hours: work.hours // Привязка к часам из Technology
        });
      }
    });

    return { materialsOrder, machineryOrder };
  }

  function fetchResourcesFromAI(workName, workCode, quantity, unit) {
    if (typeof aiModule === 'undefined') return null;

    // Промпт для Яндекса: Жесткое требование ГЭСН
    const prompt = `Как эксперт-сметчик, укажи основные материалы и технику по ГЭСН для: 
    "${workName}" (Код: ${workCode || 'не указан'}). 
    Объем: ${quantity} ${unit}. 
    Выдай строго в формате JSON: 
    {"materials": [{"name": "название", "normPerUnit": число, "unit": "ед.изм", "totalQuantity": число}], "machinery": "тип техники"}`;

    try {
      const response = aiModule.classifyRawText(prompt); // Используем наш aiModule
      return JSON.parse(response);
    } catch (e) {
      console.error(`Ошибка получения ресурсов для ${workName}: ${e.message}`);
      return null;
    }
  }

  return { process };
})();
