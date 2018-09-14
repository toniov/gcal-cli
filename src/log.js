/**
 * Log error to console
 * @param  {[Object}  err
 * @param  {Boolean}
 */
module.exports.error = (err, debug = false) => {
  if (debug) {
    console.error(`[ERROR] ${err.code} ${err.stack}`);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }
};
