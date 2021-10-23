const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { MASTER_SHEET_ID } = require("./config/sheet-ids");
const SpreadSheet = require("./spreadsheet");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "sheets/config/token.json";
const CREDENTIALS_PATH = "sheets/config/credentials.json";

const auth = getAuth();

function getAuth() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log("Error loading client secret file:");
    return null;
  }
  const credentials = fs.readFileSync(CREDENTIALS_PATH);
  return authorize(JSON.parse(credentials));
}

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  if (!fs.existsSync(TOKEN_PATH)) return getNewToken(oAuth2Client);

  const token = fs.readFileSync(TOKEN_PATH);
  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
    });
  });
}

// Spreadsheets
const MasterSheet = new SpreadSheet(google, auth, MASTER_SHEET_ID);

module.exports = {
  MasterSheet,
};
