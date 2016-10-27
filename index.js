'use strict';

// requires
const fs = require('fs');
const google = require('googleapis');
const conf = require('./conf');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let calendar;

// Authorize app and call cli
let content;
try {
  content = fs.readFileSync('client_secret.json');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('Some information about your Google Account is needed to be able to do the authorization.');
    console.log('This information can be found in the Developer Console, clicking your project --> APIs & auth --> credentials.');
    console.log('Download the JSON file from the Developer Console to the root directory of this repo and rename it client_secret.json.');
    process.exit(0);
  }
  console.log('Error while trying to retrieve client secret');
  throw err;
}

const credentials = JSON.parse(content).installed;
const clientId = credentials.client_id;
const clientSecret = credentials.client_secret;
const redirectUrl = credentials.redirect_uris[0];

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

let tokens;
try {
  tokens = fs.readFileSync(conf.TOKEN_PATH);
  // a) token is already stored.
  oauth2Client.setCredentials(JSON.parse(tokens));
  oauth2Client.refreshAccessToken( err => {
    if (err) {
      console.log('Error while trying to refresh access token');
      throw err;
    }
    calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    cli();
  });
} catch (err) {
  if (err.code === 'ENOENT') {
    // b) no token stored
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: conf.SCOPES
    });
    // Url to a consent page.
    console.log('Authorize this app by visiting this url: ', authUrl);

    rl.question('Enter the code from that page here: ', code => {
      // Retrieve access token.
      oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
          console.log('Error while trying to retrieve access token from Google');
          throw err;
        }

        oauth2Client.setCredentials(tokens);
        storeToken(tokens);
        calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        cli();
      });
    });
  } else {
    // c) unknown error.
    console.log('Error while trying to retreieve token from your computer');
    throw err;
  }
}

/**
 * Command line interface.
 */
const cli = () => {
  rl.setPrompt('gcal> ');
  rl.prompt();

  rl.on('line', line => {
    const args = line.trim().split(' ');
    const commandName = args.splice(0, 1)[0]; // Return and delete command name, leaving the arguments(if any).
    switch(commandName) {
      case 'list':
        let maxResults;
        let date;
        let showId;
        for (let i = 0; i < args.length; i++) {
          maxResults = args[i] === '-m' ? args[i+1] : maxResults;
          date = args[i] === '-d' ? args[i+1] : date;
          showId = args[i] === '-i' ? true : showId;
        }
        return listEvents(maxResults, date, showId);
      case 'insert':
        return insertEvent(args);
      case 'delete':
        return deleteEvent(args[0]);
      case 'removeToken':
        return removeToken();
      case 'exit':
        process.exit(0);
        break;
      case 'help':
        console.log('list [-i] [-m <max results>] [-d <date>] (Date format: YYYYMM or YYYY or MM or M');
        console.log('insert <YYYYMMDD> [<start time: hhmm>] [<duration in minutes>] (Default: current date, all-day-event)');
        console.log('delete <event id>');
        console.log('removeToken (Remove token stored in the file system');
        rl.prompt();
        break;
      default:
        console.log('Command not found. Type \'help\' to get a list of commands.');
        rl.prompt();
        break;
    }
  });
}

/**
 * Lists events.
 * @param {Number} maxResults Max amount of events.
 * @param {Number} date Date in format YYYYMM | YYYY | MM | M
 * @param {Boolean} showId Flag to indicate if event Id is displayed
 */
const listEvents = (maxResults, date, showId) => {
  // Default params (except maxResults).
  const params = {
    calendarId: conf.CALENDAR_ID,
    timeMin: conf.eventList.TIME_MIN,
    maxResults: maxResults || conf.eventList.MAX_RESULTS,
    singleEvents: true,
    orderBy: 'startTime'
  };

  // In case of a date is specified it's added to params
  if (date) {
    if (date.length === 6) {
      // format YYYYYMM (Specified year and month)
      const year = parseInt(date.substring(4, 6));
      const month = parseInt(date.substring(0, 4));
      params.timeMin = (new Date(year, month - 1)).toISOString();
      params.timeMax = (new Date(year, month, 0)).toISOString();
    } else if (date.length === 4) {
      // format YYYY (The whole year)
      params.timeMin = (new Date(date, 0, 1)).toISOString();
      params.timeMax = (new Date(parseInt(date) + 1, 0, 0)).toISOString();
    } else if (date.length === 2 || date.length === 1) {
      // format MM or M (Current Year and specified month)
      const currentYear = new Date().getFullYear();
      params.timeMin = (new Date(currentYear, parseInt(date) - 1)).toISOString();
      params.timeMax = (new Date(currentYear, date, 0)).toISOString();
    }
  }

  calendar.events.list(params, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      rl.resume();
      rl.prompt();
      return;
    }

    const events = response.items;
    if (events.length === 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming events:');
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
        if (showId) {
          console.log('###Event ID: %s', event.id);
        }
      }
    }
    rl.prompt();
  });
}

/**
 * Insert event.
 * @param {String[]} args Arguments: YYYYMMDD [start time: hhmm] [duration in minutes]
 */
const insertEvent = args => {
  const event = {};

  if (args.length === 0) {
    // Default: current date, all-day-event)
    const d = new Date();
    const currentDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    event.start = {
      date: currentDate
    };
    event.end = event.start;
    console.log('Default date: ' + currentDate + ' (all-day-event).');
  } else {
    const year = args[0].substring(0, 4);
    const month = args[0].substring(4, 6);
    const day = args[0].substring(6, 8);

    if (args.length === 3 || args.length === 2) {
      const hours = args[1].substring(0, 2);
      const minutes = args[1].substring(2, 4);
      const duration = args[2] || conf.EVENT_DURATION;

      event.start = {
        dateTime: new Date(year, month - 1, day, hours, minutes)
      };
      event.end = {
        dateTime: new Date(year, month - 1, day, hours, minutes + duration)
      };
    } else if (args.length === 1) {
      event.start = {
        date: year + '-' + month + '-' + day
      };
      event.end = {
        date: year + '-' + month + '-' + day
      };
    }
  }

  rl.question('Insert event title:\n', code => {
    event.summary = code;

    const params = {
      calendarId: conf.CALENDAR_ID,
      resource: event,
    };

    calendar.events.insert(params, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        rl.prompt();
        return;
      }
      console.log('Event created: %s', response.htmlLink);

      rl.prompt();
    });
  });
}

/**
 * Insert event.
 * @param {String} eventId Event ID.
 */
const deleteEvent = eventId => {

  const params = {
    calendarId: conf.CALENDAR_ID,
    eventId: eventId,
  };

  calendar.events.delete(params, err => {
    if (err) {
      console.log('The API returned an error: ' + err);
      rl.prompt();
      return;
    }
    console.log('Event deleted.');

    rl.prompt();
  });
}

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
  console.log('Token stored to ' + conf.TOKEN_PATH);
}

/**
 * Remove previously stored token.
 */
const removeToken = () => {
  fs.unlinkSync(conf.TOKEN_PATH);
  console.log('Token removed (' + conf.TOKEN_PATH + ')');
  process.exit(0);
}
