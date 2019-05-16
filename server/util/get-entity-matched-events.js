const _ = require("lodash");

const getEntityMatchedEvents = (triggeredEvents, notifyEvents) => {
  const matchedEvents = _.filter(triggeredEvents, event =>
    _.includes(notifyEvents, event.event)
  );
  return matchedEvents;
};

module.exports = getEntityMatchedEvents;
