const client = require('./client');
const conf = require('./conf');
const log = require('./log');
const { promisify } = require('util');

/**
 * Insert with event object
 * @param {Object}
 */
module.exports.insert = async params => {
  const calendar = await client();
  return await promisify(calendar.events.insert)(params);
};

/**
 * Bulk insert with google apis
 * @param  {Object}  events
 * @return {Promise}
 */
module.exports.bulk = async events => {
  const calendar = await client();
  const insert = promisify(calendar.events.insert);
  const promises = events.map(async event => {
    try {
      const result = await insert(event);
      console.log('Event inserted');
      conf.BULK_RESULT.forEach(property => {
        if (result[property]) {
          console.log(` ${property}: ${result[property]}`);
        }
      });

      return result;
    } catch (err) {
      console.error(`[ERROR] Error inserting event: ${JSON.stringify(event) || ''}`);
      log.error(err, true);
    }
  });
  return await Promise.all(promises);
};
