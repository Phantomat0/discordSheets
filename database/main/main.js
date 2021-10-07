const { MasterSheet } = require("../../sheets/sheet");
const RegistrationManager = require("./registration");
const DatabaseError = require("../../sheets/errors");

const SHEET_TABLES = {
  PLAYERS: {
    name: "players",
    range: "players!A1:E",
  },
  PLAYERS_DISCORD: {
    name: "players_discord",
    range: "players_discord!A1:D",
  },
  PLAYERS_SIGNUP: {
    name: "players_signup",
    range: "players_signup!A1:G",
  },
  TEAMS: {
    name: "teams",
    range: "teams!A1:H",
  },
  TEST: {
    name: "stuff",
    range: "stuff!A1:B",
  },
};

class MasterSheetManager {
  constructor(sheetObj, sheets) {
    this._sheet = sheetObj;
    this._sheetTables = sheets;
  }

  async test() {
    return await this._sheet.listMany(this._sheetTables.TEST);
  }

  async getSignUps() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS_SIGNUP);
  }

  async getFreeAgents() {
    return await this._sheet.findMany(this._sheetTables.PLAYERS_SIGNUP, {
      is_waiver: {
        value: 0,
      },
    });
  }

  async updatePlayerTeam(playerID, teamID) {
    return await this._sheet.findOneAndUpdate(
      SHEET_TABLES.PLAYERS,
      [teamID],
      {
        player_id: {
          value: playerID,
        },
      },
      { header: "current_team_id" }
    );
  }

  async getDiscordUsers() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS_DISCORD);
  }

  async getPlayers() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS);
  }

  async getPlayerByID(playerID) {
    return await this._sheet.findOne(this._sheetTables.PLAYERS, {
      player_id: {
        value: playerID,
      },
    });
  }

  async getTeam(teamID) {
    return await this._sheet.findOne(this._sheetTables.TEAMS, {
      team_id: {
        value: teamID,
      },
    });
  }

  async getManagersTeam(managerID) {
    return await this._sheet.findOne(this._sheetTables.TEAMS, {
      manager_player_ids: {
        value: managerID,
        isArraySearch: true,
      },
    });
  }

  async getTeamsAffiliate(teamID) {
    return await this._sheet.findOne(this._sheetTables.TEAMS, {
      team_id: {
        value: teamID,
      },
    });
  }

  async getPlayersByTeam(teamID) {
    return await this._sheet.findMany(this._sheetTables.PLAYERS, {
      current_team_id: {
        value: teamID,
      },
    });
  }

  async getPlayerByDiscordID(discordID) {
    const discordProfile = await this._sheet.findOne(
      this._sheetTables.PLAYERS_DISCORD,
      {
        discord_id: {
          value: discordID,
        },
      }
    );

    const { player_id } = discordProfile;

    return await this._sheet.findOne(this._sheetTables.PLAYERS, {
      player_id: {
        value: player_id,
      },
    });
  }

  async getLastestPlayerID() {
    const playersArray = (await this.getPlayers()) ?? [];

    return playersArray.length;
  }

  async getDiscordByPlayerID(discordID) {
    return await this._sheet.findOne(this._sheetTables.PLAYERS_DISCORD, {
      player_id: {
        value: discordID,
      },
    });
  }

  async checkIfAlreadySignedUp(id) {
    const playerSignUp = await this._sheet.findOne(
      this._sheetTables.PLAYERS_SIGNUP,
      {
        player_id: {
          value: id,
        },
      },
      false
    );

    if (playerSignUp === null) return false;
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
