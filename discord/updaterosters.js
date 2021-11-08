const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../database/main/main");
const { getTeamManagerIDs } = require("./bot-util");
const {
  D1_ID,
  D2_ID,
  D1_MESSAGE_ID,
  D2_MESSAGE_ID,
} = require("./config/channels");

const getAllTeamEmbeds = async () => {
  const teams = await mainDatabase.getTeams();
  const players = await mainDatabase.getPlayers();

  const d1Teams = teams.filter((team) => team.division_id == "1");
  const d2Teams = teams.filter((team) => team.division_id == "2");

  const d1TeamEmbeds = await Promise.all(
    d1Teams.map(async (team) => {
      const teamRoster = players.filter(
        (player) => player.current_team_id == team.team_id
      );
      return await generateTeamEmbed(team, teamRoster, players);
    })
  );

  const d2TeamEmbeds = await Promise.all(
    d2Teams.map(async (team) => {
      const teamRoster = players.filter(
        (player) => player.current_team_id == team.team_id
      );
      return await generateTeamEmbed(team, teamRoster, players);
    })
  );

  return {
    d1TeamEmbeds,
    d2TeamEmbeds,
  };
};

const generateTeamEmbed = async (teamProfile, teamRoster, players) => {
  const teamPlayersMappedStr = teamRoster
    .map((player) => `${player.player_name} <@${player.discord_id}>`)
    .join("\n");

  const { generalManagerID, assistantManagerIDs } =
    getTeamManagerIDs(teamProfile);

  const generalManagerNameProfile = generalManagerID
    ? await mainDatabase.getPlayer(generalManagerID)
    : null;

  const assistantManagersMappedStr = assistantManagerIDs
    .map((playerID) => {
      const playerProfile = players.find(
        (player) => player.player_id == playerID
      );
      return playerProfile.player_name;
    })
    .join("\n");

  const affiliateTeamProfile = await mainDatabase.getTeamsAffiliate(
    teamProfile.team_id
  );

  return new MessageEmbed()
    .setTitle(teamProfile.name)
    .setColor(teamProfile.color)
    .setThumbnail(teamProfile.logo_url)
    .setDescription(
      `**Divison: ** ${teamProfile.division_id}\n**Affiliate Team: **${
        affiliateTeamProfile.name
      }\n**General Manager**: ${
        generalManagerNameProfile?.player_name ?? "None"
      }\n**Managers: **${assistantManagersMappedStr}`
    )
    .addField("Roster", teamPlayersMappedStr);
};

const updateTeamRosters = async (client) => {
  const { d1TeamEmbeds, d2TeamEmbeds } = await getAllTeamEmbeds();

  client.channels.cache
    .get(D1_ID)
    .messages.fetch(D1_MESSAGE_ID)
    .then((message) => message.edit({ embeds: d1TeamEmbeds }));

  client.channels.cache
    .get(D2_ID)
    .messages.fetch(D2_MESSAGE_ID)
    .then((message) => message.edit({ embeds: d2TeamEmbeds }));
};

module.exports = updateTeamRosters;
