const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { token } = require("./config.json");

bot.commands = new Collection();

const commandFiles = fs
  .readdirSync("discord/commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  bot.commands.set(command.data.name, command);
}

bot.login(token);

bot.once("ready", () => {
  console.log("Ready!");
});

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = bot.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});
