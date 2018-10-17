const conf = require('./conf');

/**
 * Log error to console
 * @param  {[Object}  err
 * @param  {Boolean}
 */
const error = module.exports.error = (err, debug = false) => {
  if (debug) {
    console.error(`[ERROR] ${err && err.code} ${err && err.stack}`);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }
};

/**
 * Log results to console
 * @param  {Array}  results
 * @param  {Boolean}
 */
module.exports.results = results => {
  results
    .filter(result => result.isFulfilled)
    .map(result => result.value)
    .forEach(result => {
      console.log('Event inserted');
      conf.BULK_RESULT.forEach(property => {
        if (result[property]) {
          console.log(` ${property}: ${result[property]}`);
        }
      });
    });

  results
    .filter(result => result.isRejected)
    .map(result => result.reason)
    .forEach(result => {
      console.error('[ERROR] Error inserting event');
      error(result.reason, true);
    });
};
