const _ = require("lodash");

const getEntityMatchedEvents = (triggeredEvents, notifyEvents) => {
  let event_hash = [];

  if (notifyEvents.length) {
    const event_names = _.map(triggeredEvents, "event");

    event_hash = _.compact(
      _.uniq(
        _.forEach(notifyEvents, event => {
          if (_.includes(event_names, event)) {
            return event;
          }
          return undefined;
        })
      )
    );
  }

  return event_hash;
};

module.exports = getEntityMatchedEvents;
