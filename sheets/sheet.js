const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { MASTER_SHEET_ID } = require("./config/sheet-ids");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "sheets/config/token.json";
const CREDENTIALS_PATH = "sheets/config/credentials.json";

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

  async findOne({ range }, filterQueryObj) {
    const filteredData = await this.findMany({ range }, filterQueryObj);

    if (filteredData === null) return null;

    // Warn the user if the query returns multiple results, which is not the intended usage of findOne
    if (filteredData.length > 1) {
      const filterParamsStr = Object.entries(filterQueryObj)
        .map(([key, value]) => {
          return `${key}: ${value}`;
        })
        .join(", ");
      console.warn(
        `findOne returned ${filteredData.length} results, when using queries: ${filterParamsStr}. Try using findMany() when querying for multiple results`
      );
    }

    // Return the first value
    return filteredData[0];
  }

  async findMany({ range }, filterQueryObj) {
    const dataArray = await this.listMany({ range });

    try {
      if (dataArray === null)
        throw {
          type: "Filter Error",
          message: "Response returned null",
        };

      // Check to see if every filter criteria is a valid key in object
      const invalidFilterQuery =
        Object.keys(filterQueryObj).find((key) => {
          return !dataArray[0].hasOwnProperty(key);
        }) ?? null;

      if (invalidFilterQuery !== null)
        throw {
          type: "Filter Error",
          message: `Invalid filter query ${invalidFilterQuery}`,
        };
    } catch (error) {
      if (error?.type === "Filter Error") {
        console.error(`Filter Error: ${error.message}`);
        return null;
      }
    }

    const filteredData = dataArray.filter((dataObj) => {
      return Object.entries(filterQueryObj).every(([key, value]) => {
        // Google sheets API always returns strings, so only ==
        return dataObj[key] == value;
      });
    });

    return filteredData;
  }

  listOne() {}

  async listMany({ range }) {
    try {
      const response = await this.getSheetValues().get({
        spreadsheetId: this._sheetID,
        range: range,
      });
      const {
        data: { values },
      } = response;

      // Response values are empty, only tableHeaders
      if (values.length === 1) return [];

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
