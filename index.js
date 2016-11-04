'use strict';

// requires
const fs = require('fs');
const google = require('googleapis');
const moment = require('moment');
const Vorpal = require('vorpal');
const chalk = Vorpal().chalk;
const conf = require('./conf');
const terms = require('./terms');
let calendar;

const cli = Vorpal();

// hidden command executed automatically after the app runs
cli.command('setup', 'Initial setup: authenticate.')
  .hidden()
  .action(function (args, callback) {
    let content = fs.readFileSync('client_secret.json');
    const credentials = JSON.parse(content).installed;
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    const redirectUrl = credentials.redirect_uris[0];
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    let tokens;
    try {
      // a) token is already stored
      tokens = fs.readFileSync(conf.TOKEN_PATH);
      oauth2Client.setCredentials(JSON.parse(tokens));
      oauth2Client.refreshAccessToken(err => {
        if (err) {
          this.log('Error while trying to refresh access token');
          return callback(err);
        }
        calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        callback();
      });
    } catch (err) {
      // b) no token stored or unknown error
      if (err.code !== 'ENOENT') {
        this.log('Error while trying to retreieve token from your computer');
        return callback(err);
      }
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: conf.SCOPES
      });
      this.log(`Authorize this app by visiting this url: ${authUrl}`);
      this.prompt({
        type: 'input',
        name: 'code',
        message: 'Enter the code from that page here: '
      }, result => {
        // Retrieve access token.
        oauth2Client.getToken(result.code, (err, tokens) => {
          if (err) {
            this.log('Error while trying to retrieve access token from Google');
            return callback(err);
          }
          oauth2Client.setCredentials(tokens);
          calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          storeToken(tokens);
          callback();
        });
      });
    }
  });


cli.command('list [term]', 'List events.\nIf term is specified the events for that period will be returned.\nFormat of term argument: YYYYMMDD (whole day), YYYYMM (whole month), YYYY (whole year)\nAlso natural language can be specified: like \'today\' or \'last month\'.')
  .option('-i, --show-id', 'Show each event ID.')
  .option('-m, --max <max results>', 'Maximum number of events returned. Up to 2500. Default: 250.')
  .option('-f, --from <date>', 'Lower bound (inclusive) for an event\'s end time to filter by.\nFormat: YYYYMMDD or YYYYMMDD-hh:mm\n(ignored if \'term\' is specified')
  .option('-t, --to <date>', 'Upper bound (exclusive) for an event\'s start time to filter by.\nFormat: YYYYMMDD or YYYYMMDD-hh:mm\n(ignored if \'term\' is specified')
  .option('-o, --order <order>', `'The order of the events returned in the result. updated' or 'startTime'. Default: ${conf.LIST_ORDER}.`)
  .types({
    string: ['f', 'from', 't', 'to']
  })
  .action(function (args, callback) {
    // set initial and default params
    const params = {
      calendarId: conf.CALENDAR_ID,
      singleEvents: true,
      orderBy: args.options['order'] || conf.LIST_ORDER
    };

    if (args.options['max']) {
      params.maxResults = args.options['max'];
    }

    if (args.term) {
      // convert to string in case of number
      const term = typeof args.term === 'number' ? args.term.toString() : args.term;
      if (isNaN(term)) {
        if (!terms.fixedTerms[term]) {
          this.log('Unsupported string, refer to the docs to check the available ones.');
          return callback();
        }
        [params.timeMin, params.timeMax] = terms.fixedTerms[term]();
      } else {
        [params.timeMin, params.timeMax] = terms.calculateTerm(term);
      }
    } else {
      const from = args.options['from'];
      const to = args.options['to'];
      if (from) {
        params.timeMin = moment(from).format();
      }
      if (to) {
        params.timeMax = moment(from).format();
      }
      if (!from && !to) {
        [params.timeMin, params.timeMax] = terms.fixedTerms['today']();
      }
    }

    calendar.events.list(params, (err, response) => {
      if (err) {
        this.log('The API returned an error: ' + err);
        return callback();
      }

      const events = response.items;
      if (events.length === 0) {
        return callback('No upcoming events found.');
      }
      this.log('Upcoming events:');
      events.forEach(event => {
        let start;
        if (event.start.dateTime) {
          start = moment(event.start.dateTime).format(conf.START_DATETIME_FORMAT);
        } else {
          start = moment(event.start.date).format(conf.START_DATE_FORMAT);
        }
        if (args.options['show-id']) {
          this.log(`${start} - ${chalk.bold(event.summary)} (${event.id})`);
        } else {
          this.log(`${start} - ${chalk.bold(event.summary)}`);
        }
      });
      callback();
    });
  });

cli.command('insert <date> [start] [duration]', `Insert event.\nAn All-day-event of one day duration will be inserted if [start] is not specified.\nDefault duration for non All-day-event: ${conf.EVENT_DURATION}`)
  .action(function (args, callback) {
    const event = {};
    const startDate = moment(args.date, 'YYYYMMDD').format('YYYY-MM-DD');
    if (args.start) {
      const startDateTime = moment(`${startDate} ${args.start}`).format();
      event.start = { dateTime: startDateTime };
      const duration = args.duration || conf.EVENT_DURATION;
      event.end = { dateTime: moment(startDateTime).add(duration, 'minutes').format() };
    } else {
      event.start = { date: startDate };
      event.end = { date: startDate };
    }

    this.prompt({
      type: 'input',
      name: 'title',
      message: 'Insert event title: ',
    }, result => {
      event.summary = result.title;
      const params = {
        calendarId: conf.CALENDAR_ID,
        resource: event,
      };
      calendar.events.insert(params, (err, response) => {
        if (err) {
          this.log('The API returned an error: ' + err);
          return callback();
        }
        this.log(`Event created: ${response.htmlLink}`);
        callback();
      });
    });
  });

cli.command('remove-token', 'Remove token.')
  .action(function (args, callback) {
    fs.unlinkSync(conf.TOKEN_PATH);
    this.log(`Token removed (${conf.TOKEN_PATH})`);
    cli.exec('exit');
  });

cli.command('delete <id>', 'Delete event.')
  .action(function (args, callback) {
    const params = {
      calendarId: conf.CALENDAR_ID,
      eventId: args.id,
    };

    calendar.events.delete(params, err => {
      if (err) {
        this.log('The API returned an error: ' + err);
        return callback();
      }
      console.log('Event deleted.');

      callback();
    });
  });

cli
  .delimiter(chalk.magenta('gcal>'))
  .exec('setup', function (err) {
    if (err) {
      this.log(err);
      process.exit(1);
    }
    cli.show();
  });

/**
 * Store token to disk to be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
const storeToken = token => {
  try {
    fs.mkdirSync(conf.TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(conf.TOKEN_PATH, JSON.stringify(token));
  console.log(`Token stored to ${conf.TOKEN_PATH}`);
}
