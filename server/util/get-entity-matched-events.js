const _ = require("lodash");

const belongsToSegment = (sync_segment, entitySegmentIds) => {
  // sync_segments will be undefined if a manifest has not been refreshed
  if (sync_segment === undefined) {
    sync_segment = "ALL";
  }
  return sync_segment === "ALL" || _.includes(entitySegmentIds, sync_segment);
};

// if keeping old global filter rule, comment out synchronized segments/belongsToSegment check
const getEntityMatchedEvents = (triggeredEvents, notifyEvents, entitySegmentIds) => {
  let event_hash = [];

  if (notifyEvents.length) {
    const event_names = _.map(triggeredEvents, "event");

    event_hash = _.compact(
      _.uniq(
        _.map(notifyEvents, ({ event, synchronized_segment }) => {
          if (
            _.includes(event_names, event) &&
            belongsToSegment(synchronized_segment, entitySegmentIds)
          ) {
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
