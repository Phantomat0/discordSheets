const fs = require("fs");
const {
  Client,
  Collection,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const bot = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const { TOKEN } = require("./config.json");
const {
  QuestionMark,
  PageCurled,
  WavingHand,
  SmallWhiteSquare,
  OkHand,
  X,
} = require("./icons");

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

bot.login(TOKEN);

bot.once("ready", async () => {
  console.log("Ready!");

  // const roomLinks = new MessageActionRow().addComponents(
  //   new MessageButton()
  //     .setLabel("4v4 Competitive")
  //     .setURL("https://www.haxball.com/play?c=Wv3cUCHyN9c")
  //     .setStyle("LINK"),
  //   new MessageButton()
  //     .setLabel("3v3 Casual")
  //     .setURL("https://www.haxball.com/play?c=5XY6swWQ1pM")
  //     .setStyle("LINK"),
  //   new MessageButton()
  //     .setLabel("1v1 Casual")
  //     .setURL("https://www.haxball.com/play?c=1ynTdimRUyk")
  //     .setStyle("LINK")
  // );

  // const embed1 = new MessageEmbed()
  //   .setTitle(`${WavingHand} Welcome to American Futsal!`)
  //   .setColor("#FF0055")
  //   .setDescription("North America's most profound futsal league!");

  // const embed2 = new MessageEmbed()
  //   .setTitle(`${PageCurled} Rules`)
  //   .setColor("#badc58").setDescription(`
  //     ${SmallWhiteSquare} Spamming

  //     ${SmallWhiteSquare} Offensive nicknames

  //     ${SmallWhiteSquare} Excessive mentioning of users and roles

  //     ${SmallWhiteSquare} Links to dangerous and explicit websites

  //     ${SmallWhiteSquare} Sexually explicit content.

  //     ${SmallWhiteSquare} Hate speech

  //     ${SmallWhiteSquare} Images of gore and/or animal cruelty.

  //     ${SmallWhiteSquare} Sexual Harassment

  //     ${SmallWhiteSquare} Racial slurs intentionally used to offend a member(s)

  //     ${SmallWhiteSquare} Dox attempts and threats

  //     ${SmallWhiteSquare} Threats of violence
  // `);

  // const embed3 = new MessageEmbed()
  //   .setTitle(`${QuestionMark} FAQ`)
  //   .setColor("#686de0")
  //   .addField(
  //     "How do I join a team?",
  //     `To join a team, you must first register for the league. Begin by going to <#892959251788615712> and using the /register command and filling out the form. From there, you wait to be picked up by a team.`,
  //     false
  //   )
  //   .addField(
  //     "What if I am an inexperienced or new player?",
  //     "Thankfully, the league is split into two divisions, D1 for more experienced players and D2 for intermediate/new players who are looking to prove themselves.",
  //     false
  //   )
  //   .addField(
  //     "When are games played?",
  //     `D1: Tuesdays and Thursdays 7PM EST \n D2: Tuesdays and Thursdays 6PM EST`,
  //     false
  //   )
  //   .addField(
  //     "I have a suggestion for the league and or want to help out with the league?",
  //     `You can post any suggestions in <#888561683520430130>. We are always open to players looking to offer to help in any way they can, please direct any such requests to an <@&887376620602671185>`,
  //     false
  //   )
  //   .addField(
  //     "Who do I contact regarding an issue with the public rooms?",
  //     `All public rooms are overseen by the <@&894715039687274516>`,
  //     false
  //   )
  //   .addField(
  //     "Who do I contact regarding an issue with the Discord?",
  //     `Any issues or concerns regarding the Discord should be forwared to a @Moderator`,
  //     false
  //   );

  // await bot.channels.cache
  //   .get("892972408376537108")
  //   .send({ embeds: [embed1, embed2, embed3], components: [roomLinks] });
});

bot.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const REGISTRATION_CHANNEL_ID = "892959251788615712";
  const SUGGESTION_CHANNEL_ID = "888561683520430130";
  if (message.channel.id === REGISTRATION_CHANNEL_ID) {
    await message.delete();
  }

  if (message.channel.id === SUGGESTION_CHANNEL_ID) {
    message.react(OkHand);
    message.react(X);
  }
});

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = bot.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, bot);
  } catch (error) {
    console.error(error);

    const errorEmbed = new MessageEmbed()
      .setColor("#C70039")
      .setTitle("Command Error")
      .setDescription("There was an error while executing this command!");

    await interaction.reply({
      embeds: [errorEmbed],
      ephemeral: true,
    });
  }
});
