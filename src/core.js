#!/usr/bin/env node
'use strict';

const api = require('./api');
const chalk = require('chalk');
const client = require('./client');
const conf = require('./conf');
const fs = require('fs');
const log = require('./log');
const moment = require('moment');
const { promisify } = require('util');
const Sherlock = require('sherlockjs');

/**
 * Generate consent page URL
 * @returns {Promise}
 */
module.exports.generateUrl = async () => {
  const oauth2Client = client.getOauth2Client();
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
  const oauth2Client = client.getOauth2Client();
  const tokens = await promisify(oauth2Client.getToken).bind(oauth2Client)(code);
  fs.writeFileSync(conf.TOKEN_PATH, JSON.stringify(tokens));
  console.log(`Token stored in ${conf.TOKEN_PATH}`);
};

/**
 * Display list of calendars... just to display the link to enable the api
 */
module.exports.enable = async () => {
  const calendar = await client();
  const {items} = await promisify(calendar.calendarList.list)();

  items.forEach(item => {
    console.log(item.summary);
  });
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

  const calendar = await client();
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

  const { summary: insertedSummary, start, end, htmlLink } = await api.insert(params);

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
  const results =  await api.bulk(events);

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
      log.error(result.reason, true);
    });
};
