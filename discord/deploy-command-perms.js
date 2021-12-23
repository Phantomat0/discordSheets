const { GUILD_ID } = require("./config/config");
const { ADMIN_ROLE_ID } = require("./config/roles");

const getCommandsMapAndPermissions = async (client) => {
  const commandsWithPermissionsArray = [];

  client.commands.forEach((v, k) => {
    commandsWithPermissionsArray.push([k, v.allowedRoles]);
  });

  if (!client.application?.owner) await client.application?.fetch();

  console.log(client.guilds.cache.get(GUILD_ID));

  // We have to use a forEach cause Discord uses collections and they dont conver to arrrays for some reason
  const commandsMap = await client.guilds.cache.get(GUILD_ID).commands.fetch();

  const commandsWithId = {};

  commandsMap.forEach((v, k) => {
    commandsWithId[v.name] = k;
  });

  return [commandsWithPermissionsArray, commandsWithId];
};

const deployCommandPermissions = async (client) => {
  const [commandsWithRoleIDs, commandsWithId] =
    await getCommandsMapAndPermissions(client);

  console.log(commandsWithId);
  const everyoneID = await client.guilds.cache.get(GUILD_ID).roles.everyone.id;

  // await client.guilds.cache.get(GUILD_ID).commands.permissions.remove({
  //   command: "902291572920578158",
  //   roles: [everyoneID],
  // });

  return;

  /// Admins get default access to all commands with perms
  const adminDefaultPerms = {
    id: ADMIN_ROLE_ID,
    type: "ROLE",
    permission: true,
  };

  // If we need to add perms to a command, we have to disable it for everyone
  const defaultRemovePerms = {
    id: everyoneID,
    type: "ROLE",
    permission: false,
  };

  // await client.guilds.cache.get(GUILD_ID).commands.permissions.add({
  //   command: "895020258795069540",
  //   permissions: [defaultRemovePerms],
  // });

  const fullPermissions = commandsWithRoleIDs.reduce(
    (permissionArray, command) => {
      const [cmdName, cmdRoleIds] = command;

      // If the command doesnt have any perms, we dont have to do anything
      if (cmdRoleIds.length === 0) return permissionArray;

      // Filter out admin role, since admin role is added by default, but we have to add it to the command object so we can bypass the skip above and defaultRemovePerms
      const cmdPerms = cmdRoleIds
        .filter((roleId) => roleId !== ADMIN_ROLE_ID)
        .map((roleID) => {
          return {
            id: roleID,
            type: "ROLE",
            permission: true,
          };
        });

      permissionArray.push({
        name: cmdName,
        id: commandsWithId[cmdName],
        permissions: [adminDefaultPerms, defaultRemovePerms, ...cmdPerms],
      });

      return permissionArray;
    },
    []
  );

  console.log(fullPermissions);

  //   await client.guilds.cache
  //     .get(GUILD_ID)
  //     .commands.permissions.set({ fullPermissions });

  //   console.log(
  //     await client.guilds.cache.get(GUILD_ID).commands.permissions.fetch()
  //   );

  // await command.permissions.add({ permissions });

  // console.log(command.permissions);

  // await command.permissions.remove({
  //   command: "895020258795069540",
  //   users: ["296070049062584321"],
  // });
};

module.exports = deployCommandPermissions;
