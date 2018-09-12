const argv = require('minimist')(process.argv.slice(2));
const conf = require('./conf');
const help = require('./help');
const {errHandler, generateUrl, insert, list, bulk, storeToken} = require('./index');
const path = require('path');

/**
 * Get absolute path
 * @param {string} rawPath
 */
const getPath = (rawPath) => {
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  } else {
    return path.join(process.cwd(), rawPath);
  }
};

// main
(async function () {
  const command = argv._[0];
  const configPath = argv.config || argv.C;
  if (configPath) {
    const configFile = require(getPath(configPath));
    Object.assign(conf, configFile);
  }
  switch (command) {
    case 'generateUrl': {
      await generateUrl();
      break;
    }
    case 'storeToken': {
      const code = argv._[1];
      await storeToken(code);
      break;
    }
    case 'list': {
      const naturalInfo = argv._[1];
      const params = {
        from: argv.from || argv.f,
        to: argv.to || argv.t,
        showId: argv['show-id'] || argv.i
      };
      await list(naturalInfo, params);
      break;
    }
    case 'insert': {
      const naturalInfo = argv._[1];
      const params = {
        summary: argv.summary || argv.s,
        date: argv.date || argv.d,
        time: argv.time || argv.t,
        duration: argv.duration || argv.D
      };
      await insert(naturalInfo, params);
      break;
    }
    case 'bulk': {
      const eventsPath = getPath(argv.events || argv.e);
      await bulk(eventsPath);
      break;
    }
    case 'help': {
      console.log(help);
      break;
    }
    default: {
      console.log('Command not found\n');
      console.log(help);
      break;
    }
  }
})().catch(err => errHandler(err, argv.debug));
