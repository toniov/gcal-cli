#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { promisify } = require('util');
const google = require('googleapis');
const Sherlock = require('sherlockjs');
const chalk = require('chalk');
const moment = require('moment');
const conf = require('./conf');

/**
 * Get Oauth2 Client
 */
const getOauth2Client = () => {
  const content = fs.readFileSync(conf.CRED_PATH);
  const {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: redirectUris
  } = JSON.parse(content).installed;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);
};

/**
 * Get Calendar Client
 * @returns {Promise}
 */
const getClient = async () => {
  const oauth2Client = getOauth2Client();
  const tokens = fs.readFileSync(conf.TOKEN_PATH);
  oauth2Client.setCredentials(JSON.parse(tokens));
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Error handler
 * @param {Object} err
 */
const errHandler = module.exports.errHandler = (err, debug = false) => {
  if (debug) {
    console.error(`[ERROR] ${err.code} ${err.stack}`);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }
};

/**
 * Generate consent page URL
 * @returns {Promise}
 */
module.exports.generateUrl = async () => {
  const oauth2Client = getOauth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: conf.SCOPES
  });
  console.log(authUrl);
};

/**
 * Store token
 * @param {string} code
 * @returns {Promise}
 */
module.exports.storeToken = async (code) => {
  const oauth2Client = getOauth2Client();
  const tokens = await promisify(oauth2Client.getToken).bind(oauth2Client)(code);
  // oauth2Client.setCredentials(tokens);
  fs.writeFileSync(conf.TOKEN_PATH, JSON.stringify(tokens));
  console.log(`Token stored in ${conf.TOKEN_PATH}`);
};

/**
 * List events
 * @param {string} [naturalInfo]
 * @param {Object} [options]
 * @param {string} options.from
 * @param {string} options.to
 * @param {boolean} options.showId
 * @returns {Promise}
 */
module.exports.list = async (naturalInfo, options) => {
  const { from, to, showId } = options;
  const params = {
    calendarId: conf.CALENDAR_ID,
    singleEvents: true,
    orderBy: conf.LIST_ORDER
  };
  if (naturalInfo) {
    const { startDate, endDate, isAllDay } = Sherlock.parse(naturalInfo);
    params.timeMin = moment(startDate).format() || moment().format();
    if (endDate && !isAllDay) {
      params.timeMax = moment(endDate).format();
    } else if (endDate && isAllDay) {
      params.timeMax = moment(endDate).endOf('day').format();
    } else if (!endDate && isAllDay) {
      params.timeMax = moment(startDate).endOf('day').format();
    }
  } else if (from || to) {
    if (from) {
      params.timeMin = moment(from).format();
    }
    if (to) {
      params.timeMax = moment(to).format();
    }
  } else {
    params.timeMin = moment().startOf('day').format();
    params.timeMax = moment().endOf('day').format();
  }

  const calendar = await getClient();
  const { items: events } = await promisify(calendar.events.list)(params);
  if (events.length === 0) {
    console.log(`No upcoming events found (${params.timeMin} ~ ${params.timeMax || ''})`);
    return;
  }
  console.log(`Upcoming events (${params.timeMin} ~ ${params.timeMax || ''})`);
  events.forEach(event => {
    let start;
    if (event.start.dateTime) {
      start = moment(event.start.dateTime).format(conf.LIST_FORMAT_DATETIME);
    } else {
      start = moment(event.start.date).format(conf.LIST_FORMAT_DATE);
    }
    if (showId) {
      console.log(` ${start} - ${chalk.bold(event.summary)} (${event.id})`);
    } else {
      console.log(` ${start} - ${chalk.bold(event.summary)}`);
    }
  });
};

/**
 * Insert event
 * @param {string} [naturalInfo]
 * @param {Object} [options]
 * @param {string} options.summary
 * @param {string} options.date
 * @param {string} options.time
 * @param {string} options.duration
 * @returns {Promise}
 */
module.exports.insert = async (naturalInfo, options) => {
  const event = {};
  if (naturalInfo) {
    const { eventTitle, startDate, endDate, isAllDay } = Sherlock.parse(naturalInfo);
    event.summary = eventTitle;
    if (isAllDay) {
      event.start = {
        date: moment(startDate).format('YYYY-MM-DD')
      };
      event.end = {
        date: endDate ? moment(endDate).add(1, 'd').format('YYYY-MM-DD') : moment(startDate).format('YYYY-MM-DD')
      };
    } else {
      event.start = {
        dateTime: moment(startDate).format()
      };
      event.end = {
        dateTime: endDate ? moment(endDate).format() : moment(startDate).add(conf.EVENT_DURATION, 'm').format()
      };
    }
  } else {
    const { summary, date, time, duration } = options;
    event.summary = summary;
    const isAllDay = !time;
    if (isAllDay) {
      event.start = {
        date: moment(date).format('YYYY-MM-DD')
      };
      event.end = {
        date: duration ?
          moment(date).add(duration.slice(0, -1), duration.slice(-1)).format('YYYY-MM-DD') :
          moment(date).add(1, 'd').format('YYYY-MM-DD')
      };
    } else {
      const dateTime = `${date} ${time}`;
      event.start = {
        dateTime: moment(dateTime).format()
      };
      event.end = {
        dateTime: duration ?
          moment(dateTime).add(duration.slice(0, -1), duration.slice(-1)).format() :
          moment(dateTime).add(conf.EVENT_DURATION, 'm').format()
      };
    }
  }
  const params = {
    calendarId: conf.CALENDAR_ID,
    resource: event
  };
  const calendar = await getClient();
  const { summary: insertedSummary, start, end, htmlLink } = await promisify(calendar.events.insert)(params);
  console.log(`${insertedSummary || 'no-summary'}: ${start.date || start.dateTime} ~ ${end.date || end.dateTime}`);
  console.log(htmlLink);
};

/**
 * Insert events in bulk
 * @param {string} eventsPath
 * @returns {Promise}
 */
module.exports.bulk = async (eventsPath) => {
  const events = require(eventsPath);
  const calendar = await getClient();
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
    } catch (err) {
      console.error(`[ERROR] Error inserting event: ${JSON.stringify(event) || ''}`);
      errHandler(err, true);
    }
  });
  await Promise.all(promises);
};
