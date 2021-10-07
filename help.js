const chalk = require('chalk');

module.exports =
`${chalk.bold('Usage:')}
  gcal [-C <file>] [cmd] [--debug]

      OPTIONS
          -C, --config <file>
          --debug

${chalk.bold('Commands')}:

  ${chalk.bold('list')} [<term> | [-f <date | datetime>] [-t <date | datetime>]] [-i]
      List events. By default it shows today events (executed without arguments).

      OPTIONS
          -f, --from <date | datetime>

          -t, --to <date | datetime>

          -i, --show-id


  ${chalk.bold('insert')} <term> | -s <summary> -d <date> [-t <time>] [-D <duration>]
      Insert events. <term> is specified in natural language, in case it's not specified,
      -s and -d are mandatory.

      OPTIONS
          -s, --summary <summary>

          -d, --date <date>

          -t, --time <time>

          -D, --duration <duration>


  ${chalk.bold('bulk')} -e <file>
      Bulk insert of events. File can be .json or .js.

      OPTIONS
          -e, --events <file>


  ${chalk.bold('generateUrl')}
      Generate consent page URL. In order to work client_secret.json must be in your
      home folder.


  ${chalk.bold('storeToken')} <code>
      Store Token in your home folder.


  ${chalk.bold('help')}
      Show this help page.
`;
