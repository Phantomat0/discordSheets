const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../database/main/main");
const { getTeamManagerIDs } = require("./utils/database-utils");
const {
  D1_ID,
  D2_ID,
  D3_ID,
  D1_MESSAGE_ID,
  D2_MESSAGE_ID,
  D3_MESSAGE_ID,
} = require("./config/channels");
const CacheManager = require("../database/main/cachemanager");

const getAllTeamEmbeds = async () => {
  const teams = await mainDatabase.getTeams();

  const PlayersManager = await new CacheManager(mainDatabase).loadCache(
    "players",
    mainDatabase.getPlayers
  );

  const d1Teams = teams.filter((team) => team.division_id == "1");
  const d2Teams = teams.filter((team) => team.division_id == "2");
  const d3Teams = teams.filter((team) => team.division_id == "3");

  const d1TeamEmbeds = await Promise.all(
    d1Teams.map(async (team) => {
      const teamRoster = PlayersManager.getPlayersByTeam(team.team_id);
      return await generateTeamEmbed(team, teamRoster, PlayersManager);
    })
  );

  const d2TeamEmbeds = await Promise.all(
    d2Teams.map(async (team) => {
      const teamRoster = PlayersManager.getPlayersByTeam(team.team_id);
      return await generateTeamEmbed(team, teamRoster, PlayersManager);
    })
  );

  const d3TeamEmbeds = await Promise.all(
    d3Teams.map(async (team) => {
      const teamRoster = PlayersManager.getPlayersByTeam(team.team_id);
      return await generateTeamEmbed(team, teamRoster, PlayersManager);
    })
  );

  return {
    d1TeamEmbeds,
    d2TeamEmbeds,
    d3TeamEmbeds,
  };
};

const generateTeamEmbed = async (teamProfile, teamRoster, PlayersManager) => {
  const teamPlayersMappedStr = teamRoster
    .map((player) => `${player.player_name} <@${player.discord_id}>`)
    .join("\n");

  const teamRosterStr =
    teamPlayersMappedStr.length === 0 ? "N/A" : teamPlayersMappedStr;

  const { generalManagerID, assistantManagerIDs } =
    getTeamManagerIDs(teamProfile);

  const generalManagerNameProfile = generalManagerID
    ? PlayersManager.getPlayer(generalManagerID)
    : null;

  const assistantManagersMappedStr = assistantManagerIDs
    .map((playerID) => {
      const playerProfile = PlayersManager.getPlayer(playerID);
      return playerProfile.player_name;
    })
    .join("\n");

  const affiliateTeams = await mainDatabase.getTeamsAffiliates(teamProfile);

  const affiliateTeamsStr = affiliateTeams.map((team) => team.name).join(", ");

  return new MessageEmbed()
    .setTitle(teamProfile.name)
    .setColor(teamProfile.color)
    .setThumbnail(teamProfile.logo_url)
    .setDescription(
      `**Affiliates: **${affiliateTeamsStr}\n**Manager**: ${
        generalManagerNameProfile?.player_name ?? "None"
      }\n**Assistant Managers: **${assistantManagersMappedStr}`
    )
    .addField("Roster", teamRosterStr);
};

const updateTeamRosters = async (client) => {
  const { d1TeamEmbeds, d2TeamEmbeds, d3TeamEmbeds } = await getAllTeamEmbeds();

  client.channels.cache
    .get(D1_ID)
    .messages.fetch(D1_MESSAGE_ID)
    .then((message) => message.edit({ embeds: d1TeamEmbeds }));

  client.channels.cache
    .get(D2_ID)
    .messages.fetch(D2_MESSAGE_ID)
    .then((message) => message.edit({ embeds: d2TeamEmbeds }));

  client.channels.cache
    .get(D3_ID)
    .messages.fetch(D3_MESSAGE_ID)
    .then((message) => message.edit({ embeds: d3TeamEmbeds }));

  // client.channels.cache
  // .get(D3_ID)
  // .messages.fetch(D3_MESSAGE_ID)
  // .then((message) => message.edit({ embeds: d2TeamEmbeds }));
};

module.exports = updateTeamRosters;
