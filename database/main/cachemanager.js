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

  async getPlayer(playerID) {}

  async getPlayerByDiscordID(discordID) {}
};
