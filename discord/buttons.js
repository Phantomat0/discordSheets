const { MessageActionRow, MessageButton } = require("discord.js");

const cancelButton = new MessageButton()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle("SECONDARY");

const getConfirmButton = (id) =>
  new MessageButton().setCustomId(id).setLabel("Confirm").setStyle("SUCCESS");

const getCancelAndConfirmButtonRow = (confirmID) => {
  return new MessageActionRow().addComponents(
    getConfirmButton(confirmID),
    cancelButton
  );
};

module.exports = { getCancelAndConfirmButtonRow };
