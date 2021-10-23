const { MessageEmbed } = require("discord.js");
const { GreenCheck } = require("./icons");

const EmbedGenerator = (options) => {
  const { color = "", emoji = "" } = options;
  return (title, description = null) => {
    return new MessageEmbed()
      .setColor(color)
      .setTitle(`${emoji} ${title}`)
      .setDescription(`${description}`);
  };
};

const successEmbedCreator = EmbedGenerator({
  color: "#75FF33",
  emoji: GreenCheck,
});
const failureEmbed = EmbedGenerator({ color: "#75FF33", emoji: GreenCheck });

module.exports = {
  successEmbedCreator,
};
