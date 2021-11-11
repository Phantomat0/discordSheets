const { MessageEmbed } = require("discord.js");
const { GreenCheck } = require("./icons");

const EmbedGenerator = (options) => {
  const { color = "", emoji = "" } = options;
  return (title, description = null) => {
    const embed = new MessageEmbed()
      .setColor(color)
      .setTitle(`${emoji}  ${title}`);
    if (description) {
      embed.setDescription(`${description}`);
    }
    return embed;
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
