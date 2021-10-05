const { MasterSheet } = require("../../sheets/sheet");
const RegistrationManager = require("./registration");

const SHEET_TABLES = {
  PLAYERS: {
    range: "players!A2:E",
  },
  PLAYERS_DISCORD: {
    range: "players_discord!A2:D",
  },
  PLAYERS_SIGNUP: {
    range: "players_signup!A2:F",
  },
};

class MasterSheetManager {
  constructor(sheetObj, sheets) {
    this._sheet = sheetObj;
    this._sheetTables = sheets;
  }

  async getSignUps() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS_SIGNUP);
  }

  async getDiscordUsers() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS_DISCORD);
  }

  async getPlayers() {
    const x = await this._sheet.listMany(this._sheetTables.PLAYERS);
    return x;
  }

  async getPlayerByDiscordID(id) {
    const discordPlayersResponse = await this._sheet.findOne(
      this._sheetTables.PLAYERS_DISCORD,
      1,
      id
    );

    if (discordPlayersResponse === null) return null;
    const { row } = discordPlayersResponse;

    const [playerID] = row;

    const playersResponse = await this._sheet.findOne(
      this._sheetTables.PLAYERS,
      0,
      playerID
    );

    if (playersResponse === null) return null;

    return playersResponse.row;
  }

  async getLastestPlayerID() {
    const playersArray = (await this.getPlayers()) ?? [];

    return playersArray.length;
  }

  async getDiscordByPlayerID(id) {
    const discordResponse = await this._sheet.findOne(
      this._sheetTables.PLAYERS_DISCORD,
      0,
      id
    );

    if (discordResponse === null) return null;

    return discordResponse.row[1];
  }

  async checkIfAlreadySignedUp(id) {
    const signUpPlayerRes = await this._sheet.findOne(
      this._sheetTables.PLAYERS_SIGNUP,
      0,
      id
    );

    if (signUpPlayerRes === null) return false;
    return true;
  }

  async registerSignUp(signUpObj) {
    const { discordID, playerName, availability } = signUpObj;

    // If the player already has an account, we use his ID, else make a new one
    function getPlayerID() {
      if (playerAccount) {
        const [id] = playerAccount;
        return id;
      }
      return newPlayerId;
    }

    const playerAccount = await this.getPlayerByDiscordID(discordID);

    const newPlayerId = (await this.getLastestPlayerID()) + 1;

    const registerManager = new RegistrationManager(
      getPlayerID(),
      signUpObj,
      this._sheetTables
    );

    registerManager.validatePlayerName().validateAvailability();

    // Check if the player already has an account
    if (playerAccount) {
      // We dont have to create a new player or a new discord ID

      const isAlreadyRegistered = await this.checkIfAlreadySignedUp(
        getPlayerID()
      );

      if (isAlreadyRegistered)
        throw {
          type: "Registration Error",
          message: "You are already registered for the current season!",
        };
    } else {
      const x = await registerManager.registerPlayer();
      x.registerDiscord();
    }

    // Last thing, check if that name is already used

    await registerManager.validateNameAlreadyUsed(playerName);

    await registerManager.registerSignUpApplication();
  }
}

const mainDatabase = new MasterSheetManager(MasterSheet, SHEET_TABLES);

module.exports = mainDatabase;
