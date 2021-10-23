const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { CLIENT_ID, GUILD_ID, TOKEN } = require("./config/config");

const commandFiles = fs
  .readdirSync("discord/commands")
  .filter((file) => file.endsWith(".js"));

const commandsArray = commandFiles.map((file) => {
  const command = require(`./commands/${file}`);
  return command.data.toJSON();
});

const rest = new REST({ version: "9" }).setToken(TOKEN);

rest
  .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commandsArray,
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
