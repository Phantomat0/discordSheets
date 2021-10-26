const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { INFORMATION_ID } = require("../config/channels");
const {
  ANNOUNCEMENT_ROLE_ID,
  MEDIA_ROLE_ID,
  SCORES_ROLE_ID,
} = require("../config/roles");
const {
  WavingHand,
  PageCurled,
  SmallWhiteSquare,
  QuestionMark,
  Bell,
} = require("../icons");

async function sendInformation(client) {
  const rolePings = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("announcement")
      .setLabel("Announcement")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("media")
      .setLabel("Media")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("scores")
      .setLabel("Scores")
      .setStyle("PRIMARY")
  );

  const embed1 = new MessageEmbed()
    .setTitle(`${WavingHand} Welcome to American Futsal!`)
    .setColor("#FF0055")
    .setDescription("North America's most profound futsal league!");

  const embed2 = new MessageEmbed()
    .setTitle(`${PageCurled} Rules`)
    .setColor("#badc58").setDescription(`
      ${SmallWhiteSquare} Spamming

      ${SmallWhiteSquare} Offensive nicknames

      ${SmallWhiteSquare} Excessive mentioning of users and roles

      ${SmallWhiteSquare} Links to dangerous and explicit websites

      ${SmallWhiteSquare} Sexually explicit content.

      ${SmallWhiteSquare} Hate speech

      ${SmallWhiteSquare} Images of gore and/or animal cruelty.

      ${SmallWhiteSquare} Sexual Harassment

      ${SmallWhiteSquare} Racial slurs intentionally used to offend a member(s)

      ${SmallWhiteSquare} Dox attempts and threats

      ${SmallWhiteSquare} Threats of violence
  `);

  const embed3 = new MessageEmbed()
    .setTitle(`${QuestionMark} FAQ`)
    .setColor("#686de0")
    .addField(
      "How do I join a team?",
      `To join a team, you must first register for the league. Begin by going to <#892959251788615712> and using the /register command and filling out the form. From there, you wait to be picked up by a team.`,
      false
    )
    .addField(
      "What if I am an inexperienced or new player?",
      "Thankfully, the league is split into two divisions, D1 for more experienced players and D2 for intermediate/new players who are looking to prove themselves.",
      false
    )
    .addField(
      "When are games played?",
      `D1: Tuesdays and Thursdays 7PM EST \n D2: Tuesdays and Thursdays 6PM EST`,
      false
    )
    .addField(
      "I have a suggestion for the league and or want to help out with the league?",
      `You can post any suggestions in <#888561683520430130>. We are always open to players looking to offer to help in any way they can, please direct any such requests to an <@&887376620602671185>`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the public rooms?",
      `All public rooms are overseen by the <@&894715039687274516>`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the Discord?",
      `Any issues or concerns regarding the Discord should be forwared to a @Moderator`,
      false
    );

  const embed4 = new MessageEmbed()
    .setTitle(`${Bell} Notifications`)
    .setColor("#FFAD33")
    .setDescription(`No one likes constant pings, thats why we only @everyone for league wide announcements.

    Click the appropriate button if you would like to be notified of other smaller announcements. Click again to remove the notification role.`);

  await client.channels.cache.get(INFORMATION_ID).send({
    embeds: [embed1, embed2, embed3, embed4],
    components: [rolePings],
  });

  const currentChannel = await client.channels.cache.get(INFORMATION_ID);

  const collector = currentChannel.createMessageComponentCollector({
    componentType: "BUTTON",
  });

  collector.on("collect", async (buttonInteraction) => {
    const discordMember = buttonInteraction.member;

    const roleMap = new Map([
      ["announcement", ANNOUNCEMENT_ROLE_ID],
      ["media", MEDIA_ROLE_ID],
      ["scores", SCORES_ROLE_ID],
    ]);

    const roleToGive = roleMap.get(buttonInteraction.customId);

    if (!roleToGive) return;

    const hasRole = discordMember.roles.cache.some(
      (role) => role.id == roleToGive
    );

    if (hasRole) {
      discordMember.roles.remove(roleToGive);
    } else {
      discordMember.roles.add(roleToGive);
    }

    buttonInteraction.deferUpdate();
  });
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log("Ready!");

    // sendInformation(client);

    // const signedUpPlayersEmbed = new MessageEmbed().setTitle("HEY!!!");

    // await client.channels.cache.get(REGISTERED_LIST_ID).send({
    //   embeds: [signedUpPlayersEmbed],
    // });

    // await client.channels.cache
    //   .get(REGISTERED_LIST_ID)
    //   .messages.fetch(REGISTERED_LIST_MESSAGE_ID)
    //   .then((message) => message.edit({ embeds: [signedUpPlayersEmbed] }));
  },
};
