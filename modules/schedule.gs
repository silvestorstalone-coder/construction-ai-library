/**
 * Schedule.gs - v4.1 [CONTRACT START DATE]
 */

const Schedule = (() => {
  
  function process(technologyResult) {
    console.log('=== Schedule v4.1 [Contract Linked] STARTED ===');

    if (!technologyResult || !technologyResult.workStructure) {
      return null;
    }

    const config = typeof Config !== 'undefined' ? Config.get() : {};
    
    // ПРИВЯЗКА К ДОГОВОРУ:
    // Ищем дату договора. Формат в конфиге должен быть "YYYY-MM-DD"
    let startDate;
    if (config.contract_date) {
      startDate = new Date(config.contract_date);
      console.log(`📅 Старт от даты договора: ${config.contract_date}`);
    } else {
      startDate = new Date();
      console.warn('⚠️ Дата договора не указана в Config. Использую сегодня.');
    }

    let currentDate = new Date(startDate);
    const timeline = [];
    const workersCount = technologyResult.workers || 1;
    const workHoursPerDay = config.work_hours_per_day || 8;

    const stagesMap = technologyResult.workStructure.reduce((acc, work) => {
      if (!acc[work.stage]) acc[work.stage] = { name: work.stage, totalHours: 0 };
      acc[work.stage].totalHours += work.hours;
      return acc;
    }, {});

    const stages = Object.values(stagesMap);

    stages.forEach((stage) => {
      const stageDuration = Math.ceil(stage.totalHours / (workersCount * workHoursPerDay)) || 1;
      
      const sDate = new Date(currentDate);
      const eDate = new Date(currentDate);
      eDate.setDate(sDate.getDate() + stageDuration);

      timeline.push({
        stageName: stage.name,
        durationDays: stageDuration,
        startDate: formatDate(sDate),
        endDate: formatDate(eDate)
      });

      currentDate = new Date(eDate); // Следующий этап после конца предыдущего
    });

    return {
      projectTotalDays: timeline.reduce((sum, s) => sum + s.durationDays, 0),
      startDate: timeline.length > 0 ? timeline[0].startDate : formatDate(startDate),
      endDate: timeline.length > 0 ? timeline[timeline.length - 1].endDate : formatDate(startDate),
      timeline
    };
  }

  function formatDate(date) {
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toISOString().split('T')[0];
  }

  return { process };
})();
