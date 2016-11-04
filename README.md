# Google Calendar Command Line Interface

Command line based application running in node.js that allows access to Google Calendar API. This application uses the official Google's [node.js client library][googleapis]. Supports authorization and authentication with OAuth 2.0.

Created using the amazing [Vorpal framework][vorpal].

Issues or PRs with desired functionality or fixes are appreciated.

### Authorizing

* Before running the app for the first time: You may need your client ID, client secret and redirect URI. This information can be found going to the [Developer Console][dev-console], clicking your project → APIs & auth → credentials. Download the JSON file from the Developer Console to the root directory of this project and rename it to client_secret.json.

* Running the app for the first time: It will prompt you to authorize access, follow the instructions.

### Installation

Just clone it in your machine and execute `index.js`.

```sh
$ git clone https://github.com/antonvs2/gcal-cli.git
$ cd gcal-cli
$ node index.js
```

### Usage

Type `help` to get a list of commands.

To see detailed help about each command type `commandName --help`.

Available commands:

- `list`
- `insert`
- `delete`
- `remove-token`
- `help`
- `exit`

### References

* [Google Calendar API Reference][cal-api]
* [Google APIs Node.js Client][googleapis]
* [Google Calendar API Node.js quickstart (Auth based in this code)][quickstart]

[dev-console]: https://console.developer.google.com
[googleapis]: https://github.com/google/google-api-nodejs-client
[cal-api]: https://developers.google.com/google-apps/calendar/v3/reference/events/list
[quickstart]: https://developers.google.com/google-apps/calendar/quickstart/nodejsnodejs
[vorpal]: http://vorpal.js.org
