# gcal

> Google Calendar command line tool for Node.js

Programmatic event listing, insert or bulk insert made easy:

<pre>
  <b>$ gcal insert 'Party tomorrow from 3pm to 5pm'</b>

   Party: 2017-09-08T15:00:00+09:00 ~ 2017-09-08T17:00:00+09:00
   https://www.google.com/calendar/event?eid=amNpMWE5cjg2bG80n2s0Nmg1ZWlqcW01OXMgdG9rYWdlcm9oQG0
</pre>

<pre>
  $ echo \
  '[{
    "calendarId": "primary", "resource": {
    "summary": "Party",
    "start": { "dateTime": "2017-09-08T20:00" },
    "end": { "dateTime": "2017-09-08T22:00" }}
  },{
    "calendarId": "primary", "resource": {
    "summary": "Party again",
    "start": { "dateTime": "2017-09-08T22:00" },
    "end": { "dateTime": "2017-09-08T23:30" }}
  }]' \
  > events.js

  <b>$ gcal bulk -e events.json</b>

   Event inserted
    id: gif4hl86kgt7bmgq2ojvteqe2o
    summary: Party
    htmlLink: https://www.google.com/calendar/event?eid=Z2lmNGhsODZrZ3Q3Ym1ncTJvanZ0ZXFlMm8gdG9rYWdlcm9oQG0
   Event inserted
    id: blrrb8kbrih3pq9mn10slii8ac
    summary: Party again
    htmlLink: https://www.google.com/calendar/event?eid=YmxycmI4a2JyaWgzcHE5bW4xMHNsaWk4YWMgdG9rYWdlcm9oQG0
</pre>

<pre>
  <b>$ gcal list</b>

   Upcoming events (2017-09-07T00:00:00+09:00 ~ 2017-09-07T23:59:59+09:00)
    2017-09-07 20:00 - My favorite TV show
    2017-09-07 22:30 - Prepare tomorrow's meeting stuff
</pre>

## Installation

Install it as a global module:

```
npm install -g gcal
```

## Authentication

Authorization and authentication is done with OAuth 2.0. 

Ok, this will take only 2 minutes:

#### 1) Get your project credentials

You will need a file with your credentials: `client ID`, `client secret` and `redirect URI`. This can be obtained in the [Developer Console](https://console.developer.google.com):

- Go to your project
- Click in `Credentials`
- Click `Create credentials` → `OAuth client ID`
- Download the JSON file

#### 2) Generate consent page URL

Once we got the credentials we must generate a consent page URL.

```
$ gcal generateUrl
```

([By default](#overwriting-default-config) the credentials will be searched in your home directory under the name `client_secret.json`)

The page will prompt you to authorize access, follow the instructions.

#### 3) Get the token!

With the code we got through the authorization page, we can obtain a token and store it in our machine.

```
$ gcal storeToken <code>
```

([By default](#overwriting-default-config) the token is stored in your home folder under the name `calendar_api_token.json`. NOTE: The token will expiry after one hour, but a `refresh_token` is included as well, allowing the app to refresh automatically the token each time it's used)

With this we are good to go. The stored token and credentials files will be required from now on to use this tool.

## Usage

### List

List today events:

```
$ gcal list
```

List events using natural language (powered by [Sherlock](https://github.com/neilgupta/Sherlock):

```
$ gcal list tomorrow
```

```
$ gcal list 'from 03/23/2017 to 03/27/2017'
```

```
$ gcal list 'from March 23th to 27th'
```

Or with specific ISO dates:

```
$ gcal list -f 2017-03-23 -t 2017-03-27
```

### Insert

Insert events using natural language:

```
$ gcal insert 'Party tomorrow from 3pm to 5pm'
```

Insert events specifying the parameters:

```
$ gcal insert -s 'Party' -d 2017-03-23 -t 15:00 -D 2h
```

### Bulk Insert

Bulk insert passing a `.js` or `.json` file:

`events.json`
```json
[{
  "calendarId": "primary",
  "resource": {
    "summary": "Having coffee with Okuyasu",
    "location": "Morio City",
    "description": "I'm not very imaginative now so some description goes here",
    "start": {
      "dateTime": "2017-09-08T09:00:00"
    },
    "end": {
      "dateTime": "2017-09-08T10:00:00"
    }
  }
}, {
  "calendarId": "primary",
  "resource": {
    "summary": "Defeat Dio",
    "location": "179 Orouba St, Cairo",
    "description": "Dio is a bad boy so I need to kick his ass asap",
    "start": {
      "date": "1987-06-01"
    },
    "end": {
      "date": "1987-06-12"
    }
  }
}]
```
```
gcal bulk -e ./events.json
```

Using a `.js` file can be useful for relative dates and more:

`events.js`
```js
const today = new Date();
today.setHours('17', '00', '00');
const tomorrow = new Date(today.getTime()+1000*60*60*24);
module.exports = [{
  "calendarId": "primary",
  "resource": {
    "summary": `Release`,
    "start": {
      "dateTime": today.toISOString()
    },
    "end": {
      "dateTime": today.toISOString()
    }
  }
}, {
  "calendarId": "primary",
  "resource": {
    "summary": "Release",
    "start": {
      "dateTime": tomorrow.toISOString()
    },
    "end": {
      "dateTime": tomorrow.toISOString()
    }
  }
}];
```
```
gcal bulk -e ./events.js
```

The available properties are listed [here](https://developers.google.com/google-apps/calendar/v3/reference/events/insert).

### Overwriting default config

Using the option `-C <file>` the default config can be overwritten. This file must be `.js` or `.json`. Configurable options are located in [./conf.js](./conf.js).

Example:

`/somepath/config.json`
```json
{
  "CRED_PATH": "/my/secret/path/credentials.json",
  "TOKEN_PATH": "/my/secret/path/token.json"
}
```

```
gcal -C /somepath/config.json generateUrl
```

Doing this you can store your credential files wherever you want.

## API

Use the `help` command. More details will be added soon.

**`$ gcal help`**
```
Usage:
  gcal [-C <file>] [cmd] [--debug]

      OPTIONS
          -C, --config <file>
          --debug

Commands:

  list [<term> | [-f <date | datetime>] [-t <date | datetime>]] [-i]
      List events. By default it shows today events (executed without arguments).

      OPTIONS
          -f, --from <date | datetime>

          -t, --to <date | datetime>

          -i, --show-id


  insert <term> | -s <summary> -d <date> [-t <time>] [-D <duration>]
      Insert events. <term> is specified in natural language, in case it's not specified,
      -s and -d are mandatory.

      OPTIONS
          -s, --summary <summary>

          -d, --date <date>

          -t, --time <time>

          -D, --duration <duration>


  bulk -e <file>
      Bulk insert of events. File can be .json or .js.

      OPTIONS
          -e, --events <file>


  generateUrl
      Generate consent page URL. In order to work client_secret.js must be in your
      home folder.


  storeToken <code>
      Store Token in your home folder.


  help
      Show this help page.
```

## About version 0.3.0

Version 0.3.0 used an immersive-cli instead of shell commands. If you want to use it, go to the branch [0.3.0](https://github.com/toniov/gcal-cli/tree/0.3.0).

## License

MIT © [Antonio V](https://github.com/toniov)
