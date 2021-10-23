const { MasterSheet } = require("../../sheets/sheet");
const RegistrationManager = require("./registration");
const DatabaseError = require("../../sheets/errors");

const SHEET_TABLES = {
  PLAYERS: {
    name: "players",
    range: "players!A1:F",
  },
  PLAYERS_SIGNUP: {
    name: "players_signup",
    range: "players_signup!A1:G",
  },
  TEAMS: {
    name: "teams",
    range: "teams!A1:J",
  },
  WAIVERS: {
    name: "waiver-claims",
    range: "waiver-claims!A1:E",
  },
  FANTASY_TEAMS: {
    name: "fantasy-teams",
    range: "fantasy-teams!A1:S",
  },
  FANTASY_RANKINGS: {
    name: "fantasy-teams",
    range: "fantasy-teams!A1:T",
  },
  TEST: {
    name: "stuff",
    range: "stuff!A1:B",
  },
  CONFIG: {
    name: "config",
    range: "config!A1:H2",
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

  async getConfig() {
    return await this._sheet.listOne(this._sheetTables.CONFIG);
  }

  async getSignUps() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS_SIGNUP);
  }

  async getFantasyTeams() {
    return await this._sheet.listMany(this._sheetTables.FANTASY_TEAMS);
  }

  async getPlayerFantasy(playerID) {
    return await this._sheet.findMany(this._sheetTables.FANTASY_TEAMS, {
      player_id: {
        value: playerID,
      },
    });
  }

  async getFantasyTeamRankings() {
    const allTeams = await this._sheet.listMany(
      this._sheetTables.FANTASY_RANKINGS
    );

    // Remove rosters
    const statsOnly = allTeams.filter((team) => team.name === "stats");

    const players = await this.getPlayers();

    return statsOnly.map((team) => {
      const playerName = players.find(
        (player) => player.player_id === team.player_id
      ).player_name;
      return {
        playerName,
        teamName: team.team_name,
        totalPoints: team.total_points,
      };
    });
  }

  async updatePlayerFantasyRoster(playerID, newRosterArray) {
    const config = await this.getConfig();
    const currentWeek = config.fantasy_week;

    this._sheet.findOneAndUpdate(
      this._sheetTables.FANTASY_TEAMS,
      newRosterArray,
      {
        player_id: {
          value: playerID,
        },
        name: {
          value: "roster",
        },
      },
      { header: `week${currentWeek}_player1` }
    );
  }

  async getPlayerFantasyCurrent(playerID) {
    const config = await this.getConfig();
    const currentWeek = config.fantasy_week;

    const fantasyTeam = await this.getPlayerFantasy(playerID);

    // This player doesnt have a fantasy team
    if (fantasyTeam.length === 0) return null;

    const [roster, stats] = fantasyTeam;

    const { team_name } = roster;

    const rosterArray = [];

    // Maps the two arrays into one object
    for (let i = 0; i < 4; i++) {
      const currentPlayerStr = `player${i + 1}`;
      rosterArray.push({
        name: roster[`week${currentWeek}_${currentPlayerStr}`],
        points: stats[`week${currentWeek}_${currentPlayerStr}`],
      });
    }

    return {
      teamName: team_name,
      roster: rosterArray,
    };
  }

  async registerFantasyTeam(playerID, teamName) {
    await this._sheet.write(this._sheetTables.FANTASY_TEAMS, [
      playerID,
      teamName,
    ]);
  }

  async placeWaiverClaim(
    teamID,
    managerID,
    playerID,
    playerName,
    timeStampStr
  ) {
    await this._sheet.write(this._sheetTables.WAIVERS, [
      teamID,
      managerID,
      playerID,
      playerName,
      timeStampStr,
    ]);
  }

  async getTeamsWaiverClaims(team_id) {
    return await this._sheet.findMany(this._sheetTables.WAIVERS, {
      team_id: {
        value: team_id,
      },
    });
  }

  async getFreeAgentsAndWaivers() {
    const signedUps = await this._sheet.listMany(
      this._sheetTables.PLAYERS_SIGNUP
    );
    const players = await this.getPlayers();

    // Filter out all players who have a team

    const NO_TEAM_ID = 0;

    const unsignedPlayers = signedUps.filter((signUp) => {
      const playerProfile = players.find(
        (player) => player.player_id === signUp.player_id
      );
      return playerProfile.current_team_id == NO_TEAM_ID;
    });

    const WAIVER_CODE = 1;

    const waiverPlayers = unsignedPlayers.filter(
      (signUp) => signUp.is_waiver == WAIVER_CODE
    );
    const freeAgentPlayers = unsignedPlayers.filter(
      (signUp) => signUp.is_waiver != WAIVER_CODE
    );

    return {
      waiverPlayers,
      freeAgentPlayers,
    };
  }

  async getFreeAgents() {
    const nonWaiverSignups = await this._sheet.findMany(
      this._sheetTables.PLAYERS_SIGNUP,
      {
        is_waiver: {
          value: 0,
        },
      }
    );

    const players = await this.getPlayers();

    return nonWaiverSignups.filter((signUp) => {
      const player =
        players.find((p) => p.player_id == signUp.player_id) ?? null;
      if (player === null) return false;

      const NO_TEAM_ID = 0;
      return player.current_team_id == NO_TEAM_ID;
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

  async getPlayers() {
    return await this._sheet.listMany(this._sheetTables.PLAYERS);
  }

  async getPlayer(playerID) {
    return await this._sheet.findOne(this._sheetTables.PLAYERS, {
      player_id: {
        value: playerID,
      },
    });
  }

  async getPlayerByName(playerName) {
    return await this._sheet.findOne(this._sheetTables.PLAYERS, {
      player_name: {
        value: playerName,
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

  async updateTeamsManagers(teamID, newManagerArray) {
    await this._sheet.findOneAndUpdate(
      this._sheetTables.TEAMS,
      [JSON.stringify(newManagerArray)],
      {
        team_id: {
          value: teamID,
        },
      },
      {
        header: "manager_player_ids",
      }
    );
  }

  async getManagersTeam(managerID, enforceOne = true) {
    return await this._sheet.findOne(
      this._sheetTables.TEAMS,
      {
        manager_player_ids: {
          value: managerID,
          isArraySearch: true,
        },
      },
      enforceOne
    );
  }

  async getTeamsAffiliate(teamID) {
    const teamProfile = await this._sheet.findOne(this._sheetTables.TEAMS, {
      team_id: {
        value: teamID,
      },
    });

    return await this._sheet.findOne(this._sheetTables.TEAMS, {
      team_id: {
        value: teamProfile.affiliate_team_id,
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
    return await this._sheet.findOne(this._sheetTables.PLAYERS, {
      discord_id: {
        value: discordID,
      },
    });
  }

  async getLastestPlayerID() {
    const playersArray = (await this.getPlayers()) ?? [];

    return playersArray.length;
  }

  async registerSignUp(signUpObj) {
    const { discordID, playerName } = signUpObj;

    const playerProfile = await this.getPlayerByDiscordID(discordID);

    const newPlayerId = (await this.getLastestPlayerID()) + 1;

    // If the player already has an account, we use his ID, else make a new one
    const playerID = playerProfile ? playerProfile.player_id : newPlayerId;

    const registerManager = new RegistrationManager(
      playerID,
      signUpObj,
      this._sheetTables
    );

    registerManager.validatePlayerName().validateAvailability();

    // Check if the player already has an account
    if (playerProfile) {
      // We dont have to create a new player or a new discord ID

      // Check if hes signed up already, will throw an error
      await registerManager.validateIfNotAlreadySignedUp();
    } else {
      await registerManager.registerPlayer();
    }

    // Last thing, check if that name is already used

    await registerManager.validateNameAlreadyUsed(playerName);

    await registerManager.registerSignUpApplication();
  }
}

const mainDatabase = new MasterSheetManager(MasterSheet, SHEET_TABLES);

module.exports = mainDatabase;
