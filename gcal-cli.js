'use strict';

var fs = require('fs');
var google = require('googleapis');
var conf = require('./conf');
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var calendar;

fs.readFile('client_secret.json', function(err, content) {
  if (err) {
    throw err;
  }

  var credentials = JSON.parse(content);
  var clientId = credentials.installed.client_id;
  var clientSecret = credentials.installed.client_secret;
  var redirectUrl = credentials.installed.redirect_uris[0];

  var oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
  calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  fs.readFile(conf.TOKEN_PATH, function(err, tokens) {
    if (err && err.code === 'ENOENT') {
      // a) no token stored
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: conf.SCOPES
      });
      // Url to a consent page.
      console.log('Authorize this app by visiting this url: ', authUrl);

      rl.question('Enter the code from that page here: ', function(code) {
        // Retrieve access token.
        oauth2Client.getToken(code, function(err, tokens) {
          if (err) {
            console.log('Error while trying to retrieve access token');
            throw err;
          }

          oauth2Client.setCredentials(tokens);
          storeToken(tokens);
          cli();
        });
      });
    } else if (err) {
      // b) unknown error.
      throw err;
    } else {
      // c) token is already stored.
      oauth2Client.setCredentials(JSON.parse(tokens));
      oauth2Client.refreshAccessToken(function(err) {
        if (err) {
          throw err;
        }

        cli();
      });
    }
  });
});

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
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
 * Command line interface.
 */
function cli() {
  rl.setPrompt('gcal> ');
  rl.prompt();

  rl.on('line', function(line) {
    var args = line.trim().split(' ');
    var commandName = args.splice(0, 1)[0]; // Return and delete command name, leaving the arguments(if any).
    switch(commandName) {
      case 'list':
        var maxResults, date, showId;
        for (var i = 0; i < args.length; i++) {
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
function listEvents(maxResults, date, showId) {
  // Default params (except maxResults).
  var params = {
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
      var year = parseInt(date.substring(4, 6));
      var month = parseInt(date.substring(0, 4));
      params.timeMin = (new Date(year, month - 1)).toISOString();
      params.timeMax = (new Date(year, month, 0)).toISOString();
    } else if (date.length === 4) {
      // format YYYY (The whole year)
      params.timeMin = (new Date(date, 0, 1)).toISOString();
      params.timeMax = (new Date(parseInt(date) + 1, 0, 0)).toISOString();
    } else if (date.length === 2 || date.length === 1) {
      // format MM or M (Current Year and specified month)
      var currentYear = new Date().getFullYear();
      params.timeMin = (new Date(currentYear, parseInt(date) - 1)).toISOString();
      params.timeMax = (new Date(currentYear, date, 0)).toISOString();
    }
  }

  calendar.events.list(params, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      rl.resume();
      rl.prompt();
      return;
    }

    var events = response.items;
    if (events.length === 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
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
function insertEvent(args) {
  var event = {};

  if (args.length === 0) {
    // Default: current date, all-day-event)
    var d = new Date();
    var currentDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    event.start = {
      date: currentDate
    };
    event.end = event.start;
    console.log('Default date: ' + currentDate + ' (all-day-event).');
  } else {
    var year = args[0].substring(0, 4);
    var month = args[0].substring(4, 6);
    var day = args[0].substring(6, 8);

    if (args.length === 3 || args.length === 2) {
      var hours = args[1].substring(0, 2);
      var minutes = args[1].substring(2, 4);
      var duration = args[2] || conf.EVENT_DURATION;

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

  rl.question('Insert event title:\n', function(code) {
    event.summary = code;

    var params = {
      calendarId: conf.CALENDAR_ID,
      resource: event,
    };

    calendar.events.insert(params, function(err, response) {
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
function deleteEvent(eventId) {

  var params = {
    calendarId: conf.CALENDAR_ID,
    eventId: eventId,
  };

  calendar.events.delete(params, function(err) {
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
 * Remove previously stored token.
 */
function removeToken() {
  fs.unlinkSync(conf.TOKEN_PATH);
  console.log('Token removed (' + conf.TOKEN_PATH + ')');
  process.exit(0);
}