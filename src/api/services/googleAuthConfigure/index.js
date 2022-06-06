const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// import and create a random number using uuid
const uuidv4 = require('uuid/v4');
// create random nukber using uuid

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = (credentials, data, callback) => new Promise((resolve, reject) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0],
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, async (err, token) => {
    if (err) {
      const response = await getAccessToken(oAuth2Client, data, callback);
      console.log('authorize1', response);
      resolve(response);
    }
    await oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, data)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
  });
});

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken(oAuth2Client, data, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
        if (error) return console.error(error);
        console.log('Token stored to', TOKEN_PATH);
      });
      const response = await callback(oAuth2Client, data);
      console.log('getaccesstoken', response);
      return response;
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
let result;
const createEvent = async (auth, { email, question }) => {
  const calendar = google.calendar({ version: 'v3', auth });
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nextDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
  const nextDateString = nextDate.toISOString();
  const event = {
    summary: `codebuddy - ${question.title}`,
    description: question.description,
    start: {
      dateTime: currentDateString,
      timeZone: timezone,
    },
    end: {
      dateTime: nextDateString,
      timeZone: timezone,
    },
    attendees: [
      { email },
    ],
    conferenceData: {
      createRequest: {
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
        requestId: uuidv4(),
      },
    },
  };
  await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    resource: event,
  }).then((eventResponse) => {
    result = eventResponse.data;
  }).catch((err) => {
    throw err;
  });
  return result;
};

exports.authorizeGCPAndCreateEvent = (email, question) => new Promise((resolve, reject) => {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), { email, question }, createEvent).then((response) => {
      resolve(response);
    }).catch((error) => {
      reject(error);
    });
  });
});
