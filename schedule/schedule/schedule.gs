// schedule.gs

var Schedule = (function() {

  function process(technologyOutput) {
    logInfo("Schedule.process started.");

    var totalHours = technologyOutput.totalHours || 0;
    var workers = technologyOutput.workers || 1;

    var durationDays = Math.ceil(totalHours / (workers * 8));

    var machineryUsage = [{
      name: "Экскаватор",
      hoursPerDay: 8,
      totalDays: durationDays
    }];

    logInfo("Schedule.process completed. Duration: " + durationDays + " дней.");

    return {
      durationDays: durationDays,
      workers: workers,
      machineryUsage: machineryUsage
    };
  }

  return { process: process };

})();
