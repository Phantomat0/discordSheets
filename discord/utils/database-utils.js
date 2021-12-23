const mainDatabase = require("../../database/main/main");
const { InvalidPermissionError, CommandError } = require("./errors");

const getDivisionPermsIntOfTeam = (teamProfile) => {
  // Permissions expressed as an int
  const DIVISION_PERMISSIONS_MAP = {
    1: 10,
    2: 9,
    3: 8,
  };

  return DIVISION_PERMISSIONS_MAP[teamProfile.division_id];
};

const validateRosterSize = async (teamProfile) => {
  const { division_id, team_id } = teamProfile;
  const { roster_limit_d1, roster_limit_d2, roster_limit_d3 } =
    await mainDatabase.getConfig();
  const teamPlayers = await mainDatabase.getPlayersByTeam(team_id);

  const ROSTER_LIMITS_MAP = {
    1: roster_limit_d1,
    2: roster_limit_d2,
    3: roster_limit_d3,
  };

  const rosterLimitForTeamsDivision = ROSTER_LIMITS_MAP[division_id];

  if (teamPlayers.length == rosterLimitForTeamsDivision)
    throw new CommandError(
      `Insufficient Roster Space`,
      `Such a signing would put your team over the roster limit of **${rosterLimitForTeamsDivision}** for this division.`
    );
};

const hasManagerPermsOfTeam = (managerTeam, teamProfile) => {
  console.log(managerTeam, teamProfile);
  const managerAccessLevel = getDivisionPermsIntOfTeam(managerTeam);
  const teamAccessLevel = getDivisionPermsIntOfTeam(teamProfile);

  console.log(managerAccessLevel, teamAccessLevel);
  // To manage a team you must have equal or higher perms than the team you want to manage

  return managerAccessLevel >= teamAccessLevel;
};

const getTeamByDivisionOption = async (divisionOption, teamProfile) => {
  const teamsAffiliates = await mainDatabase.getTeamsAffiliates(teamProfile);

  const organizationsTeams = [...teamsAffiliates, teamProfile];

  return organizationsTeams.find((team) => team.division_id == divisionOption);
};

const getManagerAndTeamFromInteractionUser = async (discordID) => {
  const managerProfile = await mainDatabase.getPlayerByDiscordID(discordID);

  if (managerProfile === null)
    throw new InvalidPermissionError(
      `You are not registered as a player in the database`
    );

  const managerTeamProfile = await mainDatabase.getManagersTeam(
    managerProfile.player_id
  );

  if (managerTeamProfile === null)
    throw new InvalidPermissionError(
      `That team does not exist or you are not a manager of it`
    );

  return {
    managerProfile,
    managerTeamProfile,
  };
};

function getTeamManagerIDs(teamProfile) {
  const { manager_player_ids } = teamProfile;
  const managersArray = JSON.parse(manager_player_ids);

  const [generalManagerID = null, ...assistantManagerIDs] = managersArray;

  return {
    generalManagerID,
    assistantManagerIDs: assistantManagerIDs ?? [],
  };
}

module.exports = {
  getTeamByDivisionOption,
  getManagerAndTeamFromInteractionUser,
  getTeamManagerIDs,
  hasManagerPermsOfTeam,
  getDivisionPermsIntOfTeam,
  validateRosterSize,
};
