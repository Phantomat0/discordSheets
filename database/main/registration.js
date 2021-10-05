const { MasterSheet } = require("../../sheets/sheet");
class RegistrationManager {
  constructor(playerID, userObj, sheetTables) {
    this._user = {
      playerID,
      ...userObj,
    };
    this._sheetTables = sheetTables;
  }

  validatePlayerName() {
    const alphaNumericSpecialCharacters = new RegExp(/^[\000-\177]*$/);

    const validPlayerName = alphaNumericSpecialCharacters.test(
      this._user.playerName
    );

    if (!validPlayerName) {
      throw {
        type: "Registration Error",
        message:
          "The player name provided contains invalid special characters!",
      };
    }

    return this;
  }

  validateAvailability() {
    if (this._user.availability > 10 || this._user.availability < 1) {
      throw {
        type: "Registration Error",
        message: "Availability must be an integer between 1 and 10!",
      };
    }

    return this;
  }

  async validateNameAlreadyUsed(playerName) {
    playerName = playerName.toLowerCase();
    const signUpResponse = await MasterSheet.findOne(
      this._sheetTables.PLAYERS_SIGNUP,
      2,
      playerName
    );

    if (signUpResponse === null) return false;
    throw {
      type: "Registration Error",
      message: "That name is already in use!",
    };
  }

  async registerPlayer() {
    const { playerID, playerName } = this._user;

    const NO_TEAM_ID = 0;
    const timeStamp = Date.now();
    const timeStampStr = getDateTimeString();

    await MasterSheet.write(this._sheetTables.PLAYERS, [
      playerID,
      timeStamp,
      timeStampStr,
      playerName,
      NO_TEAM_ID,
    ]);

    return this;
  }

  async registerDiscord() {
    const { playerID, discordID, discordName, discordAvatarURL } = this._user;

    await MasterSheet.write(this._sheetTables.PLAYERS_DISCORD, [
      playerID,
      discordID,
      discordName,
      discordAvatarURL,
    ]);
    return this;
  }

  async registerSignUpApplication() {
    const { playerID, playerName, position, availability, info } = this._user;

    const timeStamp = Date.now();

    await MasterSheet.write(this._sheetTables.PLAYERS_SIGNUP, [
      playerID,
      timeStamp,
      playerName,
      position,
      availability,
      info,
    ]);

    return this;
  }
}

const getDateTimeString = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  });
};

module.exports = RegistrationManager;
