// schedule.gs

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

    logInfo("Schedule.process completed. Duration: " + durationDays + " дней.");

    return {
      durationDays: durationDays,
      workers: workers,
      machineryUsage: machineryUsage
    };
  }

  return { process: process };

})();