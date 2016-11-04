'use strict';

const path = require('path');
const conf = {};

conf.SCOPES = ['https://www.googleapis.com/auth/calendar'];

conf.TOKEN_DIR = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.credentials');

conf.TOKEN_PATH = path.join(conf.TOKEN_DIR, 'calendar-api-quickstart.json');

// default order when listing events
conf.LIST_ORDER = 'startTime';

// default duration when inserting events
conf.EVENT_DURATION = 60;

// default date formats when listing events
// not all day event
conf.START_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';
// all day event
conf.START_DATE_FORMAT = 'YYYY-MM-DD -----';

// default calendar id
conf.CALENDAR_ID = 'primary';

module.exports = conf;
