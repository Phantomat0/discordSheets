const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageAttachment } = require("discord.js");
const nodeHtmlToImage = require("node-html-to-image");

const _htmlTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <style>
      body {
        font-family: "Poppins", Arial, Helvetica, sans-serif;
        background: rgb(22, 22, 22);
        color: #fff;
        max-width: 300px;
      }

      .app {
        max-width: 300px;
        padding: 20px;
        display: flex;
        flex-direction: row;
        border-top: 3px solid rgb(16, 180, 209);
        background: rgb(31, 31, 31);
        align-items: center;
      }

      img {
        width: 50px;
        height: 50px;
        margin-right: 20px;
        border-radius: 50%;
        border: 1px solid #fff;
        padding: 5px;
      }
    </style>
  </head>
  <body>
    <div class="app">
      <h4>Welcome LEBRONZO!</h4>
    </div>
  </body>
</html>
`;

module.exports = {
  allowedRoles: ["Admin"],
  allowedChannels: [],
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test Database"),
  async execute(interaction) {
    const images = await nodeHtmlToImage({
      html: _htmlTemplate,
      quality: 100,
      type: "jpeg",
      puppeteerArgs: {
        args: ["--no-sandbox"],
      },
      encoding: "buffer",
    });

    await interaction.editReply(new MessageAttachment(images, `Stuff`));
  },
};
