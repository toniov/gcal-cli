const conf = require('./conf');
const fs = require('fs');
const google = require('googleapis');

/**
 * Get Oauth2 Client
 */
const getOauth2Client = module.exports.getOauth2Client = () => {
  const content = fs.readFileSync(conf.CRED_PATH);
  const {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: redirectUris
  } = JSON.parse(content).installed;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);
};

/**
 * Get Calendar Client
 * @returns {Promise}
 */
module.exports = async () => {
  const oauth2Client = getOauth2Client();
  const tokens = fs.readFileSync(conf.TOKEN_PATH);
  oauth2Client.setCredentials(JSON.parse(tokens));
  return google.calendar({ version: 'v3', auth: oauth2Client });
};
