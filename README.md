# Google Calendar Command Line Interface

Command line based application running in node.js that allows access to Google Calendar API. This application basically uses the official Google's [node.js client library][googleapis]. Supports authorization and authentication with OAuth 2.0.

Still in a early stage, issues or PRs with desired functionality or fixes are appreciated.

### Authorizing

* Before running the app for the first time: You may need CLIENT_ID, CLIENT_SECRET and REDIRECT_URL. This information can be found going to the [Developer Console][dev-console], clicking your project --> APIs & auth --> credentials. Download the JSON file from the Developer Console to your working directory and rename it client_secret.json.

* Running the app for the first time: It will prompt you to authorize access, follow the instructions.

### Installation

Just clone it in your machine or install it globaly using npm.

``` sh
$ npm install cli-gcal -g
```

### Usage

Type 'help' to get a list of commands

##### List events

list [\-i] [-m < max results >] [-d < date >] 

Date format: YYYYYMM (Specified year and month), YYYY (The whole year) or MM or M (Current Year and specified month).

##### Insert events
insert < YYYYMMDD > [< start time: hhmm >] [< duration in minutes >] 

Default: current date, all-day-event

##### Delete event
delete < event id >

##### Remove token stored in the file system
removeToken 


### References

* [Google Calendar API Reference][cal-api]
* [Google APIs Node.js Client][googleapis]
* [Google Calendar API Node.js quickstart (Auth based in this code)][quickstart]


[dev-console]: https://console.developer.google.com/
[googleapis]: https://github.com/google/google-api-nodejs-client
[cal-api]: https://developers.google.com/google-apps/calendar/v3/reference/events/list
[quickstart]: https://developers.google.com/google-apps/calendar/quickstart/nodejsnodejs