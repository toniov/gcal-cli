const client = require('./client');
const { promisify } = require('util');
const pLog = require('p-log');
const pRetry = require('p-retry');
const pSettle = require('p-settle');

/**
 * Insert with event object
 * @param {Object}
 * @return {Promise}
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
  // retry for The server is currently unavailable
  // (because it is overloaded or down for maintenance). Generally, this is a temporary state.
  // https://stackoverflow.com/questions/29562774/google-calendar-api-backend-error-code-503
  const options = {'retries': 10};
  const insert = promisify(calendar.events.insert);
  const promises = events.map(async event => {
    return await pRetry(async () => {
      return await insert(event).catch(pLog.catch());
    }
    , options)});

  return pSettle(promises);
};
