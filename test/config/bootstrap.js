/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * Perform test operations and match update events against rules
 */

var OPERATION_INTERVAL = 200;

module.exports.bootstrap = function(cb) {
  // Complete sails lift immediately
  cb();

  var installed = [];
  var opCount = 0;

  var liveAll = Foo.liveFind({});
  liveAll.on('update', function(diff, data) {
    // Conditional to match valid diff/data states
    if(
      // Initial state: empty diff with empty added array
      (data.length === 0 && diff.added.length === 0)
      // First stage: adding sample items
      || (diff.added && diff.added[0].message * 1 === diff.added[0].id)
      // Second stage: One item removed
      || (opCount === 7 && data.length === 5)
    ) {
      process.stdout.write('.');
    } else {
      console.log('failed!'.red, diff);
      process.exitCode = 1;
      process.kill(process.pid, 'SIGINT');
    }

    opCount++;
  });

  // Perform operations at regular interval
  var operationInterval = setInterval(function() {
    if(installed.length < 6) {
      // First stage: insert sample data
      Foo.create({ message: installed.length + 1 }).exec(function(error, result) {
        if(error) throw error;
        installed.push(result);
      });
    } else if(opCount === 7) {
      // Second stage: remove an item
      Foo.destroy({ id: 3 }).exec(function(error) {
        if(error) throw error;
      });
    } else {
      // Third stage: still running? passed
      console.log('passed'.green);
      clearInterval(operationInterval);
      process.kill(process.pid, 'SIGINT');
    }
  }, OPERATION_INTERVAL);
};
