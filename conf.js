'use strict';

var conf = {};

conf.SCOPES = ['https://www.googleapis.com/auth/calendar'];

conf.TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/',

conf.TOKEN_PATH = conf.TOKEN_DIR + 'calendar-api-quickstart.json';

conf.eventList = {
  TIME_MIN: (new Date()).toISOString(),
  MAX_RESULTS: 10
};

conf.EVENT_DURATION = 60;

conf.CALENDAR_ID = 'primary';

module.exports = conf;