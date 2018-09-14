const client = require('./client');
const { promisify } = require('util');
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
  const insert = promisify(calendar.events.insert);
  const promises = events.map(event => insert(event));

  return pSettle(promises);
};
