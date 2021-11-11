const mainDatabase = require("../../database/main/main");
const { InvalidPermissionError } = require("./errors");

const getTeamByDivisionOption = async (divisionOption, teamProfile) => {
  if (teamProfile.division_id == 2 && divisionOption === "division_1")
    throw new InvalidPermissionError(
      `You are not a manager of a division one team`
    );

  return divisionOption === "division_1" || teamProfile.division_id == 2
    ? teamProfile
    : await mainDatabase.getTeamsAffiliate(teamProfile.team_id);
};

const getManagerAndTeamFromInteractionUser = async (interactionUserID) => {
  const managerProfile = await mainDatabase.getPlayerByDiscordID(
    interactionUserID
  );

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
};
