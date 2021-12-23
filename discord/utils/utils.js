const getDateTimeString = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
    timeZone: "America/Chicago",
  });
};

const plural = (number, singular, plural) => {
  return `${number} ${number === 1 ? singular : plural}`;
};

const randomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

module.exports = {
  getDateTimeString,
  plural,
  randomInRange,
};
