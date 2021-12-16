const { MasterSheet } = require("../../sheets/sheet");
const RegistrationManager = require("./registration");
const AsciiTable = require("ascii-table");
const CacheManager = require("./cachemanager");

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
    range: "teams!A1:K",
  },
  WAIVERS: {
    name: "waiver-claims",
    range: "waiver-claims!A1:E",
  },
  FANTASY_TEAMS: {
    name: "fantasy-teams",
    range: "fantasy-teams!A1:AC",
  },
  FANTASY_RANKINGS: {
    name: "fantasy-rankings",
    range: "fantasy-rankings!A1:D",
  },
  FANTASY_PLAYER_RANKINGS: {
    name: "fantasy-stats-all",
    range: "fantasy-stats-all!A1:G",
  },
  FANTASY_CURRENT: {
    name: "fantasy-currentweek",
    range: "fantasy-currentweek!A1:G",
  },
  D1_STATS: {
    name: "statsd1",
    range: "statsd1!A1:P",
  },
  D2_STATS: {
    name: "statsd2",
    range: "statsd2!A1:P",
  },
  D3_STATS: {
    name: "statsd3",
    range: "statsd3!A1:P",
  },
  D1_AWARDS: {
    name: "awards_d1",
    range: "awards_d1!A1:I",
  },
  D2_AWARDS: {
    name: "awards_d2",
    range: "awards_d2!A1:H",
  },
  TEST: {
    name: "stuff",
    range: "stuff!A1:B",
  },
  CONFIG: {
    name: "config",
    range: "config!A1:H2",
  },
  TOURNAMENT: {
    name: "tournament",
    range: "tournament!A1:B",
  },
  MUTED: {
    name: "muted",
    range: "muted!A1:I",
  },
  DRAFT: {
    name: "draft",
    range: "draft!A1:E97",
  },
};

class MasterSheetManager {
  constructor(sheetObj, sheets, cacheManager) {
    this._sheet = sheetObj;
    this._sheetTables = sheets;
    this.cache = cacheManager;
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

  async getFantasyRankingsCurrentWeek() {
    const fantasyPlayerRankings = await this._sheet.listMany(
      this._sheetTables.FANTASY_CURRENT
    );

    // Only return the first twenty
    const sortedRankings = fantasyPlayerRankings
      .filter((player) => player.fantasy_points != 0)
      .sort((a, b) => b.fantasy_points - a.fantasy_points)
      .slice(0, 20);

    const rankingTable = new AsciiTable().setHeading(
      "Rank",
      "Player",
      "Total Points"
    );

    sortedRankings.forEach((player, index) => {
      rankingTable.addRow(index + 1, player.player_name, player.fantasy_points);
    });

    return rankingTable.removeBorder().toString();
  }

  async getPlayerFantasy(playerID) {
    return await this._sheet.findMany(this._sheetTables.FANTASY_TEAMS, {
      player_id: {
        value: playerID,
      },
    });
  }

  async getFantasyTeamRankingsTable() {
    const fantasyRankings = await this._sheet.listMany(
      this._sheetTables.FANTASY_RANKINGS
    );

    const sortedRankings = fantasyRankings.sort(
      (a, b) => b.total_points - a.total_points
    );

    const rankingTable = new AsciiTable().setHeading(
      "Rank",
      "Team",
      "Player",
      "Total Points"
    );

    sortedRankings.forEach((team, index) => {
      rankingTable.addRow(
        index + 1,
        team.team_name,
        team.player_name,
        team.total_points
      );
    });

    return rankingTable.removeBorder().toString();
  }

  async getPlayerStats(playerProfile) {
    const statsProfileD1 = await this._sheet.findOne(
      this._sheetTables.D1_STATS,
      {
        player_name: {
          value: playerProfile.player_name,
        },
      },
      false
    );

    const statsProfileD2 = await this._sheet.findOne(
      this._sheetTables.D2_STATS,
      {
        player_name: {
          value: playerProfile.player_name,
        },
      },
      false
    );

    const statsProfileD3 = await this._sheet.findOne(
      this._sheetTables.D3_STATS,
      {
        player_name: {
          value: playerProfile.player_name,
        },
      },
      false
    );

    return {
      statsProfileD1,
      statsProfileD2,
      statsProfileD3,
    };
  }

  async getFantasyPlayerRankingsTable() {
    const fantasyPlayerRankings = await this._sheet.listMany(
      this._sheetTables.FANTASY_PLAYER_RANKINGS
    );

    // Only return the first twenty
    const sortedRankings = fantasyPlayerRankings
      .filter((player) => player.fantasy_points != 0)
      .sort((a, b) => b.fantasy_points - a.fantasy_points)
      .slice(0, 20);

    const rankingTable = new AsciiTable().setHeading(
      "Rank",
      "Player",
      "Total Points"
    );

    sortedRankings.forEach((player, index) => {
      rankingTable.addRow(index + 1, player.player_name, player.fantasy_points);
    });

    return rankingTable.removeBorder().toString();
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
    for (let i = 0; i < 5; i++) {
      const currentPlayerStr = `player${i + 1}`;
      rosterArray.push({
        name: roster[`week${currentWeek}_${currentPlayerStr}`],
        points: stats[`week${currentWeek}_${currentPlayerStr}`],
      });
    }

    return {
      teamName: team_name,
      roster: rosterArray,
      totalPoints: stats.total_points,
    };
  }

  async registerFantasyTeam(playerID, teamName) {
    await this._sheet.write(this._sheetTables.FANTASY_TEAMS, [
      playerID,
      teamName,
    ]);
  }

  async getTournyPlayers() {
    return this._sheet.listMany(this._sheetTables.TOURNAMENT);
  }

  async draftPlayer(playerProfile) {
    const draftBoard = await this._sheet.listMany(this._sheetTables.DRAFT);

    // Find the first object that doesnt have a "draftee" value, that means there hasn't been a selection yet
    const currentPickRow = draftBoard.find(
      (pick) => pick.hasOwnProperty("draftee") === false
    );

    console.log(currentPickRow);

    this._sheet.findOneAndUpdate(
      this._sheetTables.DRAFT,
      [playerProfile.player_name],
      {
        overall: {
          value: currentPickRow.overall,
        },
      },
      { header: `draftee` }
    );

    const teamDrafting = await this.getTeamByName(currentPickRow.team_drafting);

    // Also set that player to the team

    this.updatePlayerTeam(playerProfile.player_id, teamDrafting.team_id);

    return {
      teamDrafting,
      teamPickName: currentPickRow.team_pick,
      round: currentPickRow.round,
      overall: currentPickRow.overall,
    };
  }

  async checkIfSignedUpTournament(playerID) {
    const signUp = await this._sheet.findOne(
      this._sheetTables.TOURNAMENT,
      {
        player_id: {
          value: playerID,
        },
      },
      false
    );

    if (signUp) return true;
    return false;
  }

  async registerPlayerTournament(playerProfile) {
    await this._sheet.write(this._sheetTables.TOURNAMENT, [
      playerProfile.player_id,
      playerProfile.player_name,
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

  async getTeamByName(teamName) {
    if (!this._teams) {
      this._teams = await this._sheet.listMany(this._sheetTables.TEAMS);
    }

    return this._teams.find((team) => team.name == teamName);
    // return await this._sheet.findOne(this._sheetTables.TEAMS, {
    //   name: {
    //     value: teamName,
    //   },
    // });
  }

  async checkIfVoted(divison, playerID) {
    const sheet =
      divison === "division_1"
        ? this._sheetTables.D1_AWARDS
        : this._sheetTables.D2_AWARDS;

    const awards = await this._sheet.listMany(sheet);

    return awards.some((player) => player.player_id == playerID);
  }

  async processAwardVotes(divison, voteArray) {
    const sheet =
      divison === "division_1"
        ? this._sheetTables.D1_AWARDS
        : this._sheetTables.D2_AWARDS;
    this._sheet.write(sheet, voteArray);
  }

  async getTeams() {
    return await this._sheet.listMany(this._sheetTables.TEAMS);
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

  async getTeamsAffiliates(teamProfile) {
    const affiliateTeamIDs = JSON.parse(teamProfile.affiliate_team_ids);

    return Promise.all(
      affiliateTeamIDs.map(async (teamID) => {
        return await this._sheet.findOne(this._sheetTables.TEAMS, {
          team_id: {
            value: teamID,
          },
        });
      })
    );
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

  async getMutedUsers() {
    return await this._sheet.listMany(this._sheetTables.MUTED);
  }

  async addUserToMuted({
    muted_id,
    muted_name,
    muted_by_id,
    muted_by_name,
    time_of_mute,
    reason,
    duration,
    info,
    message_link,
  }) {
    await this._sheet.write(this._sheetTables.MUTED, [
      muted_id,
      muted_name,
      muted_by_id,
      muted_by_name,
      time_of_mute,
      reason,
      duration,
      info,
      message_link,
    ]);
  }

  async removeMutedUser(discordID) {
    // This works by making all the values for a row empty
    return await this._sheet.findOneAndUpdate(
      SHEET_TABLES.MUTED,
      ["", "", "", "", "", "", "", "", ""],
      {
        discord_id: {
          value: discordID,
        },
      },
      { header: "discord_id" }
    );
  }

  async getLastestPlayerID() {
    const playersArray = (await this.getPlayers()) ?? [];

    const lastPlayer = playersArray[playersArray.length - 1];

    return parseInt(lastPlayer.player_id);
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

const mainDatabase = new MasterSheetManager(
  MasterSheet,
  SHEET_TABLES,
  CacheManager
);

module.exports = mainDatabase;
