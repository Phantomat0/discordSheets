const { MasterSheet } = require("../../sheets/sheet");

class RegistrationError {
  constructor(message) {
    this.name = `Registration Error`;
    this.type = "Registration Error";
    this.color = "#000000";
    this.message = message;
  }

  getMessage() {
    return `${this.type}: ${this.message}`;
  }
}
class RegistrationManager {
  constructor(playerID, userObj, sheetTables) {
    this._user = {
      playerID,
      ...userObj,
    };
    this._sheetTables = sheetTables;
  }

  async validateIfNotAlreadySignedUp() {
    const playerSignUp = await MasterSheet.findOne(
      this._sheetTables.PLAYERS_SIGNUP,
      {
        player_id: {
          value: this._user.playerID,
        },
      },
      false
    );

    console.log(playerSignUp);

    if (playerSignUp === null) return false;

    throw new RegistrationError(
      "You are already registered for the current season!"
    );
  }

  validatePlayerName() {
    const alphaNumericSpecialCharacters = new RegExp(/^[\000-\177]*$/);

    const validPlayerName = alphaNumericSpecialCharacters.test(
      this._user.playerName
    );

    if (!validPlayerName)
      throw new RegistrationError(
        "The player name provided contains invalid special characters!"
      );

    return this;
  }

  validateAvailability() {
    const AVAIL_MIN = 1;
    const AVAIL_MAX = 10;

    if (
      this._user.availability < AVAIL_MIN ||
      this._user.availability > AVAIL_MAX
    )
      throw new RegistrationError(
        `Availability must be an integer between ${AVAIL_MIN} and ${AVAIL_MAX}!`
      );

    return this;
  }

  async validateNameAlreadyUsed(playerName) {
    playerName = playerName.toLowerCase();
    const playerSignUp = await MasterSheet.findOne(
      this._sheetTables.PLAYERS_SIGNUP,
      {
        player_display_name: {
          value: playerName,
        },
      }
    );

    if (playerSignUp === null) return false;
    throw new RegistrationError(
      `Display name ${playerSignUp.player_display_name} is already in use`
    );
  }

  async registerPlayer() {
    const { playerID, playerName, discordID } = this._user;

    const NO_TEAM_ID = 0;
    const timeStamp = Date.now();
    const timeStampStr = getDateTimeString();

    await MasterSheet.write(this._sheetTables.PLAYERS, [
      playerID,
      timeStamp,
      timeStampStr,
      playerName,
      discordID,
      NO_TEAM_ID,
    ]);

    return this;
  }

  async registerSignUpApplication() {
    const { playerID, playerName, position, availability, info } = this._user;

    const IS_WAIVER = 1;

    const timeStamp = Date.now();

    await MasterSheet.write(this._sheetTables.PLAYERS_SIGNUP, [
      playerID,
      timeStamp,
      playerName,
      position,
      availability,
      info,
      IS_WAIVER,
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
