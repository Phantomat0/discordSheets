require("dotenv").config();
const Discord = require("discord.js");
const { listMajors } = require("./index.js");
const bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", (msg) => {
  if (msg.content === "ping") {
    msg.reply("pong");
    listMajors();
  } else if (msg.content.startsWith("!kick")) {
    if (msg.mentions.users.size) {
      const taggedUser = msg.mentions.users.first();
      msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
    } else {
      msg.reply("Please tag a valid user!");
    }
  }
});
