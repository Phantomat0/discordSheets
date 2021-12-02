// Allows for caching of players
module.exports = class CacheManager {
  constructor(database) {
    this._database = database;
    this._cache = {};
  }

  #getCache(name) {
    return this._cache[name] ?? null;
  }

  #setCache(name, value) {
    this._cache[name] = value;
  }

  async loadCache(cacheName, databaseQueryFunction) {
    console.log("Loading Cache...");

    // We lost 'this' value when passing the function as a param
    databaseQueryFunction = databaseQueryFunction.bind(this._database);

    const queryRes = await databaseQueryFunction();

    this.#setCache(cacheName, queryRes);

    return this;
  }

  findInvalidPlayerName(playerArray) {
    return (
      playerArray.find(
        (playerName) => this.getPlayerByName(playerName) === null
      ) ?? null
    );
  }

  getPlayerByName(playerName) {
    const players = this.#getCache("players");

    if (!players) throw new Error("Cache not loaded");

    return (
      players.find(
        (player) =>
          player.player_name.toLowerCase() === playerName.toLowerCase()
      ) ?? null
    );
  }

  getTeam(teamID) {
    const teams = this.#getCache("teams");

    if (!teams) throw new Error("Cache not loaded");

    return teams.find((team) => team.team_id == teamID) ?? null;
  }

  getTeamsDivisionAffiliate(teamID, divisionID) {
    const teams = this.#getCache("teams");
    if (!teams) throw new Error("Cache not loaded");
    const teamProfile = teams.find((team) => team.team_id == teamID) ?? null;

    // Return null if they are a free agent
    if (teamProfile === null) return null;
    if (teamProfile.division_id == divisionID) return teamProfile;
    const affiliateTeamIDs = JSON.parse(teamProfile.affiliate_team_ids);
    const affiliateTeamProfiles = affiliateTeamIDs.map((id) => {
      return teams.find((team) => team.team_id == id) ?? null;
    });

    console.log(affiliateTeamProfiles);

    const [team] =
      affiliateTeamProfiles.filter((team) => team.division_id == divisionID) ??
      null;

    return team;
  }

  getPlayersByTeam(teamID) {
    const players = this.#getCache("players");

    if (!players) throw new Error("Cache not loaded");

    return players.filter((player) => player.current_team_id == teamID) ?? null;
  }

  getPlayer(playerID) {
    const players = this.#getCache("players");

    if (!players) throw new Error("Cache not loaded");

    return players.find((player) => player.player_id == playerID) ?? null;
  }

  async getPlayerByDiscordID(discordID) {}
};
