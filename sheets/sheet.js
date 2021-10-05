const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { MASTER_SHEET_ID } = require("./config.json");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "sheets/token.json";
const CREDENTIALS_PATH = "sheets/credentials.json";

class SpreadSheet {
  constructor(oAuth2Client, sheetID) {
    this._oAuth2Client = oAuth2Client;
    this._sheetID = sheetID;
  }

  getSheet() {
    return google.sheets({ version: "v4", auth: this._oAuth2Client });
  }

  getSheetValues() {
    return this.getSheet().spreadsheets.values;
  }

  async findOne({ range }, searchIndex, searchValue) {
    console.log(range, searchIndex, searchValue);
    const response = await this.getSheetValues().get({
      spreadsheetId: this._sheetID,
      range: range,
    });

    // If sheet is empty, there will be no values
    if (!response.data.hasOwnProperty("values")) return null;

    const {
      data: { values: table },
    } = response;

    const mappedArray = table.map((row, index) => {
      return {
        index: index,
        row: row,
        searchValue: row[searchIndex].toLowerCase(),
      };
    });

    const databaseRow =
      mappedArray.find((rowObj) => rowObj.searchValue === searchValue) ?? null;

    if (databaseRow === null) {
      console.log(
        `Could not find ${searchValue} using index: ${searchIndex} from range: ${range}`
      );
      return null;
    }

    return databaseRow;
  }

  findMany({ range }, searchIndex, searchValue) {}

  listOne() {}

  async listMany({ range }) {
    try {
      const response = await this.getSheetValues().get({
        spreadsheetId: this._sheetID,
        range: range,
      });
      const values = response.data.values;

      // Response values are empty
      if (values.length === 0) return null;

      const [tableHeaders, ...tableData] = values;

      // Format the tableData as an array of objects, with tableHeaders as the keys for each object
      const mappedData = tableData.map((player) => {
        return player.reduce((acc, val, index) => {
          acc[tableHeaders[index]] = val;
          return acc;
        }, {});
      });

      return mappedData;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async write({ range }, valueArray) {
    await this.getSheetValues().append({
      spreadsheetId: this._sheetID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [valueArray],
      },
    });
  }
}

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
const MasterSheet = new SpreadSheet(auth, MASTER_SHEET_ID);

module.exports = {
  MasterSheet,
};
