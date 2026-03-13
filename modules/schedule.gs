var Schedule = (function() {

  function process(technologyOutput) {
    logInfo("Schedule.process started.");

    var totalHours = technologyOutput.totalHours;
    var workers = technologyOutput.workers || 1;

    if (!totalHours) {
      logWarning("Total hours not provided in technology output.");
      return;
    }

    var durationDays = Math.ceil(totalHours / (workers * 8));

    var machineryUsage = technologyOutput.machinery || [];

    machineryUsage.forEach(function(machine) {
      machine.totalDays = durationDays;
    });

    // Критический путь
    var criticalPath = technologyOutput.stages.reduce((acc, stage) => acc + stage.duration, 0);

    logInfo("Schedule.process completed. Duration: " + durationDays + " дней. Critical Path: " + criticalPath + " дней.");

    return {
      durationDays: durationDays,
      workers: workers,
      machineryUsage: machineryUsage,
      criticalPath: criticalPath
    };
  }

  return { process: process };

})();